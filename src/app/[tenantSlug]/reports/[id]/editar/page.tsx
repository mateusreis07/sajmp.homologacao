import ReportForm from '@/components/ReportForm'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'

export default async function EditarReportPage({ params }: { params: Promise<{ tenantSlug: string, id: string }> }) {
  const { tenantSlug, id } = await params
  
  const report = await prisma.versionReport.findUnique({
    where: { id: parseInt(id) },
    include: { tenant: true }
  })

  if (!report || report.tenant.slug !== tenantSlug) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-serif font-bold text-slate-800 mb-6">Editar Report</h1>
      <ReportForm tenantSlug={tenantSlug} initialData={report} />
    </div>
  )
}
