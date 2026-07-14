import { motion } from 'framer-motion'
import { RotateCcw, Award, ArrowLeft } from 'lucide-react'
import ConfusionMatrix from './ConfusionMatrix'
import type { AnalysisResponse, ClassificationReportRow } from '../types'

interface ResultsPanelProps {
  result: AnalysisResponse
  onRestart: () => void
  onBack: () => void
}

const NON_CLASS_LABELS = new Set(['accuracy', 'macro avg', 'weighted avg'])

export default function ResultsPanel({ result, onRestart, onBack }: ResultsPanelProps) {
  const { dataset, split, optimal_model, confusion_matrix, classification_report } = result

  // Every entry except 'accuracy' / 'macro avg' / 'weighted avg' is a per-class row object.
  const perClassRows = Object.entries(classification_report).filter(
    ([label]) => !NON_CLASS_LABELS.has(label)
  ) as [string, ClassificationReportRow][]

  const summaryRows = (['macro avg', 'weighted avg'] as const).filter(
    (k) => classification_report[k] !== undefined
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-6xl mx-auto pb-16"
    >
      <div className="flex items-center gap-2 mb-2 justify-center text-cyan">
        <Award size={18} />
        <span className="font-mono text-xs uppercase tracking-[0.25em]">Results</span>
      </div>
      <h3 className="font-display text-3xl text-paper text-center mb-8 capitalize">
        {dataset.display_name} · K={optimal_model.k}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <MetricCard label="Test accuracy" value={optimal_model.test_accuracy} accent="cyan" />
        <MetricCard label="Mean CV accuracy" value={optimal_model.mean_cv_accuracy} accent="gold" />
        <MetricCard label="Train samples" value={split.training_samples} raw accent="mist" />
        <MetricCard label="Test samples" value={split.test_samples} raw accent="mist" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(360px,0.85fr)_minmax(560px,1.15fr)] gap-8 mb-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-fog mb-4 text-center">Confusion matrix</p>
          <ConfusionMatrix matrix={confusion_matrix} classes={dataset.classes} />
        </div>
        <div>
          <p className="font-mono text-m uppercase tracking-[0.25em] text-fog mb-4 text-center">Per-class metrics</p>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[560px] table-fixed text-sm">
              <colgroup>
                <col className="w-1/5" />
                <col className="w-1/5" />
                <col className="w-1/5" />
                <col className="w-1/5" />
                <col className="w-1/5" />
              </colgroup>
              <thead>
                <tr className="text-fog text-m uppercase tracking-wide">
                  <th className="px-3 pb-2 text-left font-mono font-bold text-fog whitespace-nowrap">Class</th>
                  <th className="px-3 pb-2 text-center font-mono font-bold text-fog whitespace-nowrap">Precision</th>
                  <th className="px-3 pb-2 text-center font-mono font-bold text-fog whitespace-nowrap">Recall</th>
                  <th className="px-3 pb-2 text-center font-mono font-bold text-fog whitespace-nowrap">F1</th>
                  <th className="px-3 pb-2 text-center font-mono font-bold text-fog whitespace-nowrap">n</th>
                </tr>
              </thead>
              <tbody>
              {perClassRows.map(([label, m]) => (
                <tr key={label} className="border-t border-line">
                  <td className="px-3 py-2 text-paper capitalize whitespace-nowrap">{label}</td>
                  <td className="px-3 py-2 text-center font-mono text-mist tabular-nums">{m.precision.toFixed(2)}</td>
                  <td className="px-3 py-2 text-center font-mono text-mist tabular-nums">{m.recall.toFixed(2)}</td>
                  <td className="px-3 py-2 text-center font-mono text-cyan tabular-nums">{m['f1-score'].toFixed(2)}</td>
                  <td className="px-3 py-2 text-center font-mono text-fog tabular-nums">{m.support}</td>
                </tr>
              ))}
              {summaryRows.map((label) => {
                const m = classification_report[label] as ClassificationReportRow
                return (
                  <tr key={label} className="border-t border-line/60">
                    <td className="px-3 py-2 text-fog italic capitalize whitespace-nowrap">{label}</td>
                    <td className="px-3 py-2 text-center font-mono text-fog tabular-nums">{m.precision.toFixed(2)}</td>
                    <td className="px-3 py-2 text-center font-mono text-fog tabular-nums">{m.recall.toFixed(2)}</td>
                    <td className="px-3 py-2 text-center font-mono text-fog tabular-nums">{m['f1-score'].toFixed(2)}</td>
                    <td className="px-3 py-2 text-center font-mono text-fog tabular-nums">{m.support}</td>
                  </tr>
                )
              })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        className="w-full flex flex-row items-center gap-3"
        style={{ justifyContent: 'space-between' }}
      >
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-6 py-3 text-mist hover:border-cyan hover:text-cyan transition-colors font-display"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={onRestart}
          className="ml-auto inline-flex items-center justify-center gap-2 rounded-xl border border-line px-6 py-3 text-mist hover:border-cyan hover:text-cyan transition-colors font-display"
        >
          <RotateCcw size={16} /> Try Another Dataset
        </button>
      </div>
    </motion.div>
  )
}

function MetricCard({
  label, value, raw, accent,
}: {
  label: string
  value: number
  raw?: boolean
  accent: 'cyan' | 'gold' | 'mist'
}) {
  const color = { cyan: 'text-cyan', gold: 'text-gold', mist: 'text-paper' }[accent]
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-4 text-center">
      <p className={`font-mono text-2xl tabular-nums ${color}`}>
        {raw ? value : `${(value * 100).toFixed(1)}%`}
      </p>
      <p className="text-xs text-mist mt-1">{label}</p>
    </div>
  )
}