'use client'

import { useState } from 'react'
import Toast from '@/components/Toast'

interface ImportViewProps {
  tenantSlug: string
  userName: string
}

export default function ImportView({ tenantSlug, userName }: ImportViewProps) {
  const [text, setText] = useState('')
  const [versionLabel, setVersionLabel] = useState('')
  const [diff, setDiff] = useState<any>(null)
  const [parsedItems, setParsedItems] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [importarStatuses, setImportarStatuses] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Version modal state
  const [versionModal, setVersionModal] = useState<null | 'BASE' | 'EM_ANDAMENTO'>(null)
  const [currentVersion, setCurrentVersion] = useState<any>(null)
  const [newVersionInput, setNewVersionInput] = useState('')
  const [pendingImportData, setPendingImportData] = useState<any>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // Exibe no textarea (só visual)
    try {
      const utfContent = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      setText(utfContent)
    } catch {
      const latin = new TextDecoder('windows-1252').decode(bytes)
      setText(latin)
    }

    // Envia o arquivo binário diretamente para a API (encoding correto no server)
    await handleAnalyzeFile(file)
    e.target.value = ''
  }

  // Analisa arquivo binário (enviado como FormData — encoding correto no server)
  const handleAnalyzeFile = async (file: File) => {
    setError(null)
    setDebugInfo(null)
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/import/preview?tenantId=${tenantSlug}`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setDebugInfo(data._debug || data.debug || null)
        throw new Error(data.error || 'Erro ao analisar CSV')
      }
      setDiff(data.diff)
      setParsedItems(data.parsedItems)
      setDebugInfo(data._debug || null)
    } catch (err: any) {
      setError(err.message)
      setDiff(null)
    } finally {
      setLoading(false)
    }
  }

  // Analisa texto colado manualmente
  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Cole o conteúdo do CSV ou selecione um arquivo antes de analisar.')
      return
    }
    setError(null)
    setDebugInfo(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/import/preview?tenantId=${tenantSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: text })
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setDebugInfo(data._debug || data.debug || null)
        throw new Error(data.error || 'Erro ao analisar CSV')
      }
      setDiff(data.diff)
      setParsedItems(data.parsedItems)
      setDebugInfo(data._debug || null)
    } catch (err: any) {
      setError(err.message)
      setDiff(null)
    } finally {
      setLoading(false)
    }
  }

  const doImport = async (versaoLabel: string) => {
    setConfirming(true)
    try {
      const res = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsedItems,
          versionLabel: versaoLabel,
          usuario: userName,
          importarStatuses,
          tenantId: tenantSlug,
        })
      })

      if (!res.ok) throw new Error('Falha ao confirmar importação')

      setToastMsg('Importação concluída!')
      setDiff(null)
      setText('')
      setParsedItems([])
      setDebugInfo(null)
      setVersionModal(null)
    } catch (err) {
      console.error(err)
      setToastMsg('Erro ao importar.')
    } finally {
      setConfirming(false)
    }
  }

  const handleConfirm = async () => {
    if (!userName) {
      setToastMsg('Você precisa estar logado antes de importar.')
      return
    }

    // Check current version status before importing
    setConfirming(true)
    try {
      const res = await fetch(`/api/versions?tenantId=${tenantSlug}`)
      const versions: any[] = await res.json()
      const latest = versions[0] || null

      setConfirming(false)

      if (!latest || latest.status === 'BASE') {
        // No active version — ask user to provide a version number
        setCurrentVersion(latest)
        setVersionModal('BASE')
      } else if (latest.status === 'EM_ANDAMENTO') {
        // Active version — ask if user wants to conclude it and start a new one
        setCurrentVersion(latest)
        setVersionModal('EM_ANDAMENTO')
      } else {
        // CONCLUIDO — ask for new version number to start
        setCurrentVersion(latest)
        setVersionModal('BASE')
      }
    } catch (err) {
      console.error(err)
      setConfirming(false)
      setToastMsg('Erro ao verificar versão atual.')
    }
  }

  const handleModalConfirm = async (action: 'USE_CURRENT' | 'NEW_VERSION') => {
    if (action === 'USE_CURRENT' && currentVersion) {
      // Use the existing EM_ANDAMENTO version as-is
      await doImport(currentVersion.versao)
    } else {
      // Need a new version label
      const label = newVersionInput.trim()
      if (!label) {
        setToastMsg('Informe o número da nova versão.')
        return
      }
      // If there's an EM_ANDAMENTO version, conclude it first via API
      if (currentVersion?.status === 'EM_ANDAMENTO') {
        await fetch(`/api/versions/${currentVersion.id}/concluir?tenantId=${tenantSlug}`, { method: 'POST' })
      }
      // Create new version then import
      const verRes = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versao: label, tenantId: tenantSlug, force: true })
      })
      if (!verRes.ok) {
        setConfirming(false)
        setToastMsg('Erro ao criar a nova versão.')
        return
      }
      await doImport(label)
    }
  }

  const statusMeta: Record<string, { label: string; color: string }> = {
    FUNCIONA: { label: 'Funciona', color: 'var(--forest)' },
    FUNCIONA_COM_RESSALVAS: { label: 'Com Ressalvas', color: 'var(--amber)' },
    ERRO_IMPEDITIVO: { label: 'Erro Impeditivo', color: 'var(--brick)' },
    ITEM_DESABILITADO: { label: 'Desabilitado', color: 'var(--stone-dark)' },
    PENDENTE: { label: 'Pendente / Vazio', color: 'var(--stone)' },
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* Painel esquerdo: seleção do arquivo */}
        <div className="card text-center border-2 border-dashed border-slate-300 bg-slate-50 shadow-none hover:bg-slate-100/50 transition-colors">
          <label className="btn btn-primary cursor-pointer mb-4 inline-flex items-center gap-2 px-6">
            Selecionar Arquivo CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />
          </label>
          <p className="text-[0.82rem] text-slate-500 my-1.5 mb-4">
            ou cole os dados diretamente abaixo:
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full min-h-[160px] p-3 border border-slate-300 rounded-lg font-mono text-[0.72rem] bg-white resize-y"
            placeholder="Cole o CSV aqui..."
          />

          {error && (
            <div className="text-rose-700 text-[0.82rem] mt-4 font-medium text-left bg-rose-50 p-4 rounded-lg border border-rose-100">
              <b>Erro:</b> {error}
              {debugInfo && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-[0.75rem] underline font-semibold">Ver diagnóstico</summary>
                  <pre className="mt-2 text-[0.65rem] overflow-x-auto whitespace-pre-wrap bg-rose-100/50 p-2 rounded">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="btn btn-primary mt-4 w-full max-w-[200px]"
          >
            {loading ? 'Analisando...' : 'Analisar arquivo'}
          </button>

          {/* Debug info (visível temporariamente) */}
          {debugInfo && !error && (
            <details className="mt-3 text-left">
              <summary className="cursor-pointer text-[0.72rem] text-ink-soft underline">
                Diagnóstico: {debugInfo.totalParsed} itens lidos, {debugInfo.totalInDb} no banco
              </summary>
              <pre className="mt-1 text-[0.62rem] text-ink-soft overflow-x-auto whitespace-pre-wrap bg-paper rounded p-2">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {/* Painel direito: resumo da importação */}
        {diff && (
          <div className="card">
            <h3 className="text-[1.1rem] font-serif font-bold m-0 mb-1 text-slate-800">Resumo da Importação</h3>
            <p className="text-[0.78rem] text-slate-500 mb-5">{parsedItems.length} itens lidos do arquivo</p>

            {/* Diferenças estruturais */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                <div className="text-[1.35rem] font-bold text-emerald-600">{diff.novos.length}</div>
                <div className="text-[0.66rem] uppercase tracking-wider font-semibold text-slate-500 mt-0.5">Novos itens</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                <div className="text-[1.35rem] font-bold text-rose-600">{diff.removidos.length}</div>
                <div className="text-[0.66rem] uppercase tracking-wider font-semibold text-slate-500 mt-0.5">Removidos</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                <div className="text-[1.35rem] font-bold text-amber-600">{diff.alterados.length}</div>
                <div className="text-[0.66rem] uppercase tracking-wider font-semibold text-slate-500 mt-0.5">Descrição Alterada</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                <div className="text-[1.35rem] font-bold text-slate-400">{diff.preservados}</div>
                <div className="text-[0.66rem] uppercase tracking-wider font-semibold text-slate-500 mt-0.5">Sem Mudanças</div>
              </div>
            </div>

            {/* Breakdown de status no CSV */}
            {diff.statusNoCSV && (
              <div className="mb-4">
                <h4 className="text-[0.75rem] uppercase tracking-[0.04em] text-ink-soft mb-2">
                  Status no arquivo CSV
                </h4>
                <div className="flex flex-col gap-1">
                  {Object.entries(diff.statusNoCSV as Record<string, number>)
                    .filter(([, count]) => count > 0)
                    .map(([st, count]) => {
                      const meta = statusMeta[st] || { label: st, color: 'var(--stone)' }
                      return (
                        <div key={st} className="flex items-center justify-between text-[0.8rem] py-1 border-b border-line last:border-none">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: meta.color }}
                            />
                            {meta.label}
                          </span>
                          <span className="font-mono font-medium">{count}</span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Opção de importar statuses */}
            <label className="flex items-start gap-3 text-[0.82rem] cursor-pointer mb-5 p-4 rounded-xl border border-amber-200 bg-amber-50 shadow-sm transition-colors hover:bg-amber-100/50">
              <input
                type="checkbox"
                checked={importarStatuses}
                onChange={(e) => setImportarStatuses(e.target.checked)}
                className="mt-1 shrink-0 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <span>
                <b className="text-amber-900 block mb-1">Importar statuses do CSV</b>
                <span className="text-amber-700/80 text-[0.75rem] leading-relaxed block">
                  Atualiza o status de cada item com o valor do CSV (sobrescreve o que está no banco).
                  Use ao restaurar dados de uma planilha anterior.
                </span>
              </span>
            </label>

            {/* Rótulo e confirmar */}
            <div className="flex flex-col border-t border-slate-100 pt-5">

              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="btn btn-primary w-full py-2.5"
              >
                {confirming ? 'Confirmando...' : 'Confirmar Importação'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Version Check Modal */}
      {versionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col gap-5">
            {versionModal === 'EM_ANDAMENTO' ? (
              <>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-1">Versão em andamento detectada</h2>
                    <p className="text-sm text-slate-500">
                      Existe uma homologação <b className="text-blue-600">{currentVersion?.versao}</b> em andamento.
                      O que deseja fazer?
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleModalConfirm('USE_CURRENT')}
                    disabled={confirming}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Importar na versão atual ({currentVersion?.versao})
                  </button>

                  <div className="border-t border-slate-200 my-1" />

                  <p className="text-xs text-slate-500 font-medium">Ou encerrar a atual e iniciar nova versão:</p>
                  <input
                    type="text"
                    value={newVersionInput}
                    onChange={(e) => setNewVersionInput(e.target.value)}
                    placeholder="Ex: 5.0.69-1"
                    className="border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleModalConfirm('NEW_VERSION')}
                    disabled={confirming || !newVersionInput.trim()}
                    className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {confirming ? 'Processando...' : 'Encerrar atual e importar em nova versão'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-1">Nenhuma versão ativa</h2>
                    <p className="text-sm text-slate-500">
                      Informe o número da versão que será homologada para iniciar e importar os dados.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Número da Versão</label>
                  <input
                    type="text"
                    value={newVersionInput}
                    onChange={(e) => setNewVersionInput(e.target.value)}
                    placeholder="Ex: 5.0.68-7"
                    className="border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleModalConfirm('NEW_VERSION')}
                    disabled={confirming || !newVersionInput.trim()}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {confirming ? 'Processando...' : 'Iniciar versão e importar'}
                  </button>
                </div>
              </>
            )}

            <button
              onClick={() => { setVersionModal(null); setNewVersionInput('') }}
              disabled={confirming}
              className="text-sm text-slate-400 hover:text-slate-600 text-center transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}
    </div>
  )
}
