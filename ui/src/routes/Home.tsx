import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyze, type ScanResult, saveRecent, getRecent, fetchRecentRemote } from '../services/apiClient'

const riskColor = (score: number) => {
  if (score >= 80) return 'text-red-300 bg-red-500/15 border-red-500/30'
  if (score >= 50) return 'text-amber-300 bg-amber-500/15 border-amber-500/30'
  return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
}

export default function Home() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'file' | 'url' | 'search'>('search')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ScanResult | null>(null)
  const [recent, setRecent] = useState<string[]>([])
  const liveRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ;(async () => {
      const local = getRecent()
      const remote = await fetchRecentRemote()
      const merged = [...new Set([...remote, ...local])].slice(0, 5)
      setRecent(merged)
    })()
  }, [])

  const placeholder = useMemo(() => {
    if (activeTab === 'file') return 'File hash (sha256), URL, IP, or domain'
    if (activeTab === 'url') return 'URL (https://example.com/login)'
    return 'URL, IP address, domain, or file hash'
  }, [activeTab])

  function validate(value: string): boolean {
    if (activeTab === 'url') {
      try { const u = new URL(value); return /^(http|https):$/.test(u.protocol) } catch { return false }
    }
    return value.trim().length > 0
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate(input)) { setError('Enter a valid input'); return }
    setError(null)
    setLoading(true)
    liveRef.current?.setAttribute('aria-busy', 'true')
    try {
      const tempId = crypto.randomUUID()
      const { result } = await analyze(input.trim())
      const id = result.uuid || tempId
      setData(result)
      saveRecent(id)
      setRecent(getRecent())
      navigate(`/scan/${id}`)
    } catch (err: any) {
      const message = err?.message || 'Request failed'
      setError(message)
      if (err?.curl) {
        ;(navigator.clipboard?.writeText as any)?.(err.curl).catch(() => {})
      }
    } finally {
      setLoading(false)
      liveRef.current?.setAttribute('aria-busy', 'false')
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0e16] text-white">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-indigo-500/10 ring-1 ring-indigo-400/30" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight">PHISHINTEL</h1>
          <p className="mt-1 text-sm text-gray-300">Search for a URL, domain, IP, or hash to assess phishing risk.</p>
        </div>

        <div className="mb-3 flex items-center gap-6 text-sm text-gray-300" role="tablist" aria-label="Mode">
          {(['file','url','search'] as const).map(t => (
            <button key={t} role="tab" aria-selected={activeTab===t} className={`pb-1 ${activeTab===t? 'border-b-2 border-indigo-400 text-white':'text-gray-400 hover:text-gray-200'}`} onClick={()=>setActiveTab(t)}>{t.toUpperCase()}</button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="w-full" aria-labelledby="search-label">
          <label id="search-label" className="sr-only">Search input</label>
          <div className="flex w-full flex-col items-center gap-3">
            <input
              value={input}
              onChange={(e)=>setInput(e.target.value)}
              inputMode="url"
              aria-invalid={!!error}
              aria-describedby={error? 'err':''}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 outline-none ring-1 ring-white/5 focus:ring-indigo-400"
              placeholder={placeholder}
            />
            <button className="w-full rounded-lg bg-indigo-500 px-4 py-3 font-medium text-white hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" type="submit">Analyze</button>
            <div className="text-xs text-gray-400">By submitting you agree to share results with the security community. See <a className="underline" href="/terms" target="_blank" rel="noreferrer">Terms</a>, <a className="underline" href="/privacy" target="_blank" rel="noreferrer">Privacy</a>, and <a className="underline" href="/security.html" target="_blank" rel="noreferrer">Security</a>.</div>
          </div>
        </form>

        {error && (
          <div role="alert" id="err" className="mt-4 w-full rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
        )}

        <div ref={liveRef} aria-live="polite" className="sr-only" />

        {loading && (
          <div className="mt-6 w-full animate-pulse rounded-xl border border-white/10 bg-white/5 p-6 text-center" role="status">Analyzing…</div>
        )}

        {/* Recent scans strip */}
        {recent.length > 0 && (
          <div className="mt-8 w-full text-sm text-gray-300">
            <div className="mb-2 font-medium">Recent scans</div>
            <div className="flex flex-wrap gap-2">
              {recent.slice(0,5).map(id => (
                <button key={id} className="rounded border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10" onClick={()=>navigate(`/scan/${id}`)}>{id.slice(0,8)}…</button>
              ))}
            </div>
          </div>
        )}

        {!loading && data && (
          <div className="mt-8 w-full rounded-xl border border-white/10 bg-white/5 p-5">
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
            {/* raw JSON removed per reporting constraints */}
            <div className="mt-4 flex gap-2">
              <button className="rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/15" onClick={()=>{
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = `phishintel_report_${data.uuid||'temp'}.json`
                a.click()
                URL.revokeObjectURL(a.href)
              }}>Export Report</button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}