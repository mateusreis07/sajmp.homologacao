import prisma from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function ReportsPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    include: { versionReports: { orderBy: { dataAtualizacao: 'desc' } } }
  })

  if (!tenant) return null

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-800">Reports de Atualização</h1>
          <p className="text-sm text-slate-500 mt-1">Histórico de atualizações de versão de sistema no {tenant.nome}</p>
        </div>
        <Link
          href={`/${tenantSlug}/reports/novo`}
          className="btn btn-primary shadow-sm text-sm"
        >
          + Novo Report
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tenant.versionReports.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-300 rounded-2xl bg-white/50">
            Nenhum report de atualização criado até o momento.
          </div>
        )}
        
        {tenant.versionReports.map((report) => (
          <div key={report.id} className="card p-5 flex flex-col group relative overflow-hidden transition-all hover:shadow-md hover:border-slate-300">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${
              report.statusAtualizacao === 'SUCESSO' ? 'bg-emerald-500' :
              report.statusAtualizacao === 'PARCIAL' ? 'bg-amber-500' : 'bg-rose-500'
            }`} />
            
            <div className="flex justify-between items-start mb-3 mt-1">
              <h3 className="font-serif font-bold text-lg text-slate-800 leading-tight">{report.sistema}</h3>
              <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider
                ${report.statusAtualizacao === 'SUCESSO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  report.statusAtualizacao === 'PARCIAL' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-rose-50 text-rose-700 border border-rose-200'}
              `}>
                {report.statusAtualizacao}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{report.versaoAnterior}</span>
              <span className="text-slate-400 text-xs font-bold">→</span>
              <span className="text-xs font-mono font-bold text-slate-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">{report.versaoAtual}</span>
            </div>
            
            <div className="flex flex-col gap-2 text-[0.8rem] text-slate-600 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p className="flex items-center gap-2"><span className="text-slate-400">📅</span> {format(new Date(report.dataAtualizacao), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}</p>
              <p className="flex items-center gap-2"><span className="text-slate-400">👤</span> {report.responsavel}</p>
              <p className="flex items-center gap-2"><span className="text-slate-400">🌐</span> {report.ambiente}</p>
            </div>
            
            <div className="mt-auto flex gap-2 pt-2">
              <Link
                href={`/${tenantSlug}/reports/${report.id}`}
                className="flex-1 btn btn-ghost bg-slate-100 text-slate-700 hover:bg-slate-200 py-1.5"
              >
                Ver Detalhes
              </Link>
              <Link
                href={`/${tenantSlug}/reports/${report.id}/editar`}
                className="btn btn-ghost py-1.5 px-3"
              >
                Editar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
