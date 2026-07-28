'use client'

import { useEffect, useState, Suspense } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface TopBarProps {
  tenant: { slug: string; nome: string }
  user: { name?: string | null; role?: string | null }
}

function TopBarContent({ tenant, user }: TopBarProps) {
  const [itemsCount, setItemsCount] = useState(0)
  const [versionLabel, setVersionLabel] = useState('')
  const [versionStatus, setVersionStatus] = useState('')
  const searchParams = useSearchParams()
  const versaoId = searchParams.get('versaoId')

  useEffect(() => {
    let url = `/api/stats?tenantId=${tenant.slug}&t=${Date.now()}`
    if (versaoId) url += `&versaoId=${versaoId}`
    fetch(url)
      .then((r) => r.json())
      .then((data) => setItemsCount(data.total || 0))
      .catch(console.error)
      
    // Fetch version label to display
    fetch(`/api/versions?tenantId=${tenant.slug}&t=${Date.now()}`)
      .then((r) => r.json())
      .then((versions) => {
        if (versaoId) {
          const v = versions.find((v: any) => v.id.toString() === versaoId)
          if (v) {
            setVersionLabel(v.versao)
            setVersionStatus(v.status)
          }
        } else if (versions.length > 0) {
          setVersionLabel(versions[0].versao)
          setVersionStatus(versions[0].status)
        }
      })
      .catch(console.error)
  }, [tenant.slug, versaoId])

  return (
    <div className="relative overflow-hidden rounded-2xl mb-2 shadow-lg" style={{ background: 'linear-gradient(135deg, #4F52E8 0%, #3B3FD4 60%, #2D31C2 100%)' }}>
      {/* Decorative blobs */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10 pointer-events-none" style={{ background: '#fff' }} />
      <div className="absolute -bottom-6 right-32 w-24 h-24 rounded-full opacity-10 pointer-events-none" style={{ background: '#fff' }} />

      {/* Main content */}
      <div className="relative z-10 px-6 lg:px-8 pt-5 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

        {/* Left: title + subtitle */}
        <div className="flex flex-col items-start gap-1">
          <h1 className="font-sans font-extrabold text-3xl tracking-tight m-0 text-white drop-shadow-sm" style={{ letterSpacing: '-0.02em' }}>
            Roteiro de Homologação {versionLabel && versionStatus !== 'BASE' && <span className="text-blue-200 ml-2">v{versionLabel}</span>}
          </h1>
          <div className="text-sm text-blue-100 font-medium tracking-wide flex items-center gap-2">
            Base de homologação <span className="text-blue-300">•</span>
            {versionStatus === 'CONCLUIDO' && <span className="bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded font-bold backdrop-blur-sm border border-amber-500/30">Somente Leitura</span>}
            {versionStatus === 'BASE' && <span className="bg-slate-500/30 text-slate-200 px-2 py-0.5 rounded font-bold backdrop-blur-sm border border-slate-500/40">Aguardando Início</span>}
            <span className="bg-white/20 text-white px-2 py-0.5 rounded font-bold backdrop-blur-sm">{itemsCount}</span> itens
          </div>
        </div>

        {/* Right: client badge */}
        <div className="flex flex-col items-start md:items-end gap-1 font-mono shrink-0 max-w-full">
          <span className="text-[0.65rem] uppercase tracking-wider text-blue-200 font-bold ml-1">Cliente</span>
          <div className="bg-white/15 border border-white/25 text-white rounded-full py-1.5 px-4 text-sm font-semibold backdrop-blur-sm flex items-center gap-2 max-w-full">
            <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pulse shrink-0"></div>
            <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg" title={tenant.nome}>{tenant.nome}</span>
          </div>
        </div>
      </div>

      {/* Bottom bar: analista + sair + admin */}
      <div className="relative z-10 px-6 lg:px-8 pb-3 flex items-center justify-between gap-4 border-t border-white/10 pt-2.5">
        <div className="flex items-center gap-3 text-xs text-blue-100">
          <span>Analista: <b className="text-white font-semibold">{user.name || '-'}</b></span>
          {user.role === 'SUPER_ADMIN' && (
            <>
              <span className="text-blue-300">•</span>
              <Link href="/admin" className="text-amber-300 hover:text-amber-200 underline decoration-amber-400/50 hover:decoration-amber-300 transition-colors font-medium">
                Painel Admin
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Encerrar Versão */}
          {versionStatus === 'EM_ANDAMENTO' && versaoId && (
            <button
              onClick={() => {
                if (confirm('Deseja realmente encerrar esta homologação? O sistema entrará em modo leitura.')) {
                  fetch(`/api/versions/${versaoId}/concluir?tenantId=${tenant.slug}`, { method: 'POST' })
                    .then(r => r.json())
                    .then(data => {
                      if (data.success) {
                        window.location.reload()
                      } else {
                        alert(data.error || 'Erro ao encerrar.')
                      }
                    })
                }
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-100 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer backdrop-blur-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.24a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75z" clipRule="evenodd" />
              </svg>
              Encerrar Homologação
            </button>
          )}
        </div>

        {/* Sair — lado esquerdo do rodapé, com destaque */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/25 hover:border-white/40 px-3 py-1.5 rounded-lg transition-all cursor-pointer backdrop-blur-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 opacity-80">
            <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z" clipRule="evenodd" />
          </svg>
          Sair
        </button>
      </div>
    </div>
  )
}

export default function TopBar(props: TopBarProps) {
  return (
    <Suspense fallback={<div className="h-24 bg-blue-600 rounded-2xl mb-2 animate-pulse"></div>}>
      <TopBarContent {...props} />
    </Suspense>
  )
}
