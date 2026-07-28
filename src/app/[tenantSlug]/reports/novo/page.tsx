import ReportForm from '@/components/ReportForm'

export default async function NovoReportPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-serif font-bold text-slate-800 mb-6">Novo Report de Atualização</h1>
      <ReportForm tenantSlug={tenantSlug} />
    </div>
  )
}
