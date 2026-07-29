'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import ItemsTable from '@/components/ItemsTable'
import ItemDrawer from '@/components/ItemDrawer'
import { STATUS_META } from '@/lib/constants'

export default function ItensPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = use(params)
  const searchParams = useSearchParams()
  const versaoId = searchParams.get('versaoId')
  const { data: session } = useSession()
  const userName = session?.user?.name || session?.user?.username || 'Usuário Rápido'
  
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [versaoStatus, setVersaoStatus] = useState<string>('')

  const [filters, setFilters] = useState({
    sistema: '',
    modulo: '',
    status: '',
    responsavel: '',
    busca: '',
    somentePendentes: false,
    mostrarArquivados: false
  })

  const [editingId, setEditingId] = useState<number | null>(null)

  const handleQuickStatusUpdate = async (id: number, status: string) => {
    // Optimistic update for snappy UI
    setItems((prev: any) => prev.map((item: any) => item.id === id ? { ...item, status } : item))
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, usuario: userName, tenantId: tenantSlug })
      })
      if (!res.ok) throw new Error('Falha ao atualizar')
    } catch (e) {
      console.error(e)
      fetchItems() // revert on error
    }
  }

  const fetchItems = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', page.toString())
    params.set('pageSize', '50')
    if (filters.sistema) params.set('sistema', filters.sistema)
    if (filters.modulo) params.set('modulo', filters.modulo)
    if (filters.status) params.set('status', filters.status)
    if (filters.responsavel) params.set('responsavel', filters.responsavel)
    if (filters.busca) params.set('busca', filters.busca)
    if (filters.somentePendentes) params.set('somentePendentes', 'true')
    if (filters.mostrarArquivados) params.set('mostrarArquivados', 'true')
    params.set('tenantId', tenantSlug)
    if (versaoId) params.set('versaoId', versaoId)

    fetch(`/api/items?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
        if (data.versao) {
          setVersaoStatus(data.versao.status || '')
        }
        setLoading(false)
      })
      .catch(console.error)
  }, [page, filters, tenantSlug, versaoId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const exportCSV = () => {
    window.open(`/api/export?tenantId=${tenantSlug}`, '_blank')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2.5 mb-3.5 items-center">
        <select
          value={filters.sistema}
          onChange={(e) => handleFilterChange('sistema', e.target.value)}
        >
          <option value="">Todos os Sistemas</option>
          <option value="SAJMP">SAJMP</option>
          <option value="CADASTRO">CADASTRO</option>
          <option value="SAJADM">SAJADM</option>
          <option value="INTEGRAÇÃO">INTEGRAÇÃO</option>
          <option value="DISTRIBUIÇÃO">DISTRIBUIÇÃO</option>
          <option value="SAJWEB">SAJWEB</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">Todos os Status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="FUNCIONA">Funciona</option>
          <option value="FUNCIONA_COM_RESSALVAS">Funciona com Ressalvas</option>
          <option value="ERRO_IMPEDITIVO">Erro Impeditivo</option>
          <option value="ITEM_DESABILITADO">Item Desabilitado</option>
        </select>
        <input
          type="search"
          placeholder="Buscar tela, cenário..."
          value={filters.busca}
          onChange={(e) => handleFilterChange('busca', e.target.value)}
        />
        <label className="flex items-center gap-1 text-[0.8rem] text-ink-soft cursor-pointer ml-2">
          <input
            type="checkbox"
            checked={filters.somentePendentes}
            onChange={(e) => handleFilterChange('somentePendentes', e.target.checked)}
          />
          Somente Pendentes
        </label>
        <label className="flex items-center gap-1 text-[0.8rem] text-ink-soft cursor-pointer ml-2">
          <input
            type="checkbox"
            checked={filters.mostrarArquivados}
            onChange={(e) => handleFilterChange('mostrarArquivados', e.target.checked)}
          />
          Mostrar Arquivados
        </label>
        <div className="flex-1" />
        <button onClick={exportCSV} className="btn">
          Exportar CSV
        </button>
      </div>

      <div className="bg-white border border-line rounded-[10px] overflow-auto shadow-[0_1px_2px_rgba(22,35,61,0.06),0_4px_14px_rgba(22,35,61,0.07)]">
        <ItemsTable 
          items={items} 
          onEdit={(id) => {
            if (versaoStatus !== 'CONCLUIDO') setEditingId(id)
          }} 
          onQuickUpdate={versaoStatus !== 'CONCLUIDO' ? handleQuickStatusUpdate : undefined} 
        />
        {items.length === 0 && !loading && (
          <div className="py-12 px-5 text-center text-ink-soft">
            Nenhum item encontrado com esses filtros.
          </div>
        )}
        <div className="flex gap-2.5 items-center justify-end p-3 text-[0.8rem] text-ink-soft">
          <span>{total} itens encontrados</span>
          <button
            className="btn"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </button>
          <span>
            {page} / {totalPages || 1}
          </span>
          <button
            className="btn"
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
          >
            Próxima
          </button>
        </div>
      </div>

      {editingId && (
        <ItemDrawer
          itemId={editingId}
          tenantSlug={tenantSlug}
          onClose={() => {
            setEditingId(null)
            fetchItems()
          }}
        />
      )}
    </div>
  )
}
