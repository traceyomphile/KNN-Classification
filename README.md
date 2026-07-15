# KNN Classification Visualizer

A full-stack machine learning visualization project built as the second project in the DecodeLabs Internship. The application lets users explore how the K-Nearest Neighbours (KNN) algorithm behaves on standard classification datasets, compare candidate K values through cross-validation, and inspect the resulting model through charts, confusion matrices, and neighbour-level visualizations.

This project combines:

- A FastAPI backend for loading datasets, training and evaluating the KNN model, and returning structured analysis results.
- A React + TypeScript + Vite frontend for a guided, step-by-step visual workflow.
- A Python virtual environment for backend dependency isolation.
- A Node.js dependency setup for frontend tooling and local development.

---

## 1. Project Overview

The app is designed to help users understand KNN classification in an interactive way.

### What the project does

- Lets the user choose from several built-in scikit-learn datasets:
  - iris
  - digits
  - wine
  - breast_cancer
- Splits each dataset into training and testing subsets.
- Standardizes the features using StandardScaler after splitting to avoid information leakage.
- Evaluates candidate odd K values across a cross-validation search.
- Selects the best K based on mean cross-validation accuracy.
- Produces a final performance report including:
  - accuracy metrics
  - confusion matrix
  - classification report
  - PCA-based visualization of training and test points
  - nearest-neighbour explanations for test cases

### Why it matters

This project is useful for learning and demonstrating:

- the effect of K on model performance
- how train/test splitting works
- how feature scaling impacts distance-based algorithms
- how cross-validation helps estimate model quality
- how a production-style frontend can integrate with a Python ML backend

---

## 2. Internship Context

This repository is the second project created during the DecodeLabs Internship.

The focus of the project is not just to build a working model, but to present machine learning concepts in a visually interactive and educational way. The frontend acts as the storytelling layer, while the backend provides the actual analytical computation. This gives the project a strong learning-and-demonstration value, especially for internships or portfolio purposes.

---

## 3. Technical Stack

### Frontend

The frontend is a modern Vite-powered React application written in TypeScript.

Core technologies:

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- Framer Motion
- Recharts
- Lucide React

Why these are used:

- React provides the UI component model.
- TypeScript adds strong typing and easier maintenance.
- Vite provides fast development startup and build performance.
- Tailwind CSS handles layout and styling.
- Framer Motion creates transitions and polished UI animations.
- Recharts powers the K-accuracy charts.
- Lucide React provides iconography for the workflow UI.

### Backend

The backend is a FastAPI service that exposes an API for analysis and dataset retrieval.

Core technologies:

- FastAPI
- Uvicorn
- Pydantic
- NumPy
- scikit-learn

Why these are used:

- FastAPI offers a high-performance API framework with automatic validation.
- Uvicorn runs the ASGI server for development and production-like local execution.
- Pydantic validates request payloads.
- NumPy is used for array operations and model data preparation.
- scikit-learn supplies the datasets, preprocessing, evaluation metrics, PCA, and KNN classifier.

---

## 4. Project Architecture

The application follows a simple client-server architecture.

### Frontend responsibilities

The frontend:

- displays a dataset selection view
- shows a loading phase with animated progress
- allows configuration of train ratio and maximum K
- triggers the analysis request
- renders the K-search chart, fit/predict view, and final results panel
- displays confusion matrix, classification details, and PCA-based visualizations

### Backend responsibilities

The backend:

- loads datasets from scikit-learn
- returns metadata about available datasets and their class distribution
- splits the selected dataset into train and test sets
- scales the features using StandardScaler
- performs K-fold cross-validation for odd K values
- computes the optimal K and the final model predictions
- returns all structured output needed by the frontend

### Data flow

1. The user selects a dataset in the frontend.
2. The frontend sends a POST request to the backend analysis endpoint.
3. The backend loads the dataset, performs preprocessing and model evaluation.
4. The backend returns metrics and visualization payloads.
5. The frontend renders the results step by step.

---

## 5. Dependency Breakdown

### Backend dependencies

These are defined in [backend/requirements.txt](backend/requirements.txt):

