import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, ArrowLeft } from 'lucide-react'
import type { DatasetSummary, OptimalModel } from '../types'

const PALETTE = ['#5EEAD4', '#FF6B4A', '#F2C078', '#9B8CFF', '#7ED957', '#4AB8FF']
const W = 640
const H = 380

interface TrainPoint {
  id: string
  x: number
  y: number
  classIndex: number
}

interface TrainPointWithDist extends TrainPoint {
  d: number
}

interface QueryPoint {
  id: number
  x: number
  y: number
  correct: boolean
}

interface ResolvedQuery extends QueryPoint {
  predictedClass: number
  neighbours: TrainPointWithDist[]
}

interface KnnFitPredictVizProps {
  datasetInfo: DatasetSummary
  optimal: OptimalModel
  testAccuracy: number
  onContinue: () => void
  onBack: () => void
}

function seeded(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export default function KnnFitPredictViz({ datasetInfo, optimal, testAccuracy, onContinue, onBack }: KnnFitPredictVizProps) {
  const classes = datasetInfo.classes?.length ? datasetInfo.classes : ['A', 'B', 'C']
  const k = optimal.k || 5
  const shownK = Math.min(k, 9)

  const trainPoints = useMemo<TrainPoint[]>(() => {
    const perClass = 16
    const pts: TrainPoint[] = []
    classes.forEach((_name, ci) => {
      const angle = (ci / classes.length) * Math.PI * 2 - Math.PI / 2
      const cx = W / 2 + Math.cos(angle) * (W * 0.28)
      const cy = H / 2 + Math.sin(angle) * (H * 0.32)
      for (let i = 0; i < perClass; i++) {
        const r1 = seeded(ci * 97 + i * 3.1)
        const r2 = seeded(ci * 53 + i * 7.7 + 1)
        const rad = 55 * Math.sqrt(r1)
        const ang = r2 * Math.PI * 2
        pts.push({
          id: `${ci}-${i}`,
          x: cx + Math.cos(ang) * rad,
          y: cy + Math.sin(ang) * rad,
          classIndex: ci,
        })
      }
    })
    return pts
  }, [classes])

  const queries = useMemo<QueryPoint[]>(() => {
    const n = 6
    return Array.from({ length: n }, (_, i) => {
      const rx = seeded(i * 31 + 4) * (W - 120) + 60
      const ry = seeded(i * 61 + 8) * (H - 120) + 60
      const correct = seeded(i * 91 + 2) < (testAccuracy ?? 0.9)
      return { id: i, x: rx, y: ry, correct }
    })
  }, [testAccuracy])

  const [stepIndex, setStepIndex] = useState(0) // which query is animating
  const [resolved, setResolved] = useState<ResolvedQuery[]>([])

  useEffect(() => {
    if (stepIndex >= queries.length) return
    const q = queries[stepIndex]
    const dists: TrainPointWithDist[] = trainPoints
      .map((p) => ({ ...p, d: Math.hypot(p.x - q.x, p.y - q.y) }))
      .sort((a, b) => a.d - b.d)
    const neighbours = dists.slice(0, k)
    const votes: Record<number, number> = {}
    neighbours.forEach((n) => { votes[n.classIndex] = (votes[n.classIndex] || 0) + 1 })
    const majorityClass = Number(Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0])
    const predictedClass = q.correct
      ? majorityClass
      : (majorityClass + 1) % classes.length

    const timer = setTimeout(() => {
      setResolved((r) => [...r, { ...q, predictedClass, neighbours: neighbours.slice(0, shownK) }])
      setStepIndex((s) => s + 1)
    }, 1350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex])

  const activeQuery = stepIndex < queries.length ? queries[stepIndex] : null
  const activeNeighbours = useMemo<TrainPointWithDist[]>(() => {
    if (!activeQuery) return []
    return trainPoints
      .map((p) => ({ ...p, d: Math.hypot(p.x - activeQuery.x, p.y - activeQuery.y) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, shownK)
  }, [activeQuery, trainPoints, shownK])

  const allDone = stepIndex >= queries.length

  return (
    <div className="w-full max-w-3xl mx-auto">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-fog mb-2 text-center">
        Fitting on training data · predicting on test data
      </p>
      <h3 className="font-display text-2xl text-paper mb-3 text-center">
        Voting among the {k} nearest neighbours{k > shownK ? ` (nearest ${shownK} shown)` : ''}
      </h3>

      <div className="flex items-start gap-2 mb-4 text-xs text-fog bg-panel border border-line rounded-lg px-3 py-2">
        <Info size={14} className="mt-0.5 shrink-0 text-cyan" />
        <p>Illustrative: points are laid out on a stylised 2D map grouped by class, not the model's real feature space — the model itself uses all {datasetInfo.features} features.</p>
      </div>

      <div className="rounded-xl border border-line bg-panel2 overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {/* neighbour lines for active query */}
          {activeQuery && activeNeighbours.map((n) => (
            <line key={n.id} x1={activeQuery.x} y1={activeQuery.y} x2={n.x} y2={n.y}
              stroke={PALETTE[n.classIndex % PALETTE.length]} strokeOpacity={0.5} strokeWidth={1} />
          ))}

          {/* resolved queries' neighbour lines, faint */}
          {resolved.map((q) => q.neighbours.map((n) => (
            <line key={q.id + n.id} x1={q.x} y1={q.y} x2={n.x} y2={n.y}
              stroke={PALETTE[n.classIndex % PALETTE.length]} strokeOpacity={0.12} strokeWidth={1} />
          )))}

          {/* training points */}
          {trainPoints.map((p) => (
            <circle key={p.id} cx={p.x} cy={p.y} r={4} fill={PALETTE[p.classIndex % PALETTE.length]} fillOpacity={0.8} />
          ))}

          {/* active scan rings */}
          {activeQuery && (
            <motion.circle
              cx={activeQuery.x} cy={activeQuery.y} r={2}
              fill="none" stroke="#EDF1F4" strokeWidth={1.5}
              initial={{ r: 2, opacity: 0.9 }}
              animate={{ r: 70, opacity: 0 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
            />
          )}

          {/* active query point */}
          {activeQuery && (
            <motion.circle
              cx={activeQuery.x} cy={activeQuery.y} r={7}
              fill="#080B0F" stroke="#EDF1F4" strokeWidth={2}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
            />
          )}

          {/* resolved queries */}
          <AnimatePresence>
            {resolved.map((q) => (
              <motion.g key={q.id} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}>
                <circle cx={q.x} cy={q.y} r={9} fill="none"
                  stroke={q.correct ? '#7ED957' : '#FF6B4A'} strokeWidth={2} />
                <circle cx={q.x} cy={q.y} r={5.5} fill={PALETTE[q.predictedClass % PALETTE.length]} />
              </motion.g>
            ))}
          </AnimatePresence>
        </svg>
      </div>

      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-5 mb-3">
        {classes.map((name, i) => (
          <div key={name} className="flex items-center gap-2 text-sm text-mist">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="capitalize">{name}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-6 mb-8 text-xs text-fog">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border-2 border-good" /> Correctly classified (demo)</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border-2 border-coral" /> Misclassified (demo)</div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-6 py-3 text-mist hover:border-cyan hover:text-cyan transition-colors font-display"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={onContinue}
          disabled={!allDone}
          className="rounded-xl bg-cyan text-ink font-display px-8 py-3 hover:bg-cyan/90 transition-colors disabled:opacity-40 disabled:cursor-wait"
        >
          {allDone ? 'View full results →' : 'Predicting…'}
        </button>
      </div>
    </div>
  )
}