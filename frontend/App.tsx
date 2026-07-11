import { Fragment, FormEvent, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AnalysisResult,
  DatasetName,
  ReportRow,
} from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

const datasetOptions: Array<{
  value: DatasetName;
  label: string;
  description: string;
}> = [
  {
    value: "iris",
    label: "Iris",
    description: "Flower species classification",
  },
  {
    value: "digits",
    label: "Digits",
    description: "Handwritten digit recognition",
  },
  {
    value: "wine",
    label: "Wine",
    description: "Wine cultivar classification",
  },
  {
    value: "breast_cancer",
    label: "Breast Cancer",
    description: "Diagnostic tumour classification",
  },
];

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function isReportRow(value: ReportRow | number): value is ReportRow {
  return typeof value === "object";
}

function App() {
  const [dataset, setDataset] = useState<DatasetName>("iris");
  const [trainRatio, setTrainRatio] = useState(0.8);
  const [maxK, setMaxK] = useState(49);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAnalysis(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/analyse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataset,
          train_ratio: trainRatio,
          max_k: maxK,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail ?? "The analysis request failed.");
      }

      setResult(payload);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "An unexpected error occurred.";

      setError(
        message === "Failed to fetch"
          ? "Cannot reach the backend. Start FastAPI on port 8000 first."
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  const reportRows = result
    ? Object.entries(result.classification_report).filter(
        ([, values]) => isReportRow(values),
      )
    : [];

  const maxClassCount = result
    ? Math.max(
        ...result.dataset.class_distribution.map((item) => item.samples),
      )
    : 1;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">
          K
        </div>
        <div>
          <p className="eyebrow">Machine Learning Playground</p>
          <h1>KNN Model Lab</h1>
        </div>
        <div className="status-pill">
          <span className="status-dot" />
          Local experiment
        </div>
      </header>

      <main className="dashboard">
        <aside className="control-panel panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Experiment setup</p>
              <h2>Configure model</h2>
            </div>
            <span className="step-number">01</span>
          </div>

          <form onSubmit={runAnalysis}>
            <label className="field">
              <span>Dataset</span>
              <select
                value={dataset}
                onChange={(event) =>
                  setDataset(event.target.value as DatasetName)
                }
              >
                {datasetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <small>
                {
                  datasetOptions.find(
                    (option) => option.value === dataset,
                  )?.description
                }
              </small>
            </label>

            <label className="field">
              <span>
                Training split
                <strong>{Math.round(trainRatio * 100)}%</strong>
              </span>
              <input
                type="range"
                min="0.6"
                max="0.9"
                step="0.05"
                value={trainRatio}
                onChange={(event) =>
                  setTrainRatio(Number(event.target.value))
                }
              />
              <div className="range-labels">
                <small>60%</small>
                <small>90%</small>
              </div>
            </label>

            <label className="field">
              <span>Maximum K</span>
              <input
                type="number"
                min="3"
                max="99"
                step="2"
                value={maxK}
                onChange={(event) => setMaxK(Number(event.target.value))}
              />
              <small>Only odd K values are evaluated.</small>
            </label>

            <button className="run-button" disabled={loading} type="submit">
              {loading ? (
                <>
                  <span className="spinner" />
                  Running experiment
                </>
              ) : (
                <>
                  Run experiment
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>

          <div className="method-note">
            <span>Method</span>
            <p>
              Standard scaling, stratified split, five-fold cross-validation,
              then final test-set evaluation.
            </p>
          </div>
        </aside>

        <section className="workspace">
          {error && <div className="error-banner">{error}</div>}

          {!result && !loading ? (
            <div className="empty-state panel">
              <div className="empty-visual">
                <span>1</span>
                <span>3</span>
                <span>5</span>
                <span>7</span>
                <span>9</span>
              </div>
              <p className="section-kicker">No experiment yet</p>
              <h2>Choose a dataset and run the model.</h2>
              <p>
                The dashboard will compare cross-validation and test accuracy,
                select the best K, and expose the model's mistakes.
              </p>
            </div>
          ) : null}

          {loading && !result ? (
            <div className="empty-state panel">
              <span className="large-spinner" />
              <h2>Crunching neighbours…</h2>
              <p>
                Cross-validation is doing the repetitive labour so you do not
                have to.
              </p>
            </div>
          ) : null}

          {result ? (
            <>
              <section className="metric-grid">
                <article className="metric-card panel">
                  <span>Optimal K</span>
                  <strong>{result.optimal_model.k}</strong>
                  <small>Chosen by mean CV accuracy</small>
                </article>
                <article className="metric-card panel">
                  <span>CV accuracy</span>
                  <strong>
                    {formatPercent(
                      result.optimal_model.mean_cv_accuracy,
                    )}
                  </strong>
                  <small>Five-fold stratified average</small>
                </article>
                <article className="metric-card panel">
                  <span>Test accuracy</span>
                  <strong>
                    {formatPercent(result.optimal_model.test_accuracy)}
                  </strong>
                  <small>Held-out unseen samples</small>
                </article>
                <article className="metric-card panel">
                  <span>Samples</span>
                  <strong>{result.dataset.total_samples}</strong>
                  <small>{result.dataset.features} input features</small>
                </article>
              </section>

              <section className="chart-panel panel">
                <div className="panel-heading">
                  <div>
                    <p className="section-kicker">Performance curve</p>
                    <h2>Accuracy across K values</h2>
                  </div>
                  <span className="dataset-badge">
                    {result.dataset.display_name}
                  </span>
                </div>

                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={result.k_results}
                      margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="4 4" opacity={0.18} />
                      <XAxis
                        dataKey="k"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={["dataMin - 0.05", 1]}
                        tickFormatter={(value) =>
                          `${Math.round(Number(value) * 100)}%`
                        }
                        tickLine={false}
                        axisLine={false}
                        width={48}
                      />
                      <Tooltip
                        formatter={(value) =>
                          formatPercent(Number(value))
                        }
                        labelFormatter={(label) => `K = ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cv_accuracy"
                        name="Mean CV accuracy"
                        stroke="var(--accent)"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="test_accuracy"
                        name="Test accuracy"
                        stroke="var(--secondary)"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="lower-grid">
                <article className="panel matrix-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="section-kicker">Error inspection</p>
                      <h2>Confusion matrix</h2>
                    </div>
                  </div>

                  <div className="matrix-scroll">
                    <div
                      className="matrix-grid"
                      style={{
                        gridTemplateColumns: `minmax(95px, auto) repeat(${result.dataset.classes.length}, minmax(58px, 1fr))`,
                      }}
                    >
                      <div className="matrix-corner">Actual ↓ / Predicted →</div>
                      {result.dataset.classes.map((className) => (
                        <div
                          className="matrix-label matrix-column-label"
                          key={`column-${className}`}
                        >
                          {className}
                        </div>
                      ))}

                      {result.confusion_matrix.map((row, rowIndex) => (
                        <Fragment key={`matrix-row-${rowIndex}`}>
                          <div
                            className="matrix-label"
                            key={`row-label-${result.dataset.classes[rowIndex]}`}
                          >
                            {result.dataset.classes[rowIndex]}
                          </div>
                          {row.map((value, columnIndex) => {
                            const rowMaximum = Math.max(...row, 1);
                            const intensity = value / rowMaximum;

                            return (
                              <div
                                className={`matrix-cell ${
                                  rowIndex === columnIndex
                                    ? "matrix-correct"
                                    : ""
                                }`}
                                key={`${rowIndex}-${columnIndex}`}
                                style={{
                                  opacity: 0.35 + intensity * 0.65,
                                }}
                                title={`Actual ${result.dataset.classes[rowIndex]}, predicted ${result.dataset.classes[columnIndex]}`}
                              >
                                {value}
                              </div>
                            );
                          })}
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </article>

                <article className="panel distribution-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="section-kicker">Dataset profile</p>
                      <h2>Class distribution</h2>
                    </div>
                  </div>

                  <div className="distribution-list">
                    {result.dataset.class_distribution.map((item) => (
                      <div
                        className="distribution-item"
                        key={item.class_index}
                      >
                        <div className="distribution-meta">
                          <span>{item.class_name}</span>
                          <strong>{item.samples}</strong>
                        </div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${(item.samples / maxClassCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="split-summary">
                    <div>
                      <span>Training</span>
                      <strong>{result.split.training_samples}</strong>
                    </div>
                    <div>
                      <span>Testing</span>
                      <strong>{result.split.test_samples}</strong>
                    </div>
                  </div>
                </article>
              </section>

              <section className="report-panel panel">
                <div className="panel-heading">
                  <div>
                    <p className="section-kicker">Detailed metrics</p>
                    <h2>Classification report</h2>
                  </div>
                </div>

                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Class / average</th>
                        <th>Precision</th>
                        <th>Recall</th>
                        <th>F1-score</th>
                        <th>Support</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportRows.map(([label, values]) => {
                        if (!isReportRow(values)) return null;

                        return (
                          <tr key={label}>
                            <td>{label}</td>
                            <td>{formatPercent(values.precision)}</td>
                            <td>{formatPercent(values.recall)}</td>
                            <td>{formatPercent(values["f1-score"])}</td>
                            <td>{Math.round(values.support)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default App;