- fastapi
- uvicorn[standard]
- pydantic
- numpy
- scikit-learn

#### Purpose of each

- fastapi: API framework and request handling.
- uvicorn[standard]: ASGI server with production-ready support.
- pydantic: schema validation and request model definitions.
- numpy: numerical data operations needed by the KNN workflow.
- scikit-learn: dataset loading, scaling, PCA, classifier logic, and metrics.

### Frontend dependencies

These are defined in [frontend/package.json](frontend/package.json):

#### Runtime dependencies

- @tailwindcss/vite
- framer-motion
- lucide-react
- react
- react-dom
- recharts
- tailwindcss

#### Development dependencies

- @eslint/js
- @types/node
- @types/react
- @types/react-dom
- @vitejs/plugin-react
- eslint
- eslint-plugin-react-hooks
- eslint-plugin-react-refresh
- globals
- typescript
- typescript-eslint
- vite

---

## 6. Virtual Environment Setup

A clean Python virtual environment is strongly recommended for the backend.

### Recommended backend environment location

The project is configured to use:

- backend/.venv

This keeps the ML dependencies isolated from the system Python installation.

### Create the environment

From the project root:

```bash
python3 -m venv backend/.venv
```

### Activate the environment

#### On Linux or macOS / Git Bash / WSL

```bash
source backend/.venv/bin/activate
```

#### On Windows PowerShell

```powershell
backend\.venv\Scripts\Activate.ps1
```

#### On Command Prompt

```cmd
backend\.venv\Scripts\activate.bat
```

### Install backend requirements

```bash
pip install --upgrade pip
pip install -r backend/requirements.txt
```

> The project Makefile already handles this setup automatically when you use the root-level commands.

---

## 7. Frontend Setup

Install the frontend dependencies from the project root:

```bash
cd frontend
npm install
```

If you prefer the root Makefile workflow, run:

```bash
make install-frontend
```

---

## 8. Running the Project

The project is configured to run the backend and frontend separately, or together.

### Option A: Install everything using the Makefile

From the project root:

```bash
make install
```

This will:

- create the backend virtual environment
- install backend Python packages
- install frontend Node packages

### Option B: Run the backend only

```bash
make backend
```

This starts the API on:

- http://localhost:8000

The backend entrypoint is the FastAPI application in [backend/Main.py](backend/Main.py).

### Option C: Run the frontend only

```bash
make frontend
```

This starts the Vite dev server on:

- http://localhost:5173

### Option D: Run both together

```bash
make dev
```

This launches both services simultaneously using background processes and stops both when the terminal is interrupted.

---

## 9. Manual Run Commands

If you do not want to use Make, the backend and frontend can be started directly.

### Backend

```bash
source backend/.venv/bin/activate
cd backend
uvicorn Main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm run dev
```

### Production build for the frontend

```bash
cd frontend
npm run build
```

### Preview production build

```bash
cd frontend
npm run preview
```

### Lint the frontend

```bash
cd frontend
npm run lint
```

---

## 10. API Documentation

The backend uses FastAPI, which also exposes interactive OpenAPI documentation automatically.

### Swagger UI

- http://localhost:8000/docs

### ReDoc

- http://localhost:8000/redoc

---

## 11. Backend API Endpoints

### GET /api/health

Returns the service health status.

Example response:

```json
{
  "status": "ok"
}
```

### GET /api/datasets

Returns a list of all supported datasets, including dataset metadata, sample count, feature count, and class distribution.

### POST /api/analyse

Runs the full KNN analysis pipeline.

#### Request body

```json
{
  "dataset": "iris",
  "train_ratio": 0.8,
  "max_k": 25
}
```

#### Fields

- dataset: one of iris, digits, wine, or breast_cancer
- train_ratio: train/test split ratio, must be between 0.5 and 0.95
- max_k: maximum candidate K value to evaluate, between 3 and 99

#### Response contains

- dataset metadata
- train/test split summary
- optimal model configuration
- K-search accuracy data
- confusion matrix
- classification report
- PCA-based visualization payload for the frontend

---

## 12. Frontend Workflow

