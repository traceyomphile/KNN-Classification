import { Radar } from 'lucide-react'
import type { Stage } from '../types'

const STEPS: Stage[] = ['source', 'select', 'loading', 'configure', 'search', 'fit', 'results']

interface StepHeaderProps {
  stage: Stage
  onHome: () => void
}

export default function StepHeader({ stage, onHome }: StepHeaderProps) {
  const idx = STEPS.indexOf(stage)
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/80 backdrop-blur">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onHome}
          aria-label="Return to Data Source"
          title="Return to Data Source"
          className="flex items-center gap-2 cursor-pointer bg-transparent border-0 p-0"
        >
          <Radar size={18} className="text-cyan" />
          <span className="font-display text-lg text-paper tracking-tight">KNN <span className="text-cyan">Classifier</span></span>
        </button>
        <div className="hidden md:flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i < idx ? 'bg-cyan' : i === idx ? 'bg-cyan animate-blink' : 'bg-line'
                }`}
              />
              {i < STEPS.length - 1 && <span className="w-4 h-px bg-line" />}
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}