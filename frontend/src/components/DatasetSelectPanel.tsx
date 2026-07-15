import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Database, AlertTriangle } from 'lucide-react'
import { fetchDatasets } from '../api'
import type { DatasetName, DatasetSummary } from '../types'

const DATASET_BLURB: Record<DatasetName, string> = {
  iris: 'Petal & sepal measurements across three iris species.',
  digits: '8×8 pixel scans of handwritten digits, 0 through 9.',
  wine: 'Chemical assay results from three Italian wine cultivars.',
  breast_cancer: 'Diagnostic cell-nuclei measurements, benign vs malignant.',
}

interface DatasetSelectPanelProps {
  dataset: DatasetName
  onSelect: (dataset: DatasetName) => void
  connectionError?: string | null
}

// Placeholder cards shown before the real dataset list has loaded.
const PLACEHOLDER_DATASETS: Pick<DatasetSummary, 'name' | 'display_name' | 'samples' | 'features' | 'classes'>[] =
  (Object.keys(DATASET_BLURB) as DatasetName[]).map((name) => ({
    name,
    display_name: name.replace('_', ' '),
    samples: 0,
    features: 0,
    classes: [],
  }))

export default function DatasetSelectPanel({ dataset, onSelect, connectionError }: DatasetSelectPanelProps) {
  const [datasets, setDatasets] = useState<DatasetSummary[] | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)

  useEffect(() => {
    fetchDatasets()
      .then((d) => setDatasets(d.datasets))
      .catch((e: Error) => setLoadErr(e.message))
  }, [])

  const cards = datasets ?? PLACEHOLDER_DATASETS

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="flex flex-col items-center justify-canter gap-2 mb-6 text-center">
        <Database size={28} className="text-cyan" />
        <span className="font-mono text-base font-bold uppercase tracking-[0.25em] text-fog">01 · Select dataset</span>
      </div>

      {loadErr && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Can't reach the model server.</p>
            <p className="text-coral/80 mt-0.5">{loadErr} — start the FastAPI backend and confirm VITE_API_URL, then refresh.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {cards.map((d) => {
          const active = dataset === d.name
          return (
            <motion.button
              key={d.name}
              onClick={() => onSelect(d.name)}
              disabled={!!loadErr}
              whileHover={loadErr ? undefined : {
                y: -7,
                scale: 1.025,
                boxShadow: '0 18px 38px rgba(0, 0, 0, 0.38)',
              }}
              whileTap={loadErr ? undefined : { scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 360, damping: 22 }}
              className={`text-left rounded-xl border px-5 py-4 disabled:opacity-40 disabled:cursor-not-allowed ${
                active ? 'border-cyan bg-cyan/[0.07]' : 'border-line bg-panel hover:border-cyan'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-lg text-paper uppercase">{d.display_name}</span>
                {active && <span className="w-2 h-2 rounded-full bg-cyan" />}
              </div>
              <p className="text-sm text-mist mt-1 leading-snug">{DATASET_BLURB[d.name]}</p>
              {datasets && (
                <div className="flex gap-4 mt-3 font-mono text-xs text-fog">
                  <span>{d.samples} samples</span>
                  <span>{d.features} features</span>
                  <span>{d.classes.length} classes</span>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {connectionError && <p className="text-coral text-sm mt-3 text-center">{connectionError}</p>}
    </motion.div>
  )
}