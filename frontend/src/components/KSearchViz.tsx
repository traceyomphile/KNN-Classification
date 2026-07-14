import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Legend,
} from 'recharts'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { KResultPoint, OptimalModel } from '../types'

interface KSearchVizProps {
  kResults: KResultPoint[]
  optimal: OptimalModel
  onContinue: () => void
  onBack: () => void
}

export default function KSearchViz({ kResults, optimal, onContinue, onBack }: KSearchVizProps) {
  const [visibleCount, setVisibleCount] = useState(0)
  useEffect(() => {
    if (!kResults?.length) return

    let id: number | undefined
    const resetId = window.setTimeout(() => {
      setVisibleCount(0)
      const stepMs = Math.max(18, Math.min(70, 1400 / kResults.length))
      id = window.setInterval(() => {
        setVisibleCount((c) => {
          if (c >= kResults.length) {
            if (id !== undefined) window.clearInterval(id)
            return c
          }
          return c + 1
        })
      }, stepMs)
    }, 0)

    return () => {
      if (id !== undefined) window.clearInterval(id)
      window.clearTimeout(resetId)
    }
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

      <div className="flex flex-col-reverse sm:flex-row justify-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-6 py-3 text-mist hover:border-cyan hover:text-cyan transition-colors font-display"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={onContinue}
          disabled={sweeping}
          className="ml-auto inline-flex items-center justify-center gap-2 rounded-xl border border-line px-5 py-4 text-mist hover:border-cyan hover:text-cyan transition-colors font-display disabled:opacity-40 disabled:cursor-wait"
        >
          {sweeping ? 'Sweeping…' : 'Run Model'} <ArrowRight size={16} />
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