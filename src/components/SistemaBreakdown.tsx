'use client'

interface SistemaData {
  sistema: string
  total: number
  testados: number
  pct: number
}

interface SistemaBreakdownProps {
  sistemas: SistemaData[]
}

export default function SistemaBreakdown({ sistemas }: SistemaBreakdownProps) {
  return (
    <div className="card mb-6">
      <h3 className="text-[1.05rem] font-serif font-bold text-slate-800 mb-5">Progresso por Sistema</h3>
      <div className="flex flex-col gap-1">
        {sistemas.map((s, i) => (
          <div
            key={s.sistema}
            className={`grid grid-cols-[150px_1fr_60px] items-center gap-4 py-2.5 px-3 rounded-lg transition-colors hover:bg-slate-50 text-[0.875rem]`}
          >
            <div className="truncate font-semibold text-slate-700">{s.sistema}</div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-forest rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${s.pct}%` }}
              />
            </div>
            <div className="text-right font-mono font-medium text-slate-500">{s.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}
