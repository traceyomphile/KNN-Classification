import torch as t
from sklearn.datasets import load_iris
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay, classification_report
import matplotlib.pyplot as plt

def get_iris_data():
    # Download and load the Iris data
    iris = load_iris()

    # Get features and labels
    X_numpy, y_numpy, class_names = iris.data, iris.target, iris.target_names

    # Convert to PyTorch Tensors
    X = t.tensor(X_numpy, dtype=t.float32)
    y = t.tensor(y_numpy, dtype=t.long)

    return X, y, class_names

def print_class_distribution(y, class_names):
    counts = t.bincount(y)

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

def plot_results(y_true, y_pred, class_names):
    cm = confusion_matrix(y_true, y_pred)

    # Create and configure the visual plot
    disp = ConfusionMatrixDisplay(cm, display_labels=class_names)
    disp.plot(cmap=plt.cm.Blues)

    plt.show()

def main():
    # Get Iris data and its class names
    X, y, classes = get_iris_data()

    print(f"Total dataset samples: {X.shape[0]}")
    print(f"Number of featuress: {X.shape[1]}")

    # Display class distribution before splitting
    print_class_distribution(y, classes)

    # Get scaled and split data
    X_train, y_train, X_test, y_test = scale_data(X, y)

    print(f"\nTraining data size: {X_train.shape[0]}")
    print(f"Test data size: {X_test.shape[0]}")

    # Train model for Iris Dataset
    model = iris_model(X_train, y_train)
    y_pred = model.predict(X_test)

    report = classification_report(y_test, y_pred, target_names=classes)
    print(report)

    # Plot Iris Results
    plot_results(y_test, y_pred, classes)

if __name__ == '__main__':
    main()
