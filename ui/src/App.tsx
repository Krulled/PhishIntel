import { Suspense, useMemo, useState } from 'react'
import { ShieldCheck, ClipboardCopy, ExternalLink } from 'lucide-react'

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-[#17202a] to-muted rounded-xl ${className}`} />
  )
}

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

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash)
  useMemo(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return hash
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
    <div className="w-full">
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

import EvidenceTabs from './components/EvidenceTabs'
import CyberLoading from './components/CyberLoading'
import DetailedResults from './components/DetailedResults'
import type { SafeAnalysisResult } from './services/analyzer'

import { getAnalysis } from './services/analyzer'

function mockAnalyze(input: string): Promise<SafeAnalysisResult> {
  const now = new Date().toISOString()
  const base: Omit<SafeAnalysisResult, 'url' | 'submittedAt' | 'riskScore' | 'riskLevel'> = {
    findings: [],
    redirects: [],
    ssl: { issuer: 'Let\'s Encrypt', validFrom: '2024-01-01', validTo: '2025-01-01' },
    dns: { a: ['93.184.216.34'], ns: ['ns1.example.com'], ageDays: 3650 },
    whois: { registrar: 'Example Registrar', created: '2010-05-01' },
    headers: [
      { name: 'server', value: 'nginx' },
      { name: 'x-powered-by', value: 'PHP/5.6', suspicious: true },
    ],
    contentSignals: [],
  }
  let result: SafeAnalysisResult
  if (/example\.com\/?$/.test(input)) {
    result = {
      url: input,
      submittedAt: now,
      riskScore: 8,
      riskLevel: 'Low',
      ...base,
      findings: [{ id: 'f1', title: 'Well-known brand domain', severity: 'low' }],
      redirects: [{ index: 0, domain: 'example.com', status: 200, risk: 'low' }],
    }
  } else if (/suspicious\.example/i.test(input)) {
    result = {
      url: input,
      submittedAt: now,
      riskScore: 72,
      riskLevel: 'High',
      ssl: { issuer: 'Unknown CA', validFrom: '2025-07-01', validTo: '2025-09-01' },
      dns: { a: ['203.0.113.55'], ns: ['ns.bad-dns.net'], ageDays: 3 },
      whois: { registrar: 'Shady Registrar', created: '2025-08-05' },
      headers: [
        { name: 'x-frame-options', value: 'ALLOWALL', suspicious: true },
        { name: 'content-security-policy', value: "default-src * 'unsafe-eval' 'unsafe-inline'", suspicious: true },
      ],
      contentSignals: ['Obfuscated JavaScript', 'Suspicious form posts credentials'],
      findings: [
        { id: 'f2', title: 'Brand spoof detected', severity: 'high' },
        { id: 'f3', title: 'Typosquatting pattern', severity: 'medium' },
      ],
      redirects: [
        { index: 0, domain: 'suspicious.example', status: 302, risk: 'medium' },
        { index: 1, domain: 'login-update-example.com', status: 200, risk: 'high' },
      ],
    }
  } else if (/bit\.ly|t\.co|tinyurl/i.test(input)) {
    result = {
      url: input,
      submittedAt: now,
      riskScore: 48,
      riskLevel: 'Medium',
      ...base,
      findings: [{ id: 'f4', title: 'Shortened URL obscures destination', severity: 'medium' }],
      redirects: [
        { index: 0, domain: 'bit.ly', status: 301, risk: 'medium' },
        { index: 1, domain: 'unknown-target.com', status: 200, risk: 'medium' },
      ],
    }
  } else {
    result = {
      url: input,
      submittedAt: now,
      riskScore: 20,
      riskLevel: 'Low',
      ...base,
      findings: [],
      redirects: [{ index: 0, domain: new URL(input).hostname, status: 200, risk: 'low' }],
    }
  }
  return new Promise((resolve) => setTimeout(() => resolve(result), 800))
}

function Results({ data }: { data: SafeAnalysisResult }) {
  const [copied, setCopied] = useState(false)
  return (
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
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-medium">Next steps</h3>
          <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
            <li>Report to your provider</li>
            <li>Open in sandbox</li>
            <li>Request takedown</li>
          </ul>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary"
              aria-label="Copy full report"
              onClick={async () => {
                const report = JSON.stringify(data, null, 2)
                await navigator.clipboard.writeText(report)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
            >
              <ClipboardCopy size={16} className="mr-1"/>Copy
            </button>
            <a className="btn btn-primary" href={`#share=${encodeURIComponent(JSON.stringify(data))}`} aria-label="Share read-only report"><ExternalLink size={16} className="mr-1"/>Share</a>
          </div>
          <div aria-live="polite" className="sr-only" role="status">{copied ? 'Report copied to clipboard' : ''}</div>
        </div>
      </div>

              <EvidenceTabs data={data} />

      <div id="safety" className="card p-4">
        <h3 className="text-sm font-medium">Safety tips</h3>
        <ul className="mt-2 list-disc pl-5 text-sm text-gray-300 space-y-1">
          <li>Never click unknown links; use an isolated environment.</li>
          <li>PhishIntel offers guidance and is not a substitute for enterprise policy.</li>
        </ul>
      </div>
    </section>
  )
}

export default function App() {
  const hash = useHash()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SafeAnalysisResult | null>(() => {
    if (hash.startsWith('#share=')) {
      try { return JSON.parse(decodeURIComponent(hash.slice('#share='.length))) } catch {}
    }
    return null
  })

  if (loading) {
    return <CyberLoading message="Analyzing URL for security threats..." />
  }

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
                console.log('🔍 Starting analysis for:', url)
                const res = await getAnalysis(url)
                setData(res)
                console.log('✅ Analysis completed:', res)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Analysis failed')
                console.error('❌ Analysis error:', err)
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

        {!loading && data && (
          <>
            <Suspense fallback={<div className="mt-8"><Skeleton className="h-56" /></div>}>
              <Results data={data} />
            </Suspense>
            <DetailedResults data={data} />
          </>
        )}
      </main>
    </div>
  )
}
