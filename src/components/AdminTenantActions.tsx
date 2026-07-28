'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Tenant {
  id: string
  nome: string
  slug: string
}

export default function AdminTenantActions({ tenant }: { tenant: Tenant }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [nome, setNome] = useState(tenant.nome)
  const [slug, setSlug] = useState(tenant.slug)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, slug })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao atualizar')
      } else {
        setIsEditing(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmText !== tenant.slug) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, { method: 'DELETE' })
      if (res.ok) {
        setShowDeleteModal(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 p-2">
        {error && <div className="text-xs text-red-600">{error}</div>}
        <input
          className="border border-line rounded px-2 py-1 text-sm"
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="Nome"
        />
        <input
          className="border border-line rounded px-2 py-1 text-sm font-mono"
          value={slug}
          onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          placeholder="Slug"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn btn-primary text-xs py-1 px-3"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={() => { setIsEditing(false); setNome(tenant.nome); setSlug(tenant.slug); setError('') }}
            className="btn btn-ghost text-xs py-1 px-3"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <a
          href={`/${tenant.slug}/dashboard`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-forest hover:underline text-xs font-semibold"
        >
          Acessar
        </a>
        <span className="text-slate-300">|</span>
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-slate-500 hover:text-slate-800 font-medium"
        >
          Editar
        </button>
        <span className="text-slate-300">|</span>
        <button
          onClick={() => { setShowDeleteModal(true); setDeleteConfirmText('') }}
          className="text-xs text-rose-500 hover:text-rose-700 font-medium"
        >
          Excluir
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
          <div className="card max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-3 flex items-center gap-2">
              <span className="text-rose-500">⚠️</span> Excluir Ministério Público
            </h3>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700 mb-4 shadow-sm">
              <b>Atenção:</b> Esta ação é irreversível. Ao excluir <b>{tenant.nome}</b>, todos os usuários vinculados e todos os <b>itens de homologação</b> deste MP serão permanentemente apagados do banco de dados.
            </div>
            <p className="text-sm text-slate-600 mb-2">
              Para confirmar, digite o slug <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">{tenant.slug}</code> abaixo:
            </p>
            <input
              className="w-full mb-5 font-mono"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder={tenant.slug}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmText !== tenant.slug || loading}
                className="btn btn-danger"
              >
                {loading ? 'Excluindo...' : 'Excluir Permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
