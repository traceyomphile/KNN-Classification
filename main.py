import numpy as np
from sklearn.datasets import (
    load_iris,
    load_digits,
    load_wine,
    load_breast_cancer
)
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import (
    train_test_split, 
    GridSearchCV, 
    StratifiedKFold
)
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import (
    confusion_matrix, 
    ConfusionMatrixDisplay, 
    classification_report,
    accuracy_score
)
import matplotlib.pyplot as plt

STANDARD_DATASETS = {
    "iris": load_iris(),
    "digits": load_digits(),
    "wine": load_wine(),
    "breast_cancer": load_breast_cancer()
}

def get_data(dataset: str = "iris"):
    # Download and load the data
    dataset = STANDARD_DATASETS[dataset]

    # Get features and labels
    X, y, class_names = dataset.data, dataset.target, dataset.target_names

    return X, y, class_names

def print_class_distribution(y, class_names):
    counts = np.bincount(y)

    print(f"\nSamples per class before splitting:")
    for class_index, count in enumerate(counts):
        print(f"{class_names[class_index]}: {count.item()} samples")

def scale_data(X, y, train_ratio: float = 0.8):
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

def iris_model(X_train, y_train, k: int = 5):
    model = KNeighborsClassifier(n_neighbors=k)

    trained_model = model.fit(X_train, y_train)

    return trained_model

def find_optimal_k(X_train, y_train, max_k: int = 50):
    max_valid_k = min(max_k, len(X_train) - 1)

    # Test odd K values to reduce the chance of tied votes
    k_values = list(range(1, max_valid_k+1, 2))

    parameter_grid = {
        "n_neighbors": k_values
    }

    cross_validation = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=42
    )

    search = GridSearchCV(
        estimator=KNeighborsClassifier(),
        param_grid=parameter_grid,
        scoring="accuracy",
        cv=cross_validation,
        n_jobs=1
    )

    search.fit(X_train, y_train)

    best_k = search.best_params_["n_neighbors"]
    best_model = search.best_estimator_

    print(f"\nOptimal K: {best_k}")
    print(f"Cross-validation accuracy: {search.best_score_:.4f}")

    return best_k, best_model, search.cv_results_

def plot_k_results(results):
    k_values = results["param_n_neighbors"].data.astype(int)
    mean_scores = results["mean_test_score"]

    plt.figure(figsize=(12, 6))
    plt.plot(k_values, mean_scores, marker="o")

    plt.xlabel("Number of Neighbours, K")
    plt.ylabel("Mean Cross-Validation Accuracy")
    plt.title("KNN Accuracy for Different K Values")
    plt.xticks(k_values)
    plt.grid(True)
    plt.show()

def plot_results(y_true, y_pred, class_names):
    cm = confusion_matrix(y_true, y_pred)

    # Create and configure the visual plot
    disp = ConfusionMatrixDisplay(cm, display_labels=class_names)
    disp.plot(cmap=plt.cm.Blues)

    plt.show()

def main():
    # Prompt the user for dataset name
    dataset = input("Enter standard dataset name:\n")

    # Get user data and its class names
    X, y, classes = get_data(dataset)

    print(f"Total dataset samples: {X.shape[0]}")
    print(f"Number of featuress: {X.shape[1]}")

    # Display class distribution before splitting
    print_class_distribution(y, classes)

    # Get scaled and split data
    X_train, y_train, X_test, y_test = scale_data(X, y)

    print(f"\nTraining data size: {X_train.shape[0]}")
    print(f"Test data size: {X_test.shape[0]}")

    # Train model for Iris Dataset
    print("\nBaseline model with K = 5")
    model = iris_model(X_train, y_train)
    y_pred = model.predict(X_test)

    baseline_accuracy = accuracy_score(y_test, y_pred)
    print(f"Baseline Accuracy Score: {baseline_accuracy}")

    # report = classification_report(y_test, y_pred, target_names=classes)
    # print(report)

    # Plot Results
    #plot_results(y_test, y_pred, classes)

    # Tune K
    print("\nOptimal K Model Results")
    _, model, results = find_optimal_k(X_train, y_train, max_k=50)

    print(f"\nTuning results:")
    plot_k_results(results)

    y_pred = model.predict(X_test)
    print(f"\nOptimal K Accuracy: {accuracy_score(y_test, y_pred)}")
    report = classification_report(y_test, y_pred, target_names=classes)

    print("\nOptimal K Classification Report")
    print(report)

    plot_results(y_test, y_pred, classes)
if __name__ == '__main__':
    main()
