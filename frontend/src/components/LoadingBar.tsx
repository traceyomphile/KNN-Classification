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
      <div className="h-1.5 w-full rounded-full bg-panel2 overflow-hidden border border-line">
        <motion.div
          className="h-full bg-gradient-to-r from-cyanDim to-cyan"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ ease: 'easeOut', duration: 0.3 }}
        />
      </div>
      <p className="font-mono text-xs text-cyan mt-3 tabular-nums">{Math.round(Math.min(progress, 100))}%</p>
    </div>
  )
}