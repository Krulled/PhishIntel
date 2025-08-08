import { useState, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import CyberLoading from '../components/CyberLoading'
import EvidenceTabs from '../components/EvidenceTabs'
import DetailedResults from '../components/DetailedResults'
import type { SafeAnalysisResult } from '../services/analyzer'
import { getAnalysis } from '../services/analyzer'
import { saveResult } from '../services/storage'

function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-accent-green" aria-hidden="true" />
          <span className="font-semibold">PhishIntel</span>
        </div>
        <nav className="text-sm text-gray-300" aria-label="Primary">
          <a className="hover:text-white" href="#safety">Safety</a>
        </nav>
      </div>
    </header>
  )
}

function UrlInputForm({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const validate = (value: string) => {
    try {
      const u = new URL(value)
      return /^https?:$/.test(u.protocol)
    } catch {
      return false
    }
  }

  return (
    <form
      aria-label="Analyze URL"
      className="flex w-full max-w-2xl items-stretch gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!validate(url)) {
          setError('Enter a valid http(s) URL')
          return
        }
        setError(null)
        onSubmit(url)
      }}
    >
      <label className="sr-only" htmlFor="url">URL</label>
      <input
        id="url"
        name="url"
        className="input flex-1"
        placeholder="https://example.com/suspicious"
        autoComplete="off"
        inputMode="url"
        aria-invalid={!!error}
        aria-describedby={error ? 'url-error' : undefined}
        value={url}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData('text')
          if (pasted && !url) setUrl(pasted.trim())
        }}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button type="button" className="btn btn-secondary" aria-label="Clear" onClick={() => setUrl('')}>Clear</button>
      <button className="btn btn-primary" type="submit" aria-label="Analyze">Analyze</button>
      {error && (
        <div role="alert" id="url-error" className="sr-only">{error}</div>
      )}
    </form>
  )
}

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

export default function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SafeAnalysisResult | null>(null)

  return (
    <div className="min-h-full">
      <Header />
      <main className="container py-10">
        <section className="mx-auto text-center">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight">Analyze a link before you click.</h1>
          <p className="mb-6 text-gray-300">Paste any URL to get a quick, private risk assessment.</p>
          <div className="mx-auto">
            <UrlInputForm onSubmit={async (url) => {
              setLoading(true)
              setError(null)
              try {
                const id = crypto.randomUUID()
                const res = await getAnalysis(url)
                await saveResult(id, res)
                setData(res)
                navigate(`/scan/${id}`)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Analysis failed')
              } finally {
                setLoading(false)
              }
            }} />
          </div>
        </section>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {loading && <CyberLoading message="Analyzing URL for security threats..." />}

        {!loading && data && (
          <>
            <Suspense fallback={<div className="mt-8"><div className="h-56 animate-pulse rounded-xl bg-muted" /></div>}>
              <section aria-label="Analysis results" className="container space-y-6 py-8">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="card p-4 space-y-3 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Risk Summary</h2>
                      <RiskBadge level={data.riskLevel} />
                    </div>
                    <RiskMeter score={data.riskScore} />
                    <p className="text-sm text-gray-300">Analyzed {data.url} at {new Date(data.submittedAt).toLocaleString()}</p>
                  </div>
                </div>
              </section>
            </Suspense>
            <DetailedResults data={data} />
          </>
        )}
      </main>
    </div>
  )
}