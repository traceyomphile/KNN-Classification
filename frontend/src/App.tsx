import { useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

import SplashScreen from './components/SplashScreen'
import StepHeader from './components/StepHeader'
import DatasetSelectPanel from './components/DatasetSelectPanel'
import LoadingBar from './components/LoadingBar'
import ConfigPanel from './components/ConfigPanel'
import KSearchViz from './components/KSearchViz'
import KnnFitPredictViz from './components/KNNFitPredictViz'
import ResultsPanel from './components/ResultsPanel'
import { runAnalysis } from './api'
import type { AnalysisResponse, DatasetName, RunConfig, Stage } from './types'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [stage, setStage] = useState<Stage>('select')
  const [dataset, setDataset] = useState<DatasetName>('iris')
  const [config, setConfig] = useState<RunConfig>({ train_ratio: 0.8, max_k: 25 })
  const [loadProgress, setLoadProgress] = useState(0)
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const runId = useRef(0)

  function handleDatasetSelect(nextDataset: DatasetName) {
    runId.current += 1
    setDataset(nextDataset)
    setResult(null)
    setError(null)
    setStage('loading')
    setLoadProgress(0)
  }

  useEffect(() => {
    if (stage !== 'loading') return
    let finishTimeout: ReturnType<typeof setTimeout> | undefined
    const id = setInterval(() => {
      setLoadProgress((p) => {
        if (p >= 100) {
          clearInterval(id)
          finishTimeout = setTimeout(() => setStage('configure'), 250)
          return 100
        }
        return p + (100 - p) * 0.18 + 2
      })
    }, 90)
    return () => {
      clearInterval(id)
      if (finishTimeout) clearTimeout(finishTimeout)
    }
  }, [stage])

  function handleRun() {
    const currentRun = ++runId.current
    setError(null)
    setResult(null)
    setStage('search')
    runAnalysis({ dataset, train_ratio: config.train_ratio, max_k: config.max_k })
      .then((res) => {
        if (runId.current === currentRun) setResult(res)
      })
      .catch((err: Error) => {
        if (runId.current === currentRun) setError(err.message)
      })
  }

  function handleRestart() {
    runId.current += 1
    setResult(null)
    setError(null)
    setStage('select')
  }

  return (
    <div className="min-h-screen bg-ink bg-grid bg-grid text-paper font-body">
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      {!showSplash && (
        <>
          <StepHeader stage={stage} />
          <main className="px-6 py-14 min-h-[80vh] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {stage === 'select' && (
                <motion.div key="select" exit={{ opacity: 0 }} className="w-full">
                  <DatasetSelectPanel dataset={dataset} onSelect={handleDatasetSelect} />
                </motion.div>
              )}

              {stage === 'loading' && (
                <motion.div key="loading" exit={{ opacity: 0 }} className="w-full">
                  <LoadingBar
                    progress={loadProgress}
                    label={`Loading ${dataset.replace('_', ' ')}`}
                    sublabel="Fetching samples & standard-scaling features"
                  />
                  <BackButton onClick={handleRestart} label="Back to datasets" />
                </motion.div>
              )}

              {stage === 'configure' && (
                <motion.div key="configure" exit={{ opacity: 0 }} className="w-full">
                  <ConfigPanel
                    datasetInfo={{ display_name: dataset.replace('_', ' '), samples: '—', features: '—' }}
                    config={config}
                    setConfig={setConfig}
                    onRun={handleRun}
                    onBack={handleRestart}
                  />
                </motion.div>
              )}

              {stage === 'search' && (
                <motion.div key="search" exit={{ opacity: 0 }} className="w-full">
                  {error ? (
                    <ErrorBlock message={error} onBack={() => setStage('configure')} />
                  ) : result ? (
                    <KSearchViz
                      kResults={result.k_results}
                      optimal={result.optimal_model}
                      onContinue={() => setStage('fit')}
                      onBack={() => setStage('configure')}
                    />
                  ) : (
                    <>
                      <LoadingBar
                        progress={92}
                        label="Searching for the optimal K"
                        sublabel={`Cross-validating odd K values up to ${config.max_k}`}
                      />
                      <BackButton onClick={() => { runId.current += 1; setStage('configure') }} label="Back to parameters" />
                    </>
                  )}
                </motion.div>
              )}

              {stage === 'fit' && result && (
                <motion.div key="fit" exit={{ opacity: 0 }} className="w-full">
                  <KnnFitPredictViz
                    datasetInfo={result.dataset}
                    optimal={result.optimal_model}
                    testAccuracy={result.optimal_model.test_accuracy}
                    onContinue={() => setStage('results')}
                    onBack={() => setStage('search')}
                  />
                </motion.div>
              )}

              {stage === 'results' && result && (
                <motion.div key="results" exit={{ opacity: 0 }} className="w-full">
                  <ResultsPanel
                    result={result}
                    onRestart={handleRestart}
                    onBack={() => setStage('fit')}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </>
      )}
    </div>
  )
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className="mt-8 text-center">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-mist hover:border-cyan hover:text-cyan transition-colors font-display"
      >
        <ArrowLeft size={16} /> {label}
      </button>
    </div>
  )
}

function ErrorBlock({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="max-w-md mx-auto text-center">
      <AlertTriangle className="mx-auto text-coral mb-4" size={28} />
      <p className="font-display text-xl text-paper mb-2">Analysis failed</p>
      <p className="text-mist text-sm mb-6">{message}</p>
      <button
        onClick={onBack}
        className="rounded-xl border border-line px-6 py-3 text-mist hover:border-cyan hover:text-cyan transition-colors font-display"
      >
        <ArrowLeft size={16} className="inline mr-2" /> Back to parameters
      </button>
    </div>
  )
}