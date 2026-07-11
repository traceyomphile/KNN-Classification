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

import matplotlib.pyplot as plt

STANDARD_DATASETS = {
    "iris": load_iris(),
    "digits": load_digits(),
    "wine": load_wine(),
    "breast_cancer": load_breast_cancer()
}

def get_data(dataset: str = "iris"):
    if dataset not in STANDARD_DATASETS:
        valid_names = ", ".join(STANDARD_DATASETS)

        raise ValueError(
            f"Unknown dataset '{dataset}'. "
            f"Choose from: {valid_names}"
        )
    
    # Download and load the data
    selected_dataset = STANDARD_DATASETS[dataset]

    # Get features and labels
    X, y, class_names = selected_dataset.data, selected_dataset.target, selected_dataset.target_names.astype(str)

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

def data_model(X_train, y_train, k: int = 5):
    model = KNeighborsClassifier(n_neighbors=k)

    trained_model = model.fit(X_train, y_train)

    return trained_model

def evaluate_k_values(X_train, y_train, X_test, y_test, max_k: int = 50):
    max_valid_k = min(max_k, len(X_train)-1)
    k_values = list(range(1, max_valid_k+1, 2))

    mean_cv_accs = []
    test_accs = []

    cross_validation = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=42
    )

    for k in k_values:
        model = KNeighborsClassifier(n_neighbors=k)

        # Calculate the accuracy for each cross-validation fold
        cv_scores = cross_val_score(
            model,
            X_train,
            y_train,
            scoring="accuracy",
            cv=cross_validation,
            n_jobs=1
        )

        # Store the average accuracy across the folds
        mean_cv_accs.append(round(cv_scores.mean(), 4))

        # Train using the full training set
        model.fit(X_train, y_train)

        # Evaluate using the test set
        y_pred = model.predict(X_test)
        test_accs.append(round(accuracy_score(y_test, y_pred), 4))

    return k_values, mean_cv_accs, test_accs

def plot_k_results(k_values, mean_cv_accs, test_accs):
    plt.figure(figsize=(12, 6))

    plt.plot(k_values, mean_cv_accs, marker="o", label="Mean Cross-Validation Accuracy")
    plt.plot(k_values, test_accs, marker='s', label="Test Accuracy")

    plt.xlabel("Number of Neighbours, K")
    plt.ylabel("Accuracy")
    plt.title("Cross-Validation Accuracy vs Test Accuracy")
    plt.xticks(k_values)
    #plt.ylim(0, 1.05)
    plt.grid(True)
    plt.legend()

    plt.tight_layout()
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

    try:
        # Get user data and its class names
        X, y, classes = get_data(dataset)

        print(f"Total dataset samples: {X.shape[0]}")
        print(f"Number of featuress: {X.shape[1]}")

        # Display class distribution before splitting
        print_class_distribution(y, classes)

        # Get scaled and split data
        X_train, y_train, X_test, y_test = scale_data(X, y)

        print(f"\nTraining samples: {X_train.shape[0]}")
        print(f"Test samples: {X_test.shape[0]}")

        k_values, cv_accs, test_accs = evaluate_k_values(
            X_train,
            y_train,
            X_test,
            y_test
        )

        plot_k_results(k_values, cv_accs, test_accs)

        # Select K using cross-validation
        best_cv_index = np.argmax(cv_accs)
        opt_k = k_values[best_cv_index]

        print(f"\nOptimal K: {opt_k}")
        print(f"Mean Cross-Validation Accuracy at Optimal K: {cv_accs[best_cv_index]}")
        print(f"Test Accuracy at Optimal K: {test_accs[best_cv_index]}")

        # Final model on Optimal K
        model = data_model(X_train, y_train, k=opt_k)
        y_pred = model.predict(X_test)

        print("\nOptimal K Classification Report")
        print(classification_report(y_test, y_pred, target_names=classes))

        plot_results(y_test, y_pred, classes)
    
    except Exception as er:
        print(f"Error: {er}")

if __name__ == '__main__':
    main()
