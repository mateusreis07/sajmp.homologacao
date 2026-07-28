'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await signIn('credentials', {
        redirect: false,
        username,
        password,
      })

      if (res?.error) {
        setError('Usuário ou senha incorretos')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      setError('Ocorreu um erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#F0F2FA' }}>
      {/* Background decorative blobs */}
      <div className="absolute top-0 left-0 w-full h-1/2 pointer-events-none" style={{ background: 'linear-gradient(160deg, #4F52E8 0%, #3B3FD4 40%, #F0F2FA 100%)' }} />
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20 pointer-events-none" style={{ background: '#fff' }} />
      <div className="absolute top-10 left-10 w-40 h-40 rounded-full opacity-10 pointer-events-none" style={{ background: '#fff' }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Blue header stripe */}
        <div
          className="rounded-t-2xl px-8 pt-8 pb-6 text-center"
          style={{ background: 'linear-gradient(135deg, #4F52E8 0%, #3B3FD4 60%, #2D31C2 100%)' }}
        >
          <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight m-0" style={{ letterSpacing: '-0.02em' }}>
            Homologação SAJMP
          </h1>
          <p className="text-blue-100 text-sm mt-1.5">Faça login para continuar</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-b-2xl px-8 py-7 shadow-2xl">

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm p-3 rounded-lg mb-5 font-medium text-center animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="block text-[0.7rem] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                Usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-[0.95rem] py-2.5"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-[0.7rem] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-[0.95rem] py-2.5"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: loading ? '#9295F0' : 'linear-gradient(135deg, #4F52E8, #3B3FD4)', boxShadow: '0 4px 14px rgba(79,82,232,0.4)' }}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Sistema de Homologação de Versões · SAJMP
          </p>
        </div>
      </div>
    </div>
  )
}
