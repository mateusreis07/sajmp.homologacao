'use client'

import { STATUS_META } from '@/lib/constants'

interface ItemsTableProps {
  items: any[]
  onEdit: (id: number) => void
}

export default function ItemsTable({ items, onEdit }: ItemsTableProps) {
  return (
    <table className="w-full border-collapse text-[0.82rem] min-w-[900px]">
      <thead className="sticky top-0 z-10 bg-white">
        <tr>
          <th className="text-left py-3 px-4 font-semibold text-[0.7rem] uppercase tracking-wider whitespace-nowrap text-slate-500 border-b border-slate-200">
            ID / Sistema
          </th>
          <th className="text-left py-3 px-4 font-semibold text-[0.7rem] uppercase tracking-wider whitespace-nowrap text-slate-500 border-b border-slate-200">
            Módulo / Tela
          </th>
          <th className="text-left py-3 px-4 font-semibold text-[0.7rem] uppercase tracking-wider whitespace-nowrap text-slate-500 border-b border-slate-200">
            Status
          </th>
          <th className="text-left py-3 px-4 font-semibold text-[0.7rem] uppercase tracking-wider whitespace-nowrap text-slate-500 border-b border-slate-200">
            Responsável
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((i) => {
          const st = STATUS_META[i.status as keyof typeof STATUS_META] || STATUS_META.PENDENTE
          return (
            <tr
              key={i.id}
              onClick={() => onEdit(i.id)}
              className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                i.arquivado ? 'opacity-48' : ''
              }`}
            >
              <td className="py-3 px-4 align-top">
                <div className="font-mono text-slate-400 text-xs font-semibold mb-1">#{i.numeroRoteiro}</div>
                <div className="font-semibold text-slate-800">{i.sistema}</div>
              </td>
              <td className="py-3 px-4 align-top">
                <div className="text-slate-500 text-[0.75rem] font-medium">{i.modulo}</div>
                <div className="mt-0.5 font-semibold text-slate-700 max-w-[400px] truncate" title={i.tela}>
                  {i.tela}
                </div>
                {i.cenario && (
                  <div className="mt-1 text-[0.75rem] text-slate-400 max-w-[400px] truncate leading-tight" title={i.cenario}>
                    {i.cenario}
                  </div>
                )}
              </td>
              <td className="py-3 px-4 align-top">
                <div
                  className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[0.75rem] font-semibold tracking-wide whitespace-nowrap shadow-sm border"
                  style={{ backgroundColor: st.color + '15', color: st.color, borderColor: st.color + '30' }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: st.color }}
                  />
                  {st.label}
                </div>
              </td>
              <td className="py-3 px-4 align-top">
                <div className="text-slate-700 font-medium">{i.responsavel || '-'}</div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
