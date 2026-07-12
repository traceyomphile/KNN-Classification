from math import ceil
from typing import Literal
import traceback

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.datasets import (
    load_iris,
    load_digits,
    load_wine,
    load_breast_cancer
)

from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import (
    train_test_split,
    StratifiedKFold,
    cross_val_score
)

from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import (
    confusion_matrix, 
    ConfusionMatrixDisplay, 
    classification_report,
    accuracy_score
)

DatasetName = Literal['iris', 'digits', 'wine', 'breast_cancer']

DATASET_LOADERS = {
    "iris": load_iris,
    "digits": load_digits,
    "wine": load_wine,
    "breast_cancer": load_breast_cancer
}

class AnalysisRequest(BaseModel):
    dataset: DatasetName = 'iris'
    train_ratio: float = Field(default=0.8, gt=0.5, lt=0.95)
    max_k: int = Field(default=50, ge=3, le=99)

app = FastAPI(
    title="KNN Classification Model",
    description="Runs K-Nearest Neighbours experiments on standard scikit-learn datasets",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

def get_data(dataset_name: DatasetName):
    try:
    # Download and load the data
        selected_dataset = DATASET_LOADERS[dataset_name]()
    except KeyError as error:
        valid_names = ", ".join(DATASET_LOADERS)
        raise ValueError(
            f"Unknown dataset '{dataset_name}'. Choose from: {valid_names}"
        ) from error

    # Get features and labels
    X, y, class_names = selected_dataset.data, selected_dataset.target, selected_dataset.target_names.astype(str)

    return X, y, class_names

def get_class_distribution(y: np.ndarray, class_names: np.ndarray):
    counts = np.bincount(y)

    return [
        {
            'class_index': class_index,
            'class_name': str(class_names[class_index]),
            'samples': int(count),
        } for class_index, count in enumerate(counts)
    ]

def scale_data(X: np.ndarray, y: np.ndarray, train_ratio: float = 0.8):
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, 
        y, 
        train_size=train_ratio,
        random_state=42,
        shuffle=True,
        stratify=y
    )

    # Initialise the scaler
    scaler = StandardScaler()

    # Fit and transform the training data
    scaled_train = scaler.fit_transform(X_train)
    scaled_test = scaler.transform(X_test)

    return scaled_train, y_train, scaled_test, y_test

def evaluate_k_values(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray, max_k: int = 50):
    n_splits = 5

    # K must fit inside the smallest cross-validation training fold
    smallest_cv_training_size = len(X_train) - ceil(len(X_train) / n_splits)
    max_valid_k = min(max_k, smallest_cv_training_size)

    k_values = list(range(1, max_valid_k+1, 2))
    if not k_values:
        raise ValueError("The training set is too small to evaluate K values.")

    cross_validation = StratifiedKFold(
        n_splits=n_splits,
        shuffle=True,
        random_state=42,
    )

    class_count = int(np.max(y_train)) + 1
    cv_scores_by_k = {k: [] for k in k_values}

    # Find the ordered neighbours once per fold.
    for fold_train_indices, val_indices in cross_validation.split(X_train, y_train):
        fold_X_train = X_train[fold_train_indices]
        fold_y_train = y_train[fold_train_indices]
        fold_X_val = X_train[val_indices]
        fold_y_val = y_train[val_indices]

        # Fit one KNN model for each fold
        neighbour_model = KNeighborsClassifier(n_neighbors=max_valid_k)
        neighbour_model.fit(fold_X_train, fold_y_train)

        # Finds the max_valid_k nearest neighbours for each validation point
        neighbour_indices = neighbour_model.kneighbors(fold_X_val, return_distance=False)
        neighbour_labels = fold_y_train[neighbour_indices]

        one_hot_labels = np.eye(class_count, dtype=np.int16)[neighbour_labels]
        cumulative_votes = np.cumsum(one_hot_labels, axis=1)

        for k in k_values:
            predictions = np.argmax(cumulative_votes[:, k-1, :], axis=1)
            cv_scores_by_k[k].append(accuracy_score(fold_y_val, predictions))

    mean_cv_accuracies = [
        round(float(np.mean(cv_scores_by_k[k])), 4)
        for k in k_values
    ]

    # Repeat the reusable-neighbour calculation once for the held-out-test
    test_neighbour_model = KNeighborsClassifier(n_neighbors=max_valid_k)
    test_neighbour_model.fit(X_train, y_train)

    test_neighbour_indices = test_neighbour_model.kneighbors(X_test, return_distance=False)
    test_neighbour_labels = y_train[test_neighbour_indices]
    test_one_hot_labels = np.eye(class_count, dtype=np.int16)[test_neighbour_labels]
    test_cumulative_votes = np.cumsum(test_one_hot_labels, axis=1)

    test_accs = []
    for k in k_values:
        predictions = np.argmax(test_cumulative_votes[:, k-1, :], axis=1)
        test_accs.append(round(float(accuracy_score(y_test, predictions)), 4))

    return k_values, mean_cv_accuracies, test_accs

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

@app.get('/api/health')
def health_check():
    return {"status": "ok"}

@app.get('/api/datasets')
def list_datasets():
    datasets = []

    for dataset_name in DATASET_LOADERS:
        X, y, class_names = get_data(dataset_name)
        datasets.append(
            {
                'name': dataset_name,
                'display_name': dataset_name.replace("_", " ").title(),
                'samples': int(X.shape[0]),
                'features': int(X.shape[1]),
                'classes': class_names.tolist(),
                'class_distribution': get_class_distribution(y, class_names),
            }
        )

    return {'datasets': datasets}

@app.post('/api/analyse')
def analyse_model(request: AnalysisRequest):
    try:
        X, y, class_names = get_data(request.dataset)
        X_train, y_train, X_test, y_test = scale_data(X, y, request.train_ratio)

        k_values, cv_accs, test_accs = evaluate_k_values(X_train, y_train, X_test, y_test, request.max_k)

        best_cv_idx = int(np.argmax(cv_accs))
        opt_k = int(k_values[best_cv_idx])

        model = KNeighborsClassifier(n_neighbors=opt_k)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        report = classification_report(
            y_test,
            y_pred,
            target_names=class_names,
            output_dict=True,
            zero_division=0,
        )
        matrix = confusion_matrix(y_test, y_pred)

        chart_points = [
            {
                'k': int(k),
                'cv_accuracy': float(cv_accuracy),
                'test_accuracy': float(test_accuracy),
            }
            for k, cv_accuracy, test_accuracy in zip(
                k_values,
                cv_accs,
                test_accs,
            )
        ]

        return {
            'dataset': {
                'name': request.dataset,
                'display_name': request.dataset.replace("_", " ").title(),
                'samples': int(X.shape[0]),
                'features': int(X.shape[1]),
                'classes': class_names.tolist(),
                'class_distribution': get_class_distribution(y, class_names),
            },
            'split': {
                'train_ratio': request.train_ratio,
                'test_ratio': round(1 - request.train_ratio, 4),
                'training_samples': int(X_train.shape[0]),
                'test_samples': int(X_test.shape[0]),
            },
            'optimal_model': {
                'k': opt_k,
                'mean_cv_accuracy': float(cv_accs[best_cv_idx]),
                'test_accuracy': float(test_accs[best_cv_idx]),
            },
            'k_results': chart_points,
            'confusion_matrix': matrix.astype(int).tolist(),
            'classification_report': serialise_report(report),
        }
    
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=f"Model analysis failed: {type(error).__name__}: {error}",
        ) from error
    
