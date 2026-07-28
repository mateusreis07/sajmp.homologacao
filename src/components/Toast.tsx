'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  onClose: () => void
}

export default function Toast({ message, onClose }: ToastProps) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
      setTimeout(onClose, 200) // allow animation to finish
    }, 2600)

    return () => clearTimeout(timer)
  }, [onClose])

  if (!show) return null

  return (
    <div className="fixed bottom-6 right-6 bg-slate-800 text-white py-3 px-5 rounded-xl text-sm font-medium shadow-lg z-[100] animate-in slide-in-from-bottom-5 fade-in duration-200 flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
      {message}
    </div>
  )
}
