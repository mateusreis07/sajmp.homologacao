'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ReportFormProps {
  tenantSlug: string
  initialData?: any
}

export default function ReportForm({ tenantSlug, initialData }: ReportFormProps) {
  const router = useRouter()
  const isEditing = !!initialData

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    sistema: initialData?.sistema || '',
    versaoAnterior: initialData?.versaoAnterior || '',
    versaoAtual: initialData?.versaoAtual || '',
    dataAtualizacao: initialData?.dataAtualizacao ? new Date(initialData.dataAtualizacao).toISOString().slice(0, 16) : '',
    ambiente: initialData?.ambiente || 'PRODUCAO',
    responsavel: initialData?.responsavel || '',
    statusAtualizacao: initialData?.statusAtualizacao || 'SUCESSO',
    
    atendimentosEncerrados: initialData?.atendimentosEncerrados || '',
    atendimentosAbertos: initialData?.atendimentosAbertos || '',
    usuariosAfetados: initialData?.usuariosAfetados || '',
    defeitosIdentificados: initialData?.defeitosIdentificados || '',
    incidentesCriticos: initialData?.incidentesCriticos || '',
    incidentesMediaBaixa: initialData?.incidentesMediaBaixa || '',
    tempoIndisponibilidade: initialData?.tempoIndisponibilidade || '',
    tempoEstabilizacao: initialData?.tempoEstabilizacao || '',
    
    melhorias: initialData?.melhorias || '',
    problemas: initialData?.problemas || '',
    acoesAndamento: initialData?.acoesAndamento || '',
  })

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      ...formData,
      dataAtualizacao: formData.dataAtualizacao ? new Date(formData.dataAtualizacao).toISOString() : new Date().toISOString(),
    }

    try {
      const url = isEditing ? `/api/reports/${initialData.id}` : `/api/reports`
      const method = isEditing ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? payload : { ...payload, tenantSlug })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar o report')

      router.push(`/${tenantSlug}/reports`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out pb-10">
      
      {error && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>}

      {/* Dados Gerais */}
      <section className="card">
        <h2 className="font-serif font-bold text-lg text-slate-800 mb-5 pb-3 border-b border-slate-100">Dados da Atualização</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Sistema</label>
            <input type="text" name="sistema" required value={formData.sistema} onChange={handleChange} className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Versão Anterior</label>
              <input type="text" name="versaoAnterior" required value={formData.versaoAnterior} onChange={handleChange} className="w-full font-mono" />
            </div>
            <div>
              <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Versão Atual</label>
              <input type="text" name="versaoAtual" required value={formData.versaoAtual} onChange={handleChange} className="w-full font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Data/Hora da Atualização</label>
            <input type="datetime-local" name="dataAtualizacao" required value={formData.dataAtualizacao} onChange={handleChange} className="w-full" />
          </div>
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Ambiente</label>
            <select name="ambiente" value={formData.ambiente} onChange={handleChange} className="w-full">
              <option value="PRODUCAO">Produção</option>
              <option value="HOMOLOGACAO">Homologação</option>
            </select>
          </div>
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Responsável pela Atualização</label>
            <input type="text" name="responsavel" required value={formData.responsavel} onChange={handleChange} className="w-full" />
          </div>
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Status da Atualização</label>
            <select name="statusAtualizacao" value={formData.statusAtualizacao} onChange={handleChange} className="w-full">
              <option value="SUCESSO">✅ Sucesso</option>
              <option value="PARCIAL">⚠️ Parcial</option>
              <option value="FALHA">❌ Falha</option>
            </select>
          </div>
        </div>
      </section>

      {/* Indicadores Operacionais */}
      <section className="card">
        <h2 className="font-serif font-bold text-lg text-slate-800 mb-5 pb-3 border-b border-slate-100">Indicadores Operacionais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Atendimentos encerrados na versão anterior</label>
            <input type="text" name="atendimentosEncerrados" value={formData.atendimentosEncerrados} onChange={handleChange} className="w-full" />
          </div>
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Atendimentos abertos após nova versão</label>
            <input type="text" name="atendimentosAbertos" value={formData.atendimentosAbertos} onChange={handleChange} className="w-full" />
          </div>
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Usuários afetados por defeitos</label>
            <input type="text" name="usuariosAfetados" value={formData.usuariosAfetados} onChange={handleChange} className="w-full" />
          </div>
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Quantidade de defeitos identificados</label>
            <input type="text" name="defeitosIdentificados" value={formData.defeitosIdentificados} onChange={handleChange} className="w-full" />
          </div>
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Incidentes críticos</label>
            <input type="text" name="incidentesCriticos" value={formData.incidentesCriticos} onChange={handleChange} className="w-full" />
          </div>
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Incidentes de média/baixa criticidade</label>
            <input type="text" name="incidentesMediaBaixa" value={formData.incidentesMediaBaixa} onChange={handleChange} className="w-full" />
          </div>
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tempo total de indisponibilidade</label>
            <input type="text" name="tempoIndisponibilidade" value={formData.tempoIndisponibilidade} onChange={handleChange} className="w-full" placeholder="Ex: 2h 30m, Não houve" />
          </div>
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tempo para estabilização da versão</label>
            <input type="text" name="tempoEstabilizacao" value={formData.tempoEstabilizacao} onChange={handleChange} className="w-full" />
          </div>
        </div>
      </section>

      {/* Observações */}
      <section className="card">
        <h2 className="font-serif font-bold text-lg text-slate-800 mb-5 pb-3 border-b border-slate-100">Observações</h2>
        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Principais melhorias entregues</label>
            <textarea name="melhorias" rows={3} value={formData.melhorias} onChange={handleChange} className="w-full resize-y" />
          </div>
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Principais problemas identificados</label>
            <textarea name="problemas" rows={3} value={formData.problemas} onChange={handleChange} className="w-full resize-y" />
          </div>
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Ações em andamento</label>
            <textarea name="acoesAndamento" rows={3} value={formData.acoesAndamento} onChange={handleChange} className="w-full resize-y" />
          </div>
        </div>
      </section>

      <div className="flex gap-4 items-center mt-4">
        <button type="submit" disabled={loading} className="btn btn-primary px-8">
          {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Report')}
        </button>
        <button type="button" onClick={() => router.back()} className="btn btn-ghost px-6">
          Cancelar
        </button>
      </div>

    </form>
  )
}
