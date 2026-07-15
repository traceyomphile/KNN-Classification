# KNN Classification Backend

This backend powers the KNN Classification Visualizer with a FastAPI service that exposes endpoints for:

- listing built-in scikit-learn datasets
- running KNN analysis on standard datasets
- validating and analyzing uploaded CSV/TSV files

## Features

- Loads four built-in classification datasets from scikit-learn:
  - `iris`
  - `digits`
  - `wine`
  - `breast_cancer`
- Accepts user-uploaded datasets in `CSV` or `TSV` format
- Uses the last column as the target/class label
- Splits data into train and test sets with stratification
- Standardizes features after splitting using `StandardScaler`
- Evaluates odd K values using cross-validation
- Returns chart and visualization data for the frontend

## Project structure

- `Main.py` — FastAPI app, route definitions, and KNN analysis pipeline
- `requirements.txt` — Python backend dependencies

## Backend dependencies

The backend requirements are defined in [requirements.txt](requirements.txt):

- `fastapi`
- `uvicorn[standard]`
- `pydantic`
- `numpy`
- `scikit-learn`
- `python-multipart`

## Local setup

From the project root:

```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
```

On Windows PowerShell:

```powershell
backend\.venv\Scripts\Activate.ps1
```

## Run the backend

From the project root:

```bash
make backend
```

Or manually:

```bash
source backend/.venv/bin/activate
cd backend
uvicorn Main:app --reload --port 8000
```

The API will be available at:

- `http://localhost:8000`

## API endpoints

### `GET /api/health`

Returns the current backend health status.

### `GET /api/datasets`

Returns metadata for the built-in datasets, including:

- dataset name
- display name
- sample count
- feature count
- class list
- class distribution

### `POST /api/analyse`

Runs KNN analysis on one of the standard built-in datasets.

Request body:

```json
{
  "dataset": "iris",
  "train_ratio": 0.8,
  "max_k": 25
}
```

### `POST /api/analyse-upload`

Runs KNN analysis on an uploaded dataset.

Upload requirements:

- file must be `CSV` or `TSV`
- file must be UTF-8 encoded
- file must contain a header row
- last column is the target/class label
- all earlier columns must be numeric features
- file must be 10 MB or smaller
- uploaded dataset must contain at least two numeric feature columns and one target column
- each class must have at least three samples for a valid stratified split
- uploaded datasets are limited to 10,000 rows

## API docs

FastAPI automatically provides interactive documentation at:

- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

## Notes

- The backend validates uploaded files before analysis begins.
- The model pipeline uses `StandardScaler` on the training data only.
- K values are evaluated as odd integers only.
- PCA is used only for 2D visualization and not for the actual model decision process.
