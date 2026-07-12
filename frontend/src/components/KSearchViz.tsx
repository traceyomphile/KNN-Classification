import { useEffect, useRef, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Legend,
} from 'recharts'
import { motion } from 'framer-motion'
import type { KResultPoint, OptimalModel } from '../types'

interface KSearchVizProps {
  kResults: KResultPoint[]
  optimal: OptimalModel
  onContinue: () => void
}

export default function KSearchViz({ kResults, optimal, onContinue }: KSearchVizProps) {
  const [visibleCount, setVisibleCount] = useState(0)
  const doneRef = useRef(false)

  useEffect(() => {
    if (!kResults?.length) return
    setVisibleCount(0)
    doneRef.current = false
    const stepMs = Math.max(18, Math.min(70, 1400 / kResults.length))
    const id = setInterval(() => {
      setVisibleCount((c) => {
        if (c >= kResults.length) {
          clearInterval(id)
          doneRef.current = true
          return c
        }
        return c + 1
      })
    }, stepMs)
    return () => clearInterval(id)
  }, [kResults])

  const visible = kResults?.slice(0, visibleCount) || []
  const sweeping = visibleCount < (kResults?.length || 0)

  return (
    <div className="w-full max-w-3xl mx-auto">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-fog mb-2 text-center">
        Cross-validating every odd K
      </p>
      <h3 className="font-display text-2xl text-paper mb-6 text-center">
        {sweeping ? 'Sweeping K values…' : `Optimal K = ${optimal.k}`}
      </h3>

      <div className="h-72 rounded-xl border border-line bg-panel p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visible} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="#232C36" strokeDasharray="3 3" />
            <XAxis dataKey="k" stroke="#586373" fontSize={11} tickLine={false} />
            <YAxis stroke="#586373" fontSize={11} tickLine={false} domain={[0, 1]} />
            <Tooltip
              contentStyle={{ background: '#161D25', border: '1px solid #232C36', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#EDF1F4' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#8B96A3' }} />
            <Line type="monotone" dataKey="cv_accuracy" name="CV accuracy" stroke="#5EEAD4" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="test_accuracy" name="Test accuracy" stroke="#FF6B4A" strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
            {!sweeping && optimal && (
              <ReferenceLine x={optimal.k} stroke="#F2C078" strokeDasharray="2 2" label={{ value: `k=${optimal.k}`, fill: '#F2C078', fontSize: 11, position: 'top' }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {!sweeping && optimal && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex justify-center gap-8 mt-6 mb-8"
        >
          <Stat label="Mean CV accuracy" value={optimal.mean_cv_accuracy} />
          <Stat label="Held-out test accuracy" value={optimal.test_accuracy} />
        </motion.div>
      )}

      <div className="text-center">
        <button
          onClick={onContinue}
          disabled={sweeping}
          className="rounded-xl bg-cyan text-ink font-display px-8 py-3 hover:bg-cyan/90 transition-colors disabled:opacity-40 disabled:cursor-wait"
        >
          {sweeping ? 'Sweeping…' : 'Continue to fit & predict →'}
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-mono text-2xl text-gold tabular-nums">{(value * 100).toFixed(1)}%</p>
      <p className="text-xs text-mist mt-1">{label}</p>
    </div>
  )
}