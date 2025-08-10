import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { getScan, type ScanResult } from '../services/apiClient'
import ValuesView from '../components/ValuesView'

export default function Scan() {
  const { id } = useParams()
  const location = useLocation()
  const [data, setData] = useState<ScanResult | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    // Check if we have result data passed via navigation state (from Queue)
    const stateResult = location.state?.scanResult
    if (stateResult) {
      setData(stateResult)
      return
    }

    // Otherwise fetch by scan ID
    let cancelled = false
    ;(async () => {
      if (!id) return
      
      // Note: scanId from URL params will be used for screenshot fetching
      
      const res = await getScan(id)
      if (!cancelled) {
        setData(res)
        setNotFound(!res)
      }
    })()
    return () => { cancelled = true }
  }, [id, location.state])

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

  return (
    <main className="min-h-screen bg-[#0b0e16] text-white">
      <section className="container mx-auto max-w-3xl px-4 py-10">
        <ValuesView raw={data} />
      </section>
    </main>
  )
}