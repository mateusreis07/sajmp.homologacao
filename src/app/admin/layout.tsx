import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (session?.user?.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="bg-ink text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="font-serif font-bold text-lg">Painel Super Admin</h1>
        <div className="flex gap-4 items-center">
          <Link href="/api/auth/signout" className="text-sm opacity-80 hover:opacity-100">Sair</Link>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-[1200px] mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
