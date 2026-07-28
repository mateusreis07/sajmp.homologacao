import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function DetalheReportPage({ params }: { params: Promise<{ tenantSlug: string, id: string }> }) {
  const { tenantSlug, id } = await params
  
  const report = await prisma.versionReport.findUnique({
    where: { id: parseInt(id) },
    include: { tenant: true }
  })

  if (!report || report.tenant.slug !== tenantSlug) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto pb-10 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex gap-2 items-center">
          <Link href={`/${tenantSlug}/reports`} className="text-slate-400 hover:text-slate-700 text-sm font-medium mr-2 transition-colors">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-serif font-bold text-slate-800">Detalhes do Report</h1>
        </div>
        
        <div className="flex gap-2">
          <Link
            href={`/${tenantSlug}/reports/${report.id}/editar`}
            className="btn btn-ghost bg-white"
          >
            Editar
          </Link>
          <a
            href={`/api/reports/${report.id}/pdf`}
            target="_blank"
            className="btn py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm"
          >
            📄 PDF
          </a>
          <a
            href={`/api/reports/${report.id}/docx`}
            target="_blank"
            className="btn py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
          >
            📝 Word
          </a>
        </div>
      </div>

      <div className="card p-8">
        <h2 className="text-2xl font-serif font-bold text-center mb-1 text-slate-800">Report de Atualização de Versão de Sistema</h2>
        <h3 className="text-lg font-bold text-center text-slate-500 mb-8">Time: Sustentação {report.tenant.nome}</h3>
        
        {/* Tabela 1: Dados da Atualização */}
        <table className="w-full text-sm text-left border-collapse border border-slate-200 mb-10 rounded-lg overflow-hidden hidden-border-collapse">
          <tbody>
            <tr className="border-b border-slate-200">
              <th className="bg-slate-50 p-3 w-1/3 font-bold text-slate-700">Sistema</th>
              <td className="p-3 bg-white">{report.sistema}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <th className="bg-slate-50 p-3 font-bold text-slate-700">Versão Anterior</th>
              <td className="p-3 bg-white font-mono text-slate-600">{report.versaoAnterior}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <th className="bg-slate-50 p-3 font-bold text-slate-700">Versão Atual</th>
              <td className="p-3 bg-emerald-50/50 font-mono font-bold text-emerald-800">{report.versaoAtual}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <th className="bg-slate-50 p-3 font-bold text-slate-700">Data/Hora da Atualização</th>
              <td className="p-3 bg-white">
                {format(new Date(report.dataAtualizacao), "dd/MM/yyyy HH:mm")}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <th className="bg-slate-50 p-3 font-bold text-slate-700">Ambiente</th>
              <td className="p-3 bg-white">{report.ambiente === 'PRODUCAO' ? 'Produção' : 'Homologação'}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <th className="bg-slate-50 p-3 font-bold text-slate-700">Responsável pela Atualização</th>
              <td className="p-3 bg-white">{report.responsavel}</td>
            </tr>
            <tr>
              <th className="bg-slate-50 p-3 font-bold text-slate-700 border-b-0">Status da Atualização</th>
              <td className="p-3 bg-white font-bold">
                {report.statusAtualizacao === 'SUCESSO' ? <span className="text-emerald-600">✅ Sucesso</span> :
                 report.statusAtualizacao === 'PARCIAL' ? <span className="text-amber-600">⚠️ Parcial</span> : <span className="text-rose-600">❌ Falha</span>}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Tabela 2: Indicadores Operacionais */}
        <h3 className="text-lg font-bold mb-3 font-serif text-slate-800">Indicadores Operacionais</h3>
        <div className="overflow-hidden border border-slate-200 rounded-lg mb-10">
          <table className="w-full text-sm text-left border-collapse bg-white">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3 w-2/3 font-bold uppercase tracking-wider text-xs">Indicador</th>
                <th className="p-3 text-center font-bold uppercase tracking-wider text-xs">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3 text-slate-700">Atendimentos encerrados na versão anterior</td>
                <td className="p-3 text-center font-mono font-medium">{report.atendimentosEncerrados || '-'}</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3 text-slate-700">Atendimentos abertos após a entrada da nova versão</td>
                <td className="p-3 text-center font-mono font-medium">{report.atendimentosAbertos || '-'}</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3 text-slate-700">Usuários afetados por defeitos da versão</td>
                <td className="p-3 text-center font-mono font-medium">{report.usuariosAfetados || '-'}</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3 text-slate-700">Quantidade de defeitos identificados</td>
                <td className="p-3 text-center font-mono font-medium">{report.defeitosIdentificados || '-'}</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3 text-slate-700">Incidentes críticos</td>
                <td className="p-3 text-center font-mono font-medium">{report.incidentesCriticos || '-'}</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3 text-slate-700">Incidentes de média/baixa criticidade</td>
                <td className="p-3 text-center font-mono font-medium">{report.incidentesMediaBaixa || '-'}</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3 text-slate-700">Tempo total de indisponibilidade (se houver)</td>
                <td className="p-3 text-center font-mono font-medium">{report.tempoIndisponibilidade || '-'}</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3 text-slate-700">Tempo para estabilização da versão</td>
                <td className="p-3 text-center font-mono font-medium">{report.tempoEstabilizacao || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Observações */}
        <h3 className="text-lg font-bold mb-4 font-serif text-slate-800">Observações</h3>
        <ul className="list-disc pl-5 text-sm space-y-4">
          <li className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <strong className="text-slate-800">Principais melhorias entregues:</strong>
            <p className="mt-2 text-slate-600 whitespace-pre-wrap">{report.melhorias || 'Nenhuma informada.'}</p>
          </li>
          <li className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <strong className="text-slate-800">Principais problemas identificados:</strong>
            <p className="mt-2 text-slate-600 whitespace-pre-wrap">{report.problemas || 'Nenhum informado.'}</p>
          </li>
          <li className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <strong className="text-slate-800">Ações em andamento:</strong>
            <p className="mt-2 text-slate-600 whitespace-pre-wrap">{report.acoesAndamento || 'Nenhuma informada.'}</p>
          </li>
        </ul>
      </div>
    </div>
  )
}
