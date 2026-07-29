'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'

export default function VersoesPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = use(params)
  const router = useRouter()
  const [versoes, setVersoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const fetchVersoes = () => {
    setLoading(true)
    fetch(`/api/versions?tenantId=${tenantSlug}`)
      .then((r) => r.json())
      .then((data) => {
        // Filter out BASE versions from the history
        setVersoes(data.filter((v: any) => v.status !== 'BASE'))
        setLoading(false)
      })
      .catch(console.error)
  }

  useEffect(() => {
    fetchVersoes()
  }, [])

  const handleStartNewVersion = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const versao = (form.elements.namedItem('versao') as HTMLInputElement).value
    
    if (!versao) return

    setCreating(true)
    try {
      const res = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versao, tenantId: tenantSlug })
      })
      const data = await res.json()
      
      if (res.status === 409 && data.confirm_conclude) {
        setCreating(false)
        if (confirm('Existe uma homologação em andamento. Deseja conclui-la e iniciar a nova versão?')) {
          setCreating(true)
          const forceRes = await fetch('/api/versions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ versao, tenantId: tenantSlug, force: true })
          })
          const forceData = await forceRes.json()
          if (forceData.success) {
            form.reset()
            router.push(`/${tenantSlug}/dashboard?versaoId=${forceData.version.id}`)
          } else {
            alert('Erro ao criar versão: ' + (forceData.error || ''))
          }
        }
      } else if (data.success) {
        form.reset()
        router.push(`/${tenantSlug}/dashboard?versaoId=${data.version.id}`)
      } else {
        alert('Erro ao criar versão: ' + (data.error || ''))
      }
    } catch (error) {
      console.error(error)
      alert('Ocorreu um erro.')
    } finally {
      setCreating(false)
    }
  }

  const verVersao = (id: number) => {
    // Navigate to dashboard with this version
    router.push(`/${tenantSlug}/dashboard?versaoId=${id}`)
  }

  const encerrarVersao = async (id: number) => {
    if (confirm('Deseja realmente encerrar esta homologação? O sistema entrará em modo leitura.')) {
      try {
        const res = await fetch(`/api/versions/${id}/concluir?tenantId=${tenantSlug}`, { method: 'POST' })
        const data = await res.json()
        if (data.success) {
          fetchVersoes()
        } else {
          alert(data.error || 'Erro ao encerrar.')
        }
      } catch (e) {
        console.error(e)
        alert('Erro ao encerrar.')
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Create New Version Card */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Iniciar Nova Homologação</h2>
        <p className="text-sm text-slate-500 mb-5">
          Isso criará uma nova versão e copiará todos os itens da versão atual. Todos os status e analistas serão zerados para começar uma nova rodada de testes limpa.
        </p>
        <form onSubmit={handleStartNewVersion} className="flex gap-3">
          <input 
            type="text" 
            name="versao" 
            placeholder="Ex: 5.0.69-1" 
            required
            className="border border-slate-300 rounded-lg px-4 py-2 flex-1 max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit" 
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {creating ? 'Processando...' : 'Iniciar Versão'}
          </button>
        </form>
      </div>

      {/* History List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Histórico de Versões</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando versões...</div>
        ) : versoes.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhuma versão encontrada.</div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="p-4 font-semibold text-slate-600">Versão</th>
                <th className="p-4 font-semibold text-slate-600">Status</th>
                <th className="p-4 font-semibold text-slate-600">Data Criação</th>
                <th className="p-4 font-semibold text-slate-600">Data Conclusão</th>
                <th className="p-4 text-right font-semibold text-slate-600">Ação</th>
              </tr>
            </thead>
            <tbody>
              {versoes.map((v, i) => (
                <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-800">
                    {v.versao} 
                    {i === 0 && <span className="ml-2 bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">Atual</span>}
                  </td>
                  <td className="p-4">
                    {v.status === 'CONCLUIDO' ? (
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div> Concluída
                      </span>
                    ) : (
                      <span className="text-blue-600 font-medium flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> Em Andamento
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-600">{new Date(v.importadoEm).toLocaleDateString('pt-BR')}</td>
                  <td className="p-4 text-slate-600">{v.dataFim ? new Date(v.dataFim).toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="p-4 text-right flex items-center justify-end gap-3">
                    {v.status === 'EM_ANDAMENTO' && (
                      <button 
                        onClick={() => encerrarVersao(v.id)}
                        className="text-amber-600 font-semibold hover:text-amber-800 hover:underline"
                      >
                        Encerrar
                      </button>
                    )}
                    <button 
                      onClick={() => verVersao(v.id)}
                      className="text-blue-600 font-semibold hover:text-blue-800 hover:underline"
                    >
                      {v.status === 'EM_ANDAMENTO' ? 'Ver Painel' : 'Visualizar Histórico'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
