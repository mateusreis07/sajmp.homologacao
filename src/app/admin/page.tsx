import prisma from '@/lib/prisma'
import CreateTenantForm from '@/components/CreateTenantForm'
import CreateUserForm from '@/components/CreateUserForm'
import AdminTenantActions from '@/components/AdminTenantActions'
import AdminUserActions from '@/components/AdminUserActions'

export default async function AdminPage() {
  const tenants = await prisma.tenant.findMany({
    include: {
      _count: {
        select: {
          usuarios: true,
        }
      },
      roteiros: {
        orderBy: { id: 'desc' },
        take: 1,
        select: {
          _count: {
            select: { items: true }
          }
        }
      }
    },
    orderBy: { nome: 'asc' }
  })

  const users = await prisma.user.findMany({
    include: { tenant: true },
    orderBy: { nome: 'asc' }
  })

  const tenantsSimple = tenants.map(t => ({ id: t.id, nome: t.nome, slug: t.slug }))

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">

      {/* ── Criar Novo MP ────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold font-serif text-slate-800 mb-4">Ministérios Públicos</h2>
        <CreateTenantForm />

        <div className="card overflow-hidden p-0">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 uppercase text-[0.7rem] text-slate-500 tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">Slug / URL</th>
                <th className="p-3 text-center">Usuários</th>
                <th className="p-3 text-center">Itens</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 align-top transition-colors">
                  <td className="p-3 font-medium">{t.nome}</td>
                  <td className="p-3 font-mono text-xs">{t.slug}</td>
                  <td className="p-3 text-center">{t._count.usuarios}</td>
                  <td className="p-3 text-center">{t.roteiros?.[0]?._count?.items || 0}</td>
                  <td className="p-3">
                    <AdminTenantActions tenant={{ id: t.id, nome: t.nome, slug: t.slug }} />
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 italic">Nenhum MP cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Criar Novo Usuário ──────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold font-serif text-slate-800 mb-4 mt-6">Usuários do Sistema</h2>
        <CreateUserForm tenants={tenantsSimple} />

        <div className="card overflow-hidden mt-6 p-0">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 uppercase text-[0.7rem] text-slate-500 tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">Username</th>
                <th className="p-3">Papel</th>
                <th className="p-3">MP Associado</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 align-top transition-colors">
                  <td className="p-3 font-medium text-slate-800">{u.nome}</td>
                  <td className="p-3 font-mono text-xs">{u.username}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${u.role === 'SUPER_ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    {u.tenant ? (
                      <span className="font-mono text-xs text-slate-600">{u.tenant.nome}</span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Global</span>
                    )}
                  </td>
                  <td className="p-3">
                    <AdminUserActions
                      user={{ id: u.id, nome: u.nome, username: u.username, role: u.role, tenantId: u.tenantId }}
                      tenants={tenantsSimple}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
