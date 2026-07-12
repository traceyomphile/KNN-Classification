import { motion } from 'framer-motion'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import type { RunConfig } from '../types'

interface DisplayDatasetInfo {
  display_name: string
  samples: number | string
  features: number | string
}

interface ConfigPanelProps {
  datasetInfo: DisplayDatasetInfo
  config: RunConfig
  setConfig: Dispatch<SetStateAction<RunConfig>>
  onRun: () => void
}

export default function ConfigPanel({ datasetInfo, config, setConfig, onRun }: ConfigPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="flex items-center gap-2 mb-4 text-good">
        <CheckCircle2 size={16} />
        <span className="font-mono text-xs uppercase tracking-[0.25em] capitalize">
          {datasetInfo.display_name} loaded — {datasetInfo.samples} samples, {datasetInfo.features} features
        </span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-cyan" />
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-fog">02 · Run parameters</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 rounded-xl border border-line bg-panel px-6 py-5 mb-8">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label className="text-sm text-mist">Train / test split</label>
            <span className="font-mono text-sm text-cyan tabular-nums">
              {Math.round(config.train_ratio * 100)} / {Math.round((1 - config.train_ratio) * 100)}
            </span>
          </div>
          <input
            type="range" min={0.51} max={0.94} step={0.01}
            value={config.train_ratio}
            onChange={(e) => setConfig((c) => ({ ...c, train_ratio: parseFloat(e.target.value) }))}
            className="w-full accent-cyan"
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label className="text-sm text-mist">Max K to evaluate</label>
            <span className="font-mono text-sm text-cyan tabular-nums">{config.max_k}</span>
          </div>
          <input
            type="range" min={3} max={99} step={1}
            value={config.max_k}
            onChange={(e) => setConfig((c) => ({ ...c, max_k: parseInt(e.target.value, 10) }))}
            className="w-full accent-cyan"
          />
        </div>
      </div>

      <button
        onClick={onRun}
        className="w-full rounded-xl bg-cyan text-ink font-display text-lg font-medium py-4 hover:bg-cyan/90 transition-colors"
      >
        Find optimal K &amp; fit model
      </button>
    </motion.div>
  )
}