import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Point {
  x: number
  y: number
}

interface SplashScreenProps {
  onDone: () => void
}

// Positions for the "neighbour graph" logo: one query point at centre,
// k=6 neighbours arranged around it. Each flies in from a random edge.
const NEIGHBOURS: Point[] = [
  { x: 0, y: -46 }, { x: 40, y: -22 }, { x: 40, y: 24 },
  { x: 0, y: 48 }, { x: -40, y: 24 }, { x: -40, y: -22 },
]

function randomEdgeStart(): Point {
  const side = Math.floor(Math.random() * 4)
  const far = 260
  if (side === 0) return { x: (Math.random() - 0.5) * far * 2, y: -far }
  if (side === 1) return { x: far, y: (Math.random() - 0.5) * far * 2 }
  if (side === 2) return { x: (Math.random() - 0.5) * far * 2, y: far }
  return { x: -far, y: (Math.random() - 0.5) * far * 2 }
}

type Phase = 'assemble' | 'scan' | 'title' | 'exit'

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<Phase>('assemble')
  const [starts] = useState<Point[]>(() => NEIGHBOURS.map(randomEdgeStart))

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('scan'), 1100)
    const t2 = setTimeout(() => setPhase('title'), 1750)
    const t3 = setTimeout(() => setPhase('exit'), 3400)
    const t4 = setTimeout(() => onDone(), 3950)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [onDone])

  return (
    <AnimatePresence>
      {phase !== 'exit' && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink bg-grid bg-grid overflow-hidden"
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
        >
          <div className="relative w-[240px] h-[240px] flex items-center justify-center">
            {/* scan rings */}
            {phase === 'scan' && (
              <>
                <span className="absolute inset-0 rounded-full border border-cyan animate-scan" />
                <span className="absolute inset-0 rounded-full border border-cyan animate-scan" style={{ animationDelay: '0.4s' }} />
              </>
            )}

            {/* edges */}
            <svg className="absolute inset-0" width="240" height="240" viewBox="-120 -120 240 240">
              {NEIGHBOURS.map((n, i) => (
                <motion.line
                  key={i}
                  x1={0} y1={0} x2={n.x} y2={n.y}
                  stroke="#2C8C7E"
                  strokeWidth="1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: phase === 'assemble' ? 0 : 0.6 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                />
              ))}
            </svg>

            {/* neighbour dots flying in */}
            {NEIGHBOURS.map((n, i) => (
              <motion.span
                key={i}
                className="absolute w-2.5 h-2.5 rounded-full bg-cyan"
                style={{ left: '50%', top: '50%', marginLeft: -5, marginTop: -5 }}
                initial={{ x: starts[i].x, y: starts[i].y, opacity: 0, scale: 0.4 }}
                animate={{ x: n.x, y: n.y, opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}

            {/* query point, pops in last */}
            <motion.span
              className="absolute w-4 h-4 rounded-full bg-coral shadow-[0_0_18px_rgba(255,107,74,0.7)]"
              style={{ left: '50%', top: '50%', marginLeft: -8, marginTop: -8 }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.4, ease: 'backOut' }}
            />
          </div>

          <AnimatePresence>
            {(phase === 'title') && (
              <motion.div
                className="text-center mt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="font-display text-3xl md:text-4xl tracking-tight text-paper">
                  KNN <span className="text-cyan">Classifier</span>
                </h1>
                <p className="font-mono text-xs text-fog mt-2 tracking-[0.3em] uppercase">
                  Neighbour Visualiser
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}