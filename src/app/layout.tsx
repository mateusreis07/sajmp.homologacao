import type { Metadata } from 'next'
import { Source_Serif_4, Inter, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  weight: ['400', '600', '700'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-mono',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'Homologação SAJMP',
  description: 'Sistema de homologação de versões do SAJ5',
}

import Providers from '@/components/Providers'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${sourceSerif4.variable} ${inter.variable} ${ibmPlexMono.variable} antialiased font-sans`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
