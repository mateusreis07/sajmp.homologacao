'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Tenant {
  id: string
  nome: string
  slug: string
}

export default function CreateUserForm({ tenants }: { tenants: Tenant[] }) {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [username, setUsername] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState('ANALISTA')
  const [tenantId, setTenantId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, username, senha, role, tenantId: tenantId || null })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao criar usuário')
      } else {
        setSuccess(`Usuário "${username}" criado com sucesso!`)
        setNome('')
        setUsername('')
        setSenha('')
        setRole('ANALISTA')
        setTenantId('')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3 className="font-serif font-bold text-lg mb-4 text-slate-800">Novo Usuário</h3>
      {error && <div className="mb-3 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">{error}</div>}
      {success && <div className="mb-3 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100">✓ {success}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-[0.7rem] uppercase tracking-wider text-slate-500 mb-1 font-bold">Nome Completo</label>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full" required />
        </div>
        <div>
          <label className="block text-[0.7rem] uppercase tracking-wider text-slate-500 mb-1 font-bold">Username (Login)</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full font-mono" required />
        </div>
        <div>
          <label className="block text-[0.7rem] uppercase tracking-wider text-slate-500 mb-1 font-bold">Senha</label>
          <input type="password" value={senha} onChange={e => setSenha(e.target.value)} className="w-full" required />
        </div>
        <div>
          <label className="block text-[0.7rem] uppercase tracking-wider text-slate-500 mb-1 font-bold">Papel (Role)</label>
          <select value={role} onChange={e => setRole(e.target.value)} className="w-full">
            <option value="ANALISTA">ANALISTA</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
        </div>
        <div>
          <label className="block text-[0.7rem] uppercase tracking-wider text-slate-500 mb-1 font-bold">MP Vinculado</label>
          <select value={tenantId} onChange={e => setTenantId(e.target.value)} className="w-full">
            <option value="">— Global (sem MP) —</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.nome} ({t.slug})</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={loading} className="btn btn-primary w-full h-[38px]">
            {loading ? 'Criando...' : '+ Criar Usuário'}
          </button>
        </div>
      </div>
    </form>
  )
}
