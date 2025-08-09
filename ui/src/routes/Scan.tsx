import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getScan, type ScanResult } from '../services/apiClient'

const riskColor = (score: number) => {
  if (score >= 80) return 'text-red-300 bg-red-500/15 border-red-500/30'
  if (score >= 50) return 'text-amber-300 bg-amber-500/15 border-amber-500/30'
  return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
}

export default function Scan() {
  const { id } = useParams()
  const [data, setData] = useState<ScanResult | null>(null)
  const [notFound, setNotFound] = useState(false)

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
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Scan {data.uuid}</h1>
          <p className="text-sm text-gray-400">Submitted {new Date(data.submitted).toLocaleString()}</p>
        </div>

        <div className="mb-8 w-full rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-lg font-semibold">Verdict: {data.verdict}</div>
            <span className={`rounded-full border px-3 py-1 text-sm ${riskColor(data.risk_score)}`}>Risk {data.risk_score}</span>
          </div>
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm text-gray-300">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">Domain age: {data.domain_age_days || 0} days</div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">Final host: {new URL(data.final_url||data.normalized).hostname}</div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">IP / ASN: {data.ip || 'n/a'} {data.asn ? `(${data.asn})`: ''}</div>
          </div>
          <details className="mb-3">
            <summary className="cursor-pointer select-none text-sm text-gray-200">Redirect path</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-6 text-sm text-gray-300">
              {(data.redirect_chain?.length? data.redirect_chain: [data.normalized]).map((u, i)=> <li key={i}>{u}</li>)}
            </ol>
          </details>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="mb-2 font-medium">WHOIS</div>
              <div className="text-sm text-gray-300">Registrar: {data.whois.registrar || 'n/a'}</div>
              <div className="text-sm text-gray-300">Created: {data.whois.created || 'n/a'}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="mb-2 font-medium">SSL</div>
              <div className="text-sm text-gray-300">Issuer: {data.ssl.issuer || 'n/a'}</div>
              <div className="text-sm text-gray-300">Valid: {data.ssl.valid_from || '—'} → {data.ssl.valid_to || '—'}</div>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="mb-2 font-medium">Map</div>
            <div className="h-28 w-full rounded bg-white/5 text-center text-xs text-gray-400">Geolocation: {data.geolocation.country} {data.geolocation.region} {data.geolocation.city}</div>
          </div>
          {data.model_explanations?.length > 0 && (
            <div className="mt-3 rounded-lg border border-indigo-400/30 bg-indigo-500/10 p-3">
              <div className="mb-1 text-sm font-medium">AI notes</div>
              <ul className="list-disc pl-5 text-sm text-indigo-200">
                {data.model_explanations.map((m,i)=>(<li key={i}>{m}</li>))}
              </ul>
            </div>
          )}
          <details className="mt-3">
            <summary className="cursor-pointer select-none text-sm text-gray-200">View raw JSON</summary>
            <pre className="mt-2 overflow-x-auto rounded bg-black/60 p-3 text-xs text-gray-200">{JSON.stringify(data, null, 2)}</pre>
          </details>
          <div className="mt-4 flex gap-2">
            <button className="rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/15" onClick={()=>{
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `phishintel_report_${data.uuid||'temp'}.json`
              a.click()
              URL.revokeObjectURL(a.href)
            }}>Export Report</button>
            <a className="rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/15" href={data.final_url} target="_blank" rel="noreferrer">Open final URL</a>
          </div>
        </div>
      </section>
    </main>
  )
}