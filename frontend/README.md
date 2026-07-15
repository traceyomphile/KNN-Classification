# KNN Classification Visualizer Frontend

This frontend is the interactive React + TypeScript interface for the KNN Classification Visualizer.

It guides the user through a visual workflow for exploring how the K-Nearest Neighbours algorithm behaves on either:

- built-in standard scikit-learn datasets, or
- a user-uploaded CSV/TSV dataset.

## What the UI does

The frontend currently supports the following flow:

1. Choose a data source
   - Standard datasets
   - Upload a CSV or TSV file
2. Select a built-in dataset, if applicable
3. Review the loading state
4. Configure the train/test split ratio and maximum K
5. View the K-search visualization
6. Review the fit/predict visualization
7. Inspect the final results and confusion matrix

## Dataset upload rules

When a user uploads their own dataset:

- only `.csv` and `.tsv` files are accepted
- the file must include a header row
- the last column is treated as the class/target label
- all earlier columns must be numeric features
- the uploaded file must be 10 MB or smaller

## Frontend stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- Framer Motion
- Recharts
- Lucide React

## Local development

From the project root:

```bash
cd frontend
npm install
npm run dev
```

The dev server runs at:

- http://localhost:5173

## Production build

```bash
cd frontend
npm run build
```

## Linting

```bash
cd frontend
npm run lint
```

## Environment variable

The frontend reads the backend API base URL from:

- `VITE_API_URL`

If it is not set, it defaults to:

- http://localhost:8000

## Notes

This frontend is meant to be used with the FastAPI backend in the root project. The backend provides the dataset list, performs KNN evaluation, and returns the structured visual payload that powers the charts and result panels.