The frontend is structured as a guided multi-step experience.

### Step flow

1. Dataset selection
2. Loading animation
3. Configuration panel
4. K-search visualization
5. Fit and prediction visualization
6. Results panel

This step-by-step flow is implemented in [frontend/src/App.tsx](frontend/src/App.tsx) and the supporting components under [frontend/src/components](frontend/src/components).

---

## 13. Environment Variables

The frontend is configured to optionally use an API URL from the environment.

### Variable

- VITE_API_URL

### Default behavior

If not set, the frontend uses:

- http://localhost:8000

This is defined in [frontend/src/api.ts](frontend/src/api.ts).

### Example

```bash
VITE_API_URL=http://localhost:8000
```

---

## 14. Root-Level Makefile Commands

The root [Makefile](Makefile) is the main convenience interface for local setup and development.

### Available commands

- make install
- make install-backend
- make install-frontend
- make backend
- make frontend
- make dev
- make clean

### What clean does

```bash
make clean
```

Removes:

- the backend virtual environment
- frontend Node modules
- frontend build output

---

## 15. Project Structure

```text
KNN Classification/
├── Makefile
├── README.md
├── backend/
│   ├── Main.py
│   └── requirements.txt
└── frontend/
    ├── package.json
    ├── public/
    ├── src/
    ├── index.html
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    └── eslint.config.js
```

### Important files

- [Makefile](Makefile): local automation for environment setup and development workflows.
- [backend/Main.py](backend/Main.py): FastAPI app, ML analysis pipeline, and API routes.
- [backend/requirements.txt](backend/requirements.txt): Python server dependencies.
- [frontend/package.json](frontend/package.json): frontend scripts and dependency manifest.
- [frontend/src/App.tsx](frontend/src/App.tsx): main application flow.
- [frontend/src/api.ts](frontend/src/api.ts): frontend API client to the backend.
- [frontend/src/components](frontend/src/components): modular UI panels and visualization components.

---

## 16. Notes on ML Behaviour

This project uses KNN with standardization and repeated evaluation across odd K values.

### Key design choices

- K values are evaluated as odd integers only.
- StandardScaler is fit only on the training portion.
- PCA is used only for 2D visualization of data geometry.
- Model evaluation is performed in the scaled feature space, not in PCA-projected space.
- The frontend visualizations are designed to show the real neighbour relationship, not a simplified approximation.

### Important implications

- KNN is a distance-based algorithm, so scaling matters.
- Odd K avoids tied voting outcomes in binary-style decision comparison.
- Cross-validation helps better estimate which K generalizes well on held-out data.

---

## 17. Troubleshooting

### Backend import or dependency issues

If the backend shows missing package errors:

```bash
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
```

### Frontend dependency issues

If the frontend cannot start:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### CORS issues

The backend is configured to allow requests from:

- http://localhost:5173
- http://127.0.0.1:5173

If you change the frontend dev server origin, you may need to update the allowed origin list in [backend/Main.py](backend/Main.py).

### Backend fails to start

Ensure:

- the virtual environment is active
- the Python packages are installed
- the current working directory and module path are correct

---

## 18. Development Summary

This repository is a strong demonstration of:

- Python backend engineering with FastAPI
- front-end integration with React + TypeScript
- interactive visualization of machine learning behaviour
- dependency isolation using a backend virtual environment
- practical full-stack development for a ML-focused internship project

---

## 19. Recommended Quick Start

If you want the fastest local setup:

```bash
make install
make dev
```

Then open:

- http://localhost:5173 for the frontend
- http://localhost:8000/docs for the backend API documentation

---

## 20. Conclusion

The KNN Classification Visualizer is a practical, educational, and visually rich machine learning project that combines backend intelligence with frontend usability. It is especially appropriate as the second project in the DecodeLabs Internship because it demonstrates core skills in:

- data science workflow design
- API development
- frontend UI design
- machine learning evaluation
- environment and dependency management

If you are using this project for portfolio, internship, or demonstration purposes, this README gives a complete reference point for setup, architecture, running instructions, dependencies, and overall project understanding.
