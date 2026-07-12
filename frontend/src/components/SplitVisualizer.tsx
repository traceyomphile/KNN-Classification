import { motion } from 'framer-motion'
import { useMemo } from 'react'
import type { DatasetSummary, SplitInfo } from '../types'

interface SplitVisualizerProps {
  datasetInfo?: DatasetSummary
  trainRatio: number
  splitResult?: SplitInfo
  onContinue: () => void
}

interface Dot {
  id: number
  isTrain: boolean
  delay: number
}

// Deterministic pseudo-random so the same split "looks" consistent per render
function seeded(i: number): number {
  const x = Math.sin(i * 999) * 10000
  return x - Math.floor(x)
}

export default function SplitVisualizer({ datasetInfo, trainRatio, splitResult, onContinue }: SplitVisualizerProps) {
  const total = datasetInfo?.samples || 150
  const dots = useMemo<Dot[]>(() => {
    const n = Math.min(total, 240) // cap for render performance
    return Array.from({ length: n }, (_, i) => ({
      id: i,
      isTrain: seeded(i) < trainRatio,
      delay: seeded(i * 7) * 0.6,
    }))
  }, [total, trainRatio])

  const trainCount = splitResult?.training_samples
  const testCount = splitResult?.test_samples

  return (
    <div className="w-full max-w-3xl mx-auto text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-fog mb-2">Stratified train / test split</p>
      <h3 className="font-display text-2xl text-paper mb-8">
        Shuffling &amp; dividing {total} samples
      </h3>

      <div className="flex flex-wrap justify-center gap-1.5 max-w-xl mx-auto mb-8">
        {dots.map((d) => (
          <motion.span
            key={d.id}
            className={`w-2 h-2 rounded-full ${d.isTrain ? 'bg-cyan' : 'bg-coral'}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: d.delay, duration: 0.35 }}
          />
        ))}
      </div>

      <div className="flex justify-center gap-10 mb-10">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan" />
            <span className="text-sm text-mist">Training set</span>
          </div>
          <p className="font-mono text-2xl text-paper mt-1 tabular-nums">{trainCount ?? '—'}</p>
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-coral" />
            <span className="text-sm text-mist">Test set</span>
          </div>
          <p className="font-mono text-2xl text-paper mt-1 tabular-nums">{testCount ?? '—'}</p>
        </div>
      </div>

      <button
        onClick={onContinue}
        disabled={!splitResult}
        className="rounded-xl bg-cyan text-ink font-display px-8 py-3 hover:bg-cyan/90 transition-colors disabled:opacity-40 disabled:cursor-wait"
      >
        {splitResult ? 'Continue to K search →' : 'Splitting…'}
      </button>
    </div>
  )
}