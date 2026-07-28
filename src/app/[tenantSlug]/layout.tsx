import TopBar from '@/components/TopBar'
import TabNav from '@/components/TabNav'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}) {
  const session = await auth()
  const { tenantSlug } = await params

  if (!session?.user) {
    redirect('/login')
  }

  // Ensure they are accessing their own tenant
  if (session.user.role !== 'SUPER_ADMIN' && session.user.tenantSlug !== tenantSlug) {
    if (session.user.tenantSlug) {
      redirect(`/${session.user.tenantSlug}/dashboard`)
    } else {
      redirect('/login')
    }
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  })

  if (!tenant) {
    return (
      <div className="p-10 text-center">
        <h2>Tenant não encontrado</h2>
      </div>
    )
  }

  return (
    <div id="app-root" className="app-shell">
      <TopBar tenant={tenant} user={session.user} />
      <TabNav tenantSlug={tenantSlug} />
      <main>{children}</main>
    </div>
  )
}
