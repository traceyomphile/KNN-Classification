import { motion } from 'framer-motion'

interface LoadingBarProps {
  progress: number
  label: string
  sublabel?: string
}

export default function LoadingBar({ progress, label, sublabel }: LoadingBarProps) {
  return (
    <div className="w-full max-w-md mx-auto text-center">
      <p className="font-display text-xl text-paper mb-1">{label}</p>
      {sublabel && <p className="font-mono text-xs text-fog mb-6 tracking-wide">{sublabel}</p>}
      <div
        className="h-2 w-full rounded-full bg-panel2 overflow-hidden border border-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(progress, 100))}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: '#22c55e' }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ ease: 'easeOut', duration: 0.25 }}
        />
      </div>
      <p
        className="font-mono text-xs mt-3 tabular-nums"
        style={{ color: '#22c55e' }}
      >
        {Math.round(Math.min(progress, 100))}%
      </p>
    </div>
  )
}