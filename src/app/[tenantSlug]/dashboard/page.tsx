'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import StatCard from '@/components/StatCard'
import SistemaBreakdown from '@/components/SistemaBreakdown'
import { STATUS_META } from '@/lib/constants'

export default function DashboardPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantSlug) return
    fetch(`/api/stats?tenantId=${tenantSlug}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch(console.error)
  }, [])

  if (loading) {
    return <div className="p-10 text-center text-ink-soft">Carregando painel...</div>
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="py-12 px-5 text-center text-ink-soft">
        <h3 className="text-[1.1rem] text-ink font-serif mb-2">Nenhum item carregado ainda</h3>
        <p>Importe sua planilha de homologação na aba "Importar" para começar a acompanhar o progresso.</p>
      </div>
    )
  }

  const total: number = stats.total

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">

        {/* Restantes */}
        <StatCard
          label="Restantes / Pendentes"
          num={stats.restantes}
          color="var(--stone)"
          stampLabel={null}
          total={total}
        />

        {/* Funciona */}
        <StatCard
          label={STATUS_META.FUNCIONA.label}
          num={stats.byStatus.FUNCIONA || 0}
          color={STATUS_META.FUNCIONA.color}
          stampLabel={null}
          total={total}
        />

        {/* Item Desabilitado */}
        <StatCard
          label={STATUS_META.ITEM_DESABILITADO.label}
          num={stats.byStatus.ITEM_DESABILITADO || 0}
          color={STATUS_META.ITEM_DESABILITADO.color}
          stampLabel={null}
          total={total}
        />

        {/* Funciona c/ Ressalvas */}
        <StatCard
          label={STATUS_META.FUNCIONA_COM_RESSALVAS.label}
          num={stats.byStatus.FUNCIONA_COM_RESSALVAS || 0}
          color={STATUS_META.FUNCIONA_COM_RESSALVAS.color}
          stampLabel={null}
          total={total}
        />

        {/* Erro Impeditivo */}
        <StatCard
          label={STATUS_META.ERRO_IMPEDITIVO.label}
          num={stats.byStatus.ERRO_IMPEDITIVO || 0}
          color={STATUS_META.ERRO_IMPEDITIVO.color}
          stampLabel={null}
          total={total}
        />

        {/* Total homologados (tudo que não é PENDENTE) */}
        <StatCard
          label="Total Homologados"
          num={stats.homologados}
          color="var(--ink)"
          stampLabel={null}
          total={total}
        />
      </div>

      <SistemaBreakdown sistemas={stats.sistemas} />
    </div>
  )
}
