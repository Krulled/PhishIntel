import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { analyze, type AnalysisResponse } from '../services/apiClient'
import { saveResult, getRecent } from '../services/storage'

export default function Home() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const recent = useMemo(() => getRecent(5), [])

  function isValid(v: string) {
    const s = v.trim()
    if (!s) return false
    // allow url, ip, domain, or hash (basic check)
    try { new URL(s.includes('://') ? s : `http://${s}`) } catch { return false }
    return true
  }

  async function onSubmit() {
    setError(null)
    if (!isValid(input)) {
      setError('Enter a valid URL, IP, domain, or hash')
      return
    }
    setLoading(true)
    try {
      const res: AnalysisResponse = await analyze(input)
      saveResult(res)
      navigate(`/scan/${res.uuid}`)
    } catch (e: any) {
      const msg = e?.message || 'Request failed'
      setError(msg)
    } finally { setLoading(false) }
  }

  return (
    <main className="container p-gap mx-auto max-w-screen-sm">
      <section className="mt-12 text-center">
        <div className="mb-6">
          <div className="mx-auto h-12 w-12 rounded-full bg-accent flex items-center justify-center" aria-hidden="true">PI</div>
          <h1 className="mt-3 text-title font-semibold">PhishIntel</h1>
          <p className="text-muted">AI Powered Phishing and Link Threat Intelligence</p>
        </div>
        <form className="mt-6" onSubmit={(e) => { e.preventDefault(); onSubmit() }} aria-label="Analyze input">
          <label htmlFor="input" className="sr-only">Input</label>
          <div className="flex gap-2">
            <input id="input" name="input" className="input flex-1" placeholder="URL, IP, domain, or hash" autoComplete="off" inputMode="url" aria-invalid={!!error} value={input} onChange={(e) => setInput(e.target.value)} />
            <button type="button" className="btn" onClick={() => setInput('')} aria-label="Clear">Clear</button>
            <button type="submit" className="btn btn-primary" disabled={loading} aria-live="polite">
              {loading ? <span className="spinner" role="status" aria-label="Analyzing"></span> : 'Analyze'}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">By submitting a link or file you agree to share results with the security community. <a className="link" href="#terms">Terms</a> · <a className="link" href="#privacy">Privacy</a> · <a className="link" href="#security">Security</a></p>
        </form>
        {error && (
          <div className="mt-3 callout callout-error" role="alert">
            <p>{error}</p>
            <div className="mt-2 flex gap-2 justify-center">
              <button className="btn btn-secondary" onClick={onSubmit}>Retry</button>
              <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(`curl -s -X POST -H 'Content-Type: application/json' \'${location.origin}/analyze\' -d '{"input":"${input.replace(/"/g, '\\"')}"}'`)}>Copy curl</button>
            </div>
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section className="mt-10" aria-label="Recent scans">
          <h2 className="text-subtitle mb-2">Recent scans</h2>
          <ul className="space-y-2">
            {recent.map((r) => (
              <li key={r.uuid} className="card flex items-center justify-between p-3">
                <div>
                  <div className="text-sm">{r.uuid.slice(0,8)}…</div>
                  <div className="text-xs text-muted">{r.submitted ? new Date(r.submitted).toLocaleString() : ''}</div>
                </div>
                <Link className="link" to={`/scan/${r.uuid}`} aria-label={`Open scan ${r.uuid}`}>{r.verdict}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}