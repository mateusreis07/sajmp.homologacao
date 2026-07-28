'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateTenantForm() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, slug })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao criar')
      } else {
        setNome('')
        setSlug('')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mb-8">
      <h3 className="font-serif font-bold text-lg mb-4 text-slate-800">Novo Ministério Público</h3>
      {error && <div className="mb-4 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">{error}</div>}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-[0.7rem] uppercase tracking-wider text-slate-500 mb-1 font-bold">Nome do MP (ex: Ministério Público de SP)</label>
          <input 
            type="text" 
            value={nome} 
            onChange={e => setNome(e.target.value)}
            className="w-full"
            required
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-[0.7rem] uppercase tracking-wider text-slate-500 mb-1 font-bold">Slug / URL (ex: mpsp)</label>
          <input 
            type="text" 
            value={slug} 
            onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            className="w-full font-mono"
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="btn btn-primary px-5 h-[38px] w-full sm:w-auto"
        >
          {loading ? 'Criando...' : 'Criar e Popular Itens'}
        </button>
      </div>
    </form>
  )
}
