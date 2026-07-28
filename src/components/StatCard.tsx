'use client'

import StampSeal from './StampSeal'

interface StatCardProps {
  label: string
  num: number
  color: string
  stampLabel: string | null
  total?: number
}

export default function StatCard({ label, num, color, stampLabel, total }: StatCardProps) {
  const pct = total && total > 0 ? Math.round((num / total) * 100) : 0

  return (
    <div className="card relative overflow-hidden group hover:shadow-md hover:border-slate-300">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-[2rem] leading-none tracking-tight transition-transform group-hover:scale-[1.02]" style={{ color }}>
            {num}
          </div>
          <div className="text-[0.72rem] font-bold uppercase tracking-wider text-slate-500 mt-2 pr-2">
            {label}
          </div>
        </div>

        {/* Percentual em destaque (só aparece quando total for informado) */}
        {total !== undefined && (
          <div
            className="shrink-0 text-[1.55rem] font-bold leading-none mt-0.5 font-mono opacity-80"
            style={{ color }}
          >
            {pct}%
          </div>
        )}
      </div>

      {/* Barra de progresso */}
      {total !== undefined && (
        <div className="h-1.5 rounded-full bg-slate-100 mt-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      )}

      {stampLabel && <StampSeal label={stampLabel} color={color} />}
    </div>
  )
}
