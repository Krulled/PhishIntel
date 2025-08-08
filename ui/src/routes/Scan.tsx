import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { SafeAnalysisResult } from '../services/analyzer'
import EvidenceTabs from '../components/EvidenceTabs'
import DetailedResults from '../components/DetailedResults'
import { getResult } from '../services/storage'

function RiskBadge({ level }: { level: 'Low' | 'Medium' | 'High' | 'Critical' }) {
  const cls = level === 'Low' ? 'bg-emerald-500/20 text-emerald-300' : level === 'Medium' ? 'bg-amber-500/20 text-amber-300' : level === 'High' ? 'bg-red-500/20 text-red-300' : 'bg-red-600/30 text-red-200'
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{level}</span>
}

function RiskMeter({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score))
  return (
    <div className="w-full" aria-label="Risk meter" role="img" aria-roledescription="gauge" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
        <span>Risk score</span>
        <span>{pct}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function Scan() {
  const { id } = useParams()
  const [data, setData] = useState<SafeAnalysisResult | null>(null)
  const [notFound, setNotFound] = useState(false)

  const hashPayload = useMemo(() => {
    if (location.hash.startsWith('#h=')) {
      try {
        const decoded = atob(decodeURIComponent(location.hash.slice(3)))
        return JSON.parse(decoded) as SafeAnalysisResult
      } catch {}
    }
    return null
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (hashPayload && !cancelled) {
        setData(hashPayload)
        return
      }
      if (id) {
        const res = await getResult(id)
        if (res && !cancelled) setData(res)
        if (!res && !cancelled) setNotFound(true)
      }
    })()
    return () => { cancelled = true }
  }, [id, hashPayload])

  if (notFound) {
    return (
      <main className="container py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">Scan not found</h1>
        <p className="text-gray-400 mb-6">We could not load that scan.</p>
        <Link className="btn btn-primary" to="/">Back to home</Link>
      </main>
    )
  }

  if (!data) {
    return <main className="container py-16 text-center"><div className="h-56 animate-pulse rounded-xl bg-muted" /></main>
  }

  const baseUrl = `${location.origin}/scan/${id}`
  const shareHash = `#h=${encodeURIComponent(btoa(JSON.stringify(data)))}`
  const shareUrl = shareHash.length < 1800 ? `${location.origin}/scan/${id || ''}${shareHash}` : baseUrl

  return (
    <main className="container space-y-6 py-8">
      <section aria-label="Analysis results">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-4 space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Risk Summary</h2>
              <RiskBadge level={data.riskLevel} />
            </div>
            <RiskMeter score={data.riskScore} />
            <p className="text-sm text-gray-300">Analyzed {data.url} at {new Date(data.submittedAt).toLocaleString()}</p>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(shareUrl)} aria-label="Copy link">Copy link</button>
              <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))} aria-label="Copy report">Copy report</button>
            </div>
          </div>
        </div>
      </section>

      <EvidenceTabs data={data} />
      <DetailedResults data={data} />

      <div className="card p-4">
        <h3 className="text-sm font-medium">Disclosure</h3>
        <p className="text-sm text-gray-300">PhishIntel offers guidance and is not a substitute for enterprise policy.</p>
      </div>
    </main>
  )
}