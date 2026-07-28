'use client'

import { useEffect, useState } from 'react'
import { STATUS_ORDER, STATUS_META } from '@/lib/constants'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Toast from './Toast'
import Link from 'next/link'

interface ItemDrawerProps {
  itemId: number
  tenantSlug: string
  onClose: () => void
}

export default function ItemDrawer({ itemId, tenantSlug, onClose }: ItemDrawerProps) {
  const { data: session } = useSession()
  const userName = session?.user?.name || session?.user?.username || ''
  const searchParams = useSearchParams()
  const [item, setItem] = useState<any>(null)
  const isReadOnly = item?.roteiroVersao?.status !== 'EM_ANDAMENTO'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const [formData, setFormData] = useState({
    responsavel: '',
    status: '',
    chamado: '',
    statusChamado: '',
    observacao: '',
    subsidio: ''
  })

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    fetch(`/api/items/${itemId}?tenantId=${tenantSlug}`)
      .then((r) => r.json())
      .then((data) => {
        setItem(data)
        setFormData({
          responsavel: data.responsavel || userName.toUpperCase(),
          status: data.status || '',
          chamado: data.chamado || '',
          statusChamado: data.statusChamado || '',
          observacao: data.observacao || '',
          subsidio: data.subsidio || ''
        })
        setLoading(false)
      })
      .catch(console.error)
  }, [itemId, userName])

  const handleSave = async () => {
    if (!userName) {
      setToastMsg('Você precisa se identificar antes de salvar.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/items/${itemId}?tenantId=${tenantSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, usuario: userName, tenantId: tenantSlug })
      })

      if (!res.ok) {
        throw new Error('Falha ao salvar')
      }

      setToastMsg('Item salvo com sucesso!')
      
      // Refresh item to show new history
      const data = await fetch(`/api/items/${itemId}?tenantId=${tenantSlug}`).then(r => r.json())
      setItem(data)
    } catch (e) {
      console.error(e)
      setToastMsg('Erro ao salvar item.')
    } finally {
      setSaving(false)
    }
  }

  // Loading state — centered spinner
  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-slate-500 text-sm font-medium">Carregando item…</span>
        </div>
      </div>
    )
  }

  // Se for versão BASE, exibe modal de aviso em vez dos detalhes
  if (item?.roteiroVersao?.status === 'BASE') {
    return (
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Homologação não iniciada</h2>
          <p className="text-slate-500 mb-6">
            Nenhuma versão está em andamento. Para começar a testar e alterar os status dos itens, você precisa iniciar uma versão.
          </p>
          <div className="flex gap-3 w-full">
            <button 
              onClick={onClose} 
              className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <Link 
              href={`/${tenantSlug}/versoes`}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-center"
            >
              Iniciar Versão
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {/* Modal panel */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">

          {/* ── Header ─────────────────────────────────────── */}
          <div className="shrink-0 border-b border-slate-200 px-6 py-5">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold m-0 text-slate-800">
                Item <span className="text-blue-600">#{item?.numeroRoteiro}</span>
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="text-sm font-medium text-slate-500 flex items-center gap-2 flex-wrap">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 font-semibold">{item?.sistema}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500">{item?.modulo}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-800 font-semibold">{item?.tela}</span>
            </div>
          </div>

          {/* ── Scrollable body ─────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Arquivado warning */}
            {item?.arquivado && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 py-3 px-4 rounded-lg text-sm">
                ⚠️ Este item foi arquivado pois não está mais presente na versão mais recente do roteiro.
              </div>
            )}

            {/* Cenário / Requisitos */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-3">
              <div>
                <span className="block text-[0.65rem] uppercase tracking-wider text-slate-400 font-bold mb-1">Cenário</span>
                <span className="text-slate-700 font-medium">{item?.cenario}</span>
              </div>
              {item?.requisitos && (
                <div>
                  <span className="block text-[0.65rem] uppercase tracking-wider text-slate-400 font-bold mb-1">Requisitos</span>
                  <span className="text-slate-700 font-medium">{item?.requisitos}</span>
                </div>
              )}
            </div>

            {/* Status + Responsável */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.68rem] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Status</label>
                <select
                  disabled={isReadOnly}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full"
                >
                  {STATUS_ORDER.map(st => (
                    <option key={st} value={st}>{STATUS_META[st].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[0.68rem] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Responsável</label>
                <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-[0.95rem] font-bold text-slate-600 uppercase select-none cursor-not-allowed min-h-[42px] flex items-center">
                  {formData.responsavel || '—'}
                </div>
              </div>
            </div>

            {/* Chamado + Status Chamado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.68rem] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Chamado</label>
                <input
                  disabled={isReadOnly}
                  type="text"
                  value={formData.chamado}
                  onChange={(e) => setFormData({ ...formData, chamado: e.target.value })}
                  className="w-full"
                  placeholder="Ex: JIRA-1234"
                />
              </div>
              <div>
                <label className="block text-[0.68rem] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Status do Chamado</label>
                <input
                  disabled={isReadOnly}
                  type="text"
                  value={formData.statusChamado}
                  onChange={(e) => setFormData({ ...formData, statusChamado: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Observação */}
            <div>
              <label className="block text-[0.68rem] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Observação</label>
              <textarea
                disabled={isReadOnly}
                value={formData.observacao}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                className="w-full min-h-[60px] resize-y"
              />
            </div>

            {/* Subsídio */}
            <div>
              <label className="block text-[0.68rem] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Subsídio</label>
              <textarea
                disabled={isReadOnly}
                value={formData.subsidio}
                onChange={(e) => setFormData({ ...formData, subsidio: e.target.value })}
                className="w-full min-h-[60px] resize-y"
              />
            </div>

            {/* Histórico */}
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-[0.85rem] font-bold text-slate-700 mb-3 uppercase tracking-wider">Histórico de Alterações</h3>
              {item?.history?.length > 0 ? (
                <ul className="list-none m-0 p-0 space-y-0">
                  {item.history.map((h: any) => {
                    const date = new Date(h.timestamp)
                    const fDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
                    
                    return (
                      <li key={h.id} className="text-xs text-slate-500 py-2.5 border-b border-dashed border-slate-100 last:border-none">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{fDate}</span>
                          <span className="font-semibold text-slate-700">{h.usuario}</span>
                        </div>
                        <div className="text-slate-600">{h.descricao}</div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="text-[0.78rem] text-slate-400 italic">
                  Nenhum histórico registrado.
                </div>
              )}
            </div>
          </div>

          {/* ── Footer actions ──────────────────────────────── */}
          <div className="shrink-0 border-t border-slate-200 px-6 py-4 bg-slate-50 flex gap-3">
            {!isReadOnly && (
              <button
                onClick={handleSave}
                disabled={saving || !userName}
                className="btn btn-primary flex-1"
              >
                {saving ? 'Salvando…' : 'Salvar Alterações'}
              </button>
            )}
            <button onClick={onClose} className="btn btn-ghost px-6">
              {isReadOnly ? 'Fechar' : 'Cancelar'}
            </button>
          </div>

        </div>
      </div>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}
    </>
  )
}
