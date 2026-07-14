import { motion } from 'framer-motion'
import { Sparkles, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react'
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
  onBack: () => void
}

export default function ConfigPanel({ datasetInfo, config, setConfig, onRun, onBack }: ConfigPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="flex flex-col items-center justify-center gap-2 mb-16 text-center">
        <CheckCircle2 size={18} />
        <span className="font-mono text-base uppercase tracking-[0.25em] text-fog">
          {datasetInfo.display_name} loaded — {datasetInfo.samples} samples - {datasetInfo.features} features
        </span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={28} className="text-cyan" />
        <span className="font-mono font-bold uppercase tracking-[0.20em] text-fog">02 · Run parameters</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 rounded-xl border border-line bg-panel px-6 py-5 mb-8">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label className="text-sm text-mist">TRAIN / TEST SPLIT</label>
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
            <label className="text-sm text-mist">MAX K </label>
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

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-5 py-4 text-mist hover:border-cyan hover:text-cyan transition-colors font-display"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={onRun}
          className="ml-auto inline-flex items-center justify-center gap-2 rounded-xl border border-line px-5 py-4 text-mist hover:border-cyan hover:text-cyan transition-colors font-display"
        >
          Optimal Search <ArrowRight size={16} /> 
        </button>
      </div>
    </motion.div>
  )
}