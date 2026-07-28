'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Tenant {
  id: string
  nome: string
  slug: string
}

interface User {
  id: string
  nome: string
  username: string
  role: string
  tenantId: string | null
}

export default function AdminUserActions({ user, tenants }: { user: User; tenants: Tenant[] }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [nome, setNome] = useState(user.nome)
  const [username, setUsername] = useState(user.username)
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState(user.role)
  const [tenantId, setTenantId] = useState(user.tenantId || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const isProtected = user.username === 'admin'

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, username, senha, role, tenantId: tenantId || null })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao atualizar')
      } else {
        setIsEditing(false)
        setSenha('')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao excluir')
        setShowDeleteModal(false)
      } else {
        setShowDeleteModal(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-3 p-3 col-span-4 bg-slate-50 border border-slate-200 rounded-xl mt-2 mb-2 shadow-inner">
        {error && <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label>Nome</label>
            <input className="w-full" value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <div>
            <label>Username</label>
            <input className="w-full font-mono" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div>
            <label>Nova Senha</label>
            <input
              type="password"
              className="w-full"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Deixe em branco para manter"
            />
            <p className="text-[0.65rem] text-slate-400 mt-1">Se deixado em branco, a senha atual será mantida.</p>
          </div>
          <div>
            <label>Papel (Role)</label>
            <select className="w-full" value={role} onChange={e => setRole(e.target.value)}>
              <option value="ANALISTA">ANALISTA</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>
          <div className="col-span-2">
            <label>MP Vinculado</label>
            <select className="w-full" value={tenantId} onChange={e => setTenantId(e.target.value)}>
              <option value="">— Global (sem MP) —</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.nome} ({t.slug})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={handleSave} disabled={loading} className="btn btn-primary py-1.5 px-4 text-xs">
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={() => { setIsEditing(false); setError(''); setSenha('') }} className="btn btn-ghost py-1.5 px-4 text-xs">
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {!isProtected && (
          <>
            <button onClick={() => setIsEditing(true)} className="text-xs text-slate-500 hover:text-slate-800 font-medium">
              Editar
            </button>
            <span className="text-slate-300">|</span>
            <button onClick={() => setShowDeleteModal(true)} className="text-xs text-rose-500 hover:text-rose-700 font-medium">
              Excluir
            </button>
          </>
        )}
        {isProtected && <span className="text-xs text-slate-400 italic">Protegido</span>}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
          <div className="card max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-2 flex items-center gap-2">
              Excluir Usuário
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Tem certeza que deseja excluir o usuário <b className="text-slate-800">{user.nome}</b> (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">{user.username}</code>)?
              Esta ação é irreversível.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-ghost">
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="btn btn-danger"
              >
                {loading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
