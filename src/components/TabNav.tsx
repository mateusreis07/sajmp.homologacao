'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

export default function TabNav({ tenantSlug }: { tenantSlug: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const versaoId = searchParams.get('versaoId')
  const querySuffix = versaoId ? `?versaoId=${versaoId}` : ''

  const tabs = [
    { href: `/${tenantSlug}/dashboard`, label: 'Painel' },
    { href: `/${tenantSlug}/itens`, label: 'Itens' },
    { href: `/${tenantSlug}/reports`, label: 'Reports' },
    { href: `/${tenantSlug}/importar`, label: 'Importar' },
    { href: `/${tenantSlug}/versoes`, label: 'Versões' },
  ]

  return (
    <div className="flex p-1 gap-1 mt-6 mb-8 bg-slate-200/50 rounded-xl w-fit border border-slate-200/60 shadow-inner">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={`${tab.href}${querySuffix}`}
            className={`px-5 py-2 font-semibold text-[0.875rem] rounded-lg transition-all duration-200 ease-out ${
              active
                ? 'bg-white text-forest shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
