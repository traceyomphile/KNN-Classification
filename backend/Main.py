import csv
import io
from math import ceil
from pathlib import Path
from typing import Literal
import traceback

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.datasets import (
    load_iris,
    load_digits,
    load_wine,
    load_breast_cancer,
)
from sklearn.decomposition import PCA
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import (
    StratifiedKFold,
    train_test_split,
)
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder


DatasetName = Literal["iris", "digits", "wine", "breast_cancer"]

DATASET_LOADERS = {
    "iris": load_iris,
    "digits": load_digits,
    "wine": load_wine,
    "breast_cancer": load_breast_cancer,
}


class AnalysisRequest(BaseModel):
    dataset: DatasetName = "iris"
    train_ratio: float = Field(default=0.8, gt=0.5, lt=0.95)
    max_k: int = Field(default=50, ge=3, le=99)


app = FastAPI(
    title="KNN Classification Model",
    description="Runs K-Nearest Neighbours experiments on standard scikit-learn datasets",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_data(dataset_name: DatasetName):
    try:
        selected_dataset = DATASET_LOADERS[dataset_name]()
    except KeyError as error:
        valid_names = ", ".join(DATASET_LOADERS)
        raise ValueError(
            f"Unknown dataset '{dataset_name}'. Choose from: {valid_names}"
        ) from error

    X = selected_dataset.data
    y = selected_dataset.target
    class_names = selected_dataset.target_names.astype(str)
    return X, y, class_names


def get_class_distribution(y: np.ndarray, class_names: np.ndarray):
    counts = np.bincount(y, minlength=len(class_names))
    return [
        {
            "class_index": class_index,
            "class_name": str(class_names[class_index]),
            "samples": int(count),
        }
        for class_index, count in enumerate(counts)
    ]


def split_and_scale_data(
    X: np.ndarray,
    y: np.ndarray,
    train_ratio: float = 0.8,
):
    """Split first, then fit the scaler on training data only."""
    sample_ids = np.arange(len(X))

    (
        X_train,
        X_test,
        y_train,
        y_test,
        train_ids,
        test_ids,
    ) = train_test_split(
        X,
        y,
        sample_ids,
        train_size=train_ratio,
        random_state=42,
        shuffle=True,
        stratify=y,
    )

    scaler = StandardScaler()
    scaled_train = scaler.fit_transform(X_train)
    scaled_test = scaler.transform(X_test)

    return scaled_train, y_train, scaled_test, y_test, train_ids, test_ids


def evaluate_k_values(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    max_k: int = 50,
):
    n_splits = 5

    # K must fit inside the smallest cross-validation training fold.
    smallest_cv_training_size = len(X_train) - ceil(len(X_train) / n_splits)
    max_valid_k = min(max_k, smallest_cv_training_size)

    k_values = list(range(1, max_valid_k + 1, 2))
    if not k_values:
        raise ValueError("The training set is too small to evaluate K values.")

    cross_validation = StratifiedKFold(
        n_splits=n_splits,
        shuffle=True,
        random_state=42,
    )

    class_count = int(np.max(y_train)) + 1
    cv_scores_by_k = {k: [] for k in k_values}

    # Find ordered neighbours once per fold, then reuse them for every K.
    for fold_train_indices, validation_indices in cross_validation.split(X_train, y_train):
        fold_X_train = X_train[fold_train_indices]
        fold_y_train = y_train[fold_train_indices]
        fold_X_validation = X_train[validation_indices]
        fold_y_validation = y_train[validation_indices]

        neighbour_model = KNeighborsClassifier(n_neighbors=max_valid_k)
        neighbour_model.fit(fold_X_train, fold_y_train)

        neighbour_indices = neighbour_model.kneighbors(
            fold_X_validation,
            return_distance=False,
        )
        neighbour_labels = fold_y_train[neighbour_indices]
        one_hot_labels = np.eye(class_count, dtype=np.int16)[neighbour_labels]
        cumulative_votes = np.cumsum(one_hot_labels, axis=1)

        for k in k_values:
            predictions = np.argmax(cumulative_votes[:, k - 1, :], axis=1)
            cv_scores_by_k[k].append(
                accuracy_score(fold_y_validation, predictions)
            )

    mean_cv_accuracies = [
        round(float(np.mean(cv_scores_by_k[k])), 4)
        for k in k_values
    ]

    test_neighbour_model = KNeighborsClassifier(n_neighbors=max_valid_k)
    test_neighbour_model.fit(X_train, y_train)

    test_neighbour_indices = test_neighbour_model.kneighbors(
        X_test,
        return_distance=False,
    )
    test_neighbour_labels = y_train[test_neighbour_indices]
    test_one_hot_labels = np.eye(class_count, dtype=np.int16)[test_neighbour_labels]
    test_cumulative_votes = np.cumsum(test_one_hot_labels, axis=1)

    test_accuracies = []
    for k in k_values:
        predictions = np.argmax(test_cumulative_votes[:, k - 1, :], axis=1)
        test_accuracies.append(
            round(float(accuracy_score(y_test, predictions)), 4)
        )

    return k_values, mean_cv_accuracies, test_accuracies


def project_to_two_dimensions(
    X_train: np.ndarray,
    X_test: np.ndarray,
):
    """
    Fit PCA on training data only and transform both sets.

    Coordinates are normalised with one shared scale so the 2D geometry is not
    stretched independently along the two axes.
    """
    pca = PCA(n_components=2, random_state=42)
    projected_train = pca.fit_transform(X_train)
    projected_test = pca.transform(X_test)

    combined = np.vstack([projected_train, projected_test])
    minimums = combined.min(axis=0)
    maximums = combined.max(axis=0)
    centre = (minimums + maximums) / 2
    shared_span = float(np.max(maximums - minimums))
    if shared_span == 0:
        shared_span = 1.0

    # Leave a 5% margin around the plot.
    normalised_train = 0.5 + ((projected_train - centre) / shared_span) * 0.9
    normalised_test = 0.5 + ((projected_test - centre) / shared_span) * 0.9

    return normalised_train, normalised_test, pca.explained_variance_ratio_


def choose_visualisation_test_cases(
    y_test: np.ndarray,
    y_pred: np.ndarray,
    maximum_cases: int = 8,
) -> list[int]:
    """Choose deterministic cases with class coverage, then include mistakes."""
    selected: list[int] = []

    # First try to show at least one genuine test sample from every class.
    for class_index in np.unique(y_test):
        candidates = np.flatnonzero(y_test == class_index)
        if len(candidates):
            selected.append(int(candidates[0]))
        if len(selected) == maximum_cases:
            return selected

    # Add misclassified cases so the visual does not pretend the model is perfect.
    for index in np.flatnonzero(y_pred != y_test):
        index = int(index)
        if index not in selected:
            selected.append(index)
        if len(selected) == maximum_cases:
            return selected

    # Fill remaining slots with deterministic held-out samples.
    for index in range(len(y_test)):
        if index not in selected:
            selected.append(index)
        if len(selected) == maximum_cases:
            break

    return selected


def build_knn_visualisation(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    y_pred: np.ndarray,
    train_ids: np.ndarray,
    test_ids: np.ndarray,
    class_names: np.ndarray,
    model: KNeighborsClassifier,
):
    """Create an honest frontend payload from the fitted model and real data."""
    projected_train, projected_test, explained_variance = project_to_two_dimensions(
        X_train,
        X_test,
    )

    selected_test_indices = choose_visualisation_test_cases(y_test, y_pred)
    selected_X_test = X_test[selected_test_indices]
    neighbour_distances, neighbour_indices = model.kneighbors(
        selected_X_test,
        return_distance=True,
    )

    training_points = [
        {
            "id": int(train_ids[index]),
            "x": round(float(projected_train[index, 0]), 6),
            "y": round(float(projected_train[index, 1]), 6),
            "class_index": int(y_train[index]),
            "class_name": str(class_names[y_train[index]]),
        }
        for index in range(len(X_train))
    ]

    test_cases = []
    for visual_index, test_position in enumerate(selected_test_indices):
        nearest_positions = neighbour_indices[visual_index]
        distances = neighbour_distances[visual_index]
        neighbour_labels = y_train[nearest_positions]
        vote_counts = np.bincount(
            neighbour_labels,
            minlength=len(class_names),
        )

        neighbours = [
            {
                "rank": rank + 1,
                "training_id": int(train_ids[training_position]),
                "class_index": int(y_train[training_position]),
                "class_name": str(class_names[y_train[training_position]]),
                # This is the real distance used by KNN in full scaled space.
                "distance": round(float(distance), 6),
            }
            for rank, (training_position, distance) in enumerate(
                zip(nearest_positions, distances)
            )
        ]

        true_class_index = int(y_test[test_position])
        predicted_class_index = int(y_pred[test_position])
        test_cases.append(
            {
                "id": int(test_ids[test_position]),
                "x": round(float(projected_test[test_position, 0]), 6),
                "y": round(float(projected_test[test_position, 1]), 6),
                "true_class_index": true_class_index,
                "true_class_name": str(class_names[true_class_index]),
                "predicted_class_index": predicted_class_index,
                "predicted_class_name": str(class_names[predicted_class_index]),
                "correct": bool(predicted_class_index == true_class_index),
                "vote_counts": vote_counts.astype(int).tolist(),
                "neighbours": neighbours,
            }
        )

    return {
        "projection": {
            "method": "PCA",
            "components": 2,
            "explained_variance_ratio": [
                round(float(value), 6) for value in explained_variance
            ],
            "explained_variance_total": round(float(np.sum(explained_variance)), 6),
            "coordinate_range": [0.05, 0.95],
            "note": (
                "PCA coordinates are for display only. Neighbours and distances "
                "were calculated in the complete standardized feature space."
            ),
        },
        "training_points": training_points,
        "test_cases": test_cases,
        "neighbour_count": int(model.n_neighbors),
        "training_points_sampled": False,
        "test_case_selection": (
            "One held-out sample per class where possible, followed by genuine "
            "misclassifications and then deterministic held-out samples."
        ),
    }

async def read_uploaded_dataset(file: UploadFile):
    filename = file.filename or "uploaded_dataset"
    extension = Path(filename).suffix.lower()
    if extension not in {".csv", ".tsv"}:
        raise ValueError("Only CSV and TSV files are allowed.")

    maximum_file_size = 10 * 1024 * 1024        # max size = 10 MB
    content = await file.read(maximum_file_size + 1)
    if len(content) > maximum_file_size:
        raise ValueError("The uploaded file must be 10 MB or smaller.")

    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise ValueError("The uploaded file must use UTF-8 text encoding.") from error

    delimiter = "\t" if extension == ".tsv" else ","
    rows = list(csv.reader(io.StringIO(text), delimiter=delimiter))
    rows = [row for row in rows if any(value.strip() for value in row)]

    if len(rows) < 3:
        raise ValueError(
            "The file needs a header row and at least two data rows."
        )

    header = [value.strip() for value in rows[0]]
    if len(header) < 3:
        raise ValueError(
            "The file needs at least two numeric feature columns and one target column."
        )
    if any(not name for name in header):
        raise ValueError("Every column must have a name in the header row.")

    data_rows = rows[1:]
    if len(data_rows) > 10_000:
        raise ValueError("Uploaded datasets are limited to 10,000 data rows.")

    feature_rows: list[list[float]] = []
    target_values: list[str] = []
    expected_columns = len(header)

    for row_number, row in enumerate(data_rows, start=2):
        if len(row) != expected_columns:
            raise ValueError(
                f"Row {row_number} has {len(row)} columns; expected {expected_columns}."
            )

        cleaned = [value.strip() for value in row]
        if any(value == "" for value in cleaned):
            raise ValueError(f"Row {row_number} contains a missing value.")

        try:
            features = [float(value) for value in cleaned[:-1]]
        except ValueError as error:
            raise ValueError(
                f"Row {row_number} contains a non-numeric feature value. "
                "Only the final target column may contain text."
            ) from error

        feature_rows.append(features)
        target_values.append(cleaned[-1])

    X = np.asarray(feature_rows, dtype=np.float64)
    if not np.isfinite(X).all():
        raise ValueError("Feature values must be finite numbers.")

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(target_values)
    class_names = label_encoder.classes_.astype(str)

    if len(class_names) < 2:
        raise ValueError("The target column must contain at least two classes.")

    class_counts = np.bincount(y, minlength=len(class_names))
    if int(np.min(class_counts)) < 3:
        raise ValueError(
            "Every class needs at least three samples for a stratified train/test split."
        )

    return X, y, class_names, Path(filename).stem

def build_analysis_response(
    X: np.ndarray,
    y: np.ndarray,
    class_names: np.ndarray,
    dataset_name: str,
    display_name: str,
    train_ratio: float,
    max_k: int,
):
    (
        X_train,
        y_train,
        X_test,
        y_test,
        train_ids,
        test_ids,
    ) = split_and_scale_data(X, y, train_ratio)

    k_values, cv_accuracies, test_accuracies = evaluate_k_values(
        X_train,
        y_train,
        X_test,
        y_test,
        max_k,
    )

    best_cv_index = int(np.argmax(cv_accuracies))
    optimal_k = int(k_values[best_cv_index])

    model = KNeighborsClassifier(n_neighbors=optimal_k)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    report = classification_report(
        y_test,
        y_pred,
        labels=np.arange(len(class_names)),
        target_names=class_names,
        output_dict=True,
        zero_division=0,
    )
    matrix = confusion_matrix(
        y_test,
        y_pred,
        labels=np.arange(len(class_names)),
    )

    chart_points = [
        {
            "k": int(k),
            "cv_accuracy": float(cv_accuracy),
            "test_accuracy": float(test_accuracy),
        }
        for k, cv_accuracy, test_accuracy in zip(
            k_values,
            cv_accuracies,
            test_accuracies,
        )
    ]

    visualisation = build_knn_visualisation(
        X_train=X_train,
        y_train=y_train,
        X_test=X_test,
        y_test=y_test,
        y_pred=y_pred,
        train_ids=train_ids,
        test_ids=test_ids,
        class_names=class_names,
        model=model,
    )

    return {
        "dataset": {
            "name": dataset_name,
            "display_name": display_name,
            "samples": int(X.shape[0]),
            "features": int(X.shape[1]),
            "classes": class_names.tolist(),
            "class_distribution": get_class_distribution(y, class_names),
        },
        "split": {
            "train_ratio": train_ratio,
            "test_ratio": round(1 - train_ratio, 4),
            "training_samples": int(X_train.shape[0]),
            "test_samples": int(X_test.shape[0]),
        },
        "optimal_model": {
            "k": optimal_k,
            "mean_cv_accuracy": float(cv_accuracies[best_cv_index]),
            "test_accuracy": float(test_accuracies[best_cv_index]),
        },
        "k_results": chart_points,
        "confusion_matrix": matrix.astype(int).tolist(),
        "classification_report": serialise_report(report),
        "visualisation": visualisation,
    }

def serialise_report(report: dict) -> dict:
    serialised: dict = {}
    for label, values in report.items():
        if isinstance(values, dict):
            serialised[label] = {
                metric: round(float(value), 4)
                for metric, value in values.items()
            }
        else:
            serialised[label] = round(float(values), 4)
    return serialised


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/datasets")
def list_datasets():
    datasets = []
    for dataset_name in DATASET_LOADERS:
        X, y, class_names = get_data(dataset_name)
        datasets.append(
            {
                "name": dataset_name,
                "display_name": dataset_name.replace("_", " ").title(),
                "samples": int(X.shape[0]),
                "features": int(X.shape[1]),
                "classes": class_names.tolist(),
                "class_distribution": get_class_distribution(y, class_names),
            }
        )
    return {"datasets": datasets}


@app.post("/api/analyse")
def analyse_model(request: AnalysisRequest):
    try:
        X, y, class_names = get_data(request.dataset)
        return build_analysis_response(
            X=X,
            y=y,
            class_names=class_names,
            dataset_name=request.dataset,
            display_name=request.dataset.replace("_", " ").title(),
            train_ratio=request.train_ratio,
            max_k=request.max_k
        )

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Model analysis failed: {type(error).__name__}: {error}",
        ) from error
    
@app.post("/api/analyse-upload")
async def analyse_upload_model(
    file: UploadFile = File(...), 
    train_ratio: float = Form(0.8, gt=0.5, lt=0.95),
    max_k: int = Form(25, ge=3, le=99)
):
    try:
        X, y, class_names, display_name = await read_uploaded_dataset(file)
        return build_analysis_response(
            X=X,
            y=y,
            class_names=class_names,
            dataset_name="uploaded",
            display_name=display_name,
            train_ratio=train_ratio,
            max_k=max_k,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Uploaded dataset analysis failed: {type(error).__name__}: {error}",
        ) from error
    finally:
        await file.close()