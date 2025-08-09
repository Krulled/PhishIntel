import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getScan, type ScanResult } from '../services/apiClient'
import ValuesView from '../components/ValuesView'

const UI_AUTH_ENABLED = (import.meta.env.VITE_UI_AUTH_ENABLED || 'false').toString().toLowerCase() === 'true'

export default function Scan() {
  const { id } = useParams()
  const [data, setData] = useState<ScanResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) return
      const res = await getScan(id)
      if (!cancelled) {
        setData(res)
        setNotFound(!res)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  function logout() {
    if (!UI_AUTH_ENABLED) return
    try { localStorage.removeItem('phishintel_token') } catch {}
    navigate('/login', { replace: true })
  }

  if (notFound) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-16 text-center text-white">
        <h1 className="mb-4 text-2xl font-semibold">Scan not found</h1>
        <p className="mb-6 text-gray-400">We couldn't load that scan.</p>
        <Link className="rounded bg-indigo-500 px-4 py-2" to="/">Back to home</Link>
      </main>
    )
  }

  if (!data) {
    return <main className="container mx-auto max-w-3xl px-4 py-16 text-center text-white"><div className="h-56 animate-pulse rounded-xl border border-white/10 bg-white/5" /></main>
  }

  const hasToken = UI_AUTH_ENABLED && typeof window !== 'undefined' && !!localStorage.getItem('phishintel_token')

  return (
    <main className="min-h-screen bg-[#0b0e16] text-white">
      <section className="container mx-auto max-w-3xl px-4 py-10">
        <div className="mb-4 flex items-center justify-end">
          {hasToken && (
            <button onClick={logout} className="rounded border border-white/10 bg-white/10 px-3 py-1 text-xs text-gray-200 hover:bg-white/15">Logout</button>
          )}
        </div>
        <ValuesView raw={data} />
      </section>
    </main>
  )
}