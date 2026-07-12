interface ConfusionMatrixProps {
  matrix: number[][]
  classes: string[]
}

export default function ConfusionMatrix({ matrix, classes }: ConfusionMatrixProps) {
  const max = Math.max(...matrix.flat())

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse mx-auto">
        <thead>
          <tr>
            <th className="w-28" />
            <th colSpan={classes.length} className="pb-2 text-xs text-fog font-normal uppercase tracking-wider">
              Predicted
            </th>
          </tr>
          <tr>
            <th />
            {classes.map((c) => (
              <th key={c} className="px-2 pb-2 text-xs text-mist font-normal capitalize max-w-[80px] truncate">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              {i === 0 && (
                <th rowSpan={matrix.length} className="pr-3 text-xs text-fog font-normal uppercase tracking-wider [writing-mode:vertical-rl] rotate-180">
                  Actual
                </th>
              )}
              <th className="pr-3 text-xs text-mist font-normal text-right capitalize whitespace-nowrap">{classes[i]}</th>
              {row.map((v, j) => {
                const intensity = max ? v / max : 0
                const isDiag = i === j
                return (
                  <td key={j} className="p-1">
                    <div
                      className="w-12 h-12 flex items-center justify-center rounded-md font-mono text-sm tabular-nums"
                      style={{
                        background: isDiag
                          ? `rgba(94,234,212,${0.15 + intensity * 0.6})`
                          : `rgba(255,107,74,${v ? 0.12 + intensity * 0.5 : 0.04})`,
                        color: intensity > 0.55 ? '#080B0F' : '#EDF1F4',
                      }}
                    >
                      {v}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}