import ImportView from '@/components/ImportView'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function ImportarPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const session = await auth()
  const { tenantSlug } = await params

  if (!session?.user) redirect('/login')

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out p-6 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h2 className="text-[1.3rem] font-serif font-bold text-ink mb-1">Importar Roteiro</h2>
        <p className="text-[0.85rem] text-ink-soft">
          Cole os dados da planilha Excel ou carregue um arquivo CSV
        </p>
      </div>

      <ImportView tenantSlug={tenantSlug} userName={session.user.name || 'Analista'} />
    </div>
  )
}
