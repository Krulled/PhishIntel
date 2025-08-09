import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCached, saveResult } from '../services/storage'
import { getScan, type AnalysisResponse } from '../services/apiClient'

function Badge({ verdict }: { verdict: AnalysisResponse['verdict'] }) {
  const cls = verdict === 'Safe' ? 'safe' : verdict === 'Suspicious' ? 'susp' : 'mal'
  return <span className={`badge ${cls}`}>{verdict}</span>
}

function Collapsible({ title, children }: { title: string; children: any }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card">
      <button className="collapse-toggle" aria-expanded={open} onClick={() => setOpen(v => !v)}>{title}</button>
      <div className={open ? 'collapse-open' : 'collapse-closed'}>{open ? children : <div className="skeleton h-6" />}</div>
    </div>
  )
}

export default function Scan() {
  const { uuid } = useParams()
  const [data, setData] = useState<AnalysisResponse | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!uuid) return
    const cached = getCached(uuid)
    if (cached) setData(cached)
    ;(async () => {
      try {
        const remote = await getScan(uuid)
        if (!cancelled) { setData(remote); saveResult(remote) }
      } catch (e) {
        if (!cached && !cancelled) setNotFound(true)
      }
    })()
    return () => { cancelled = true }
  }, [uuid])

  if (notFound) {
    return (
      <main className="container p-gap text-center">
        <h1 className="text-subtitle">Scan not found</h1>
        <Link className="link" to="/">Back</Link>
      </main>
    )
  }

  if (!data) {
    return <main className="container p-gap"><div className="skeleton h-32" /></main>
  }

  const exportReport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `phishintel_report_${data.uuid}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <main className="container p-gap space-y-gap">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge verdict={data.verdict} />
          <div className="text-sm text-muted">Risk {data.risk_score}</div>
        </div>
        <button className="btn btn-secondary" onClick={exportReport}>Export Report</button>
      </header>

      <section className="card p-3">
        <div className="text-sm">{data.final_url || data.normalized}</div>
        <div className="quickfacts">
          <div><span>Domain age</span><strong>{data.domain_age_days ?? '—'}</strong></div>
          <div><span>Host IP</span><strong>{data.ip ?? '—'}</strong></div>
          <div><span>ASN</span><strong>{data.asn ?? '—'}</strong></div>
        </div>
      </section>

      <Collapsible title="Redirect chain">
        {data.redirect_chain.length ? (
          <ol className="list">
            {data.redirect_chain.map((u, i) => <li key={i}>{u}</li>)}
          </ol>
        ) : <p className="text-muted">No redirects recorded.</p>}
      </Collapsible>

      <Collapsible title="WHOIS">
        <pre className="pre">
{JSON.stringify(data.whois, null, 2)}
        </pre>
      </Collapsible>

      <Collapsible title="SSL/TLS">
        <pre className="pre">
{JSON.stringify(data.ssl, null, 2)}
        </pre>
      </Collapsible>

      <Collapsible title="Detections">
        {Object.keys(data.detections).length ? (
          <ul className="list">
            {Object.entries(data.detections).map(([k, v]) => <li key={k}><strong>{k}:</strong> {v}</li>)}
          </ul>
        ) : <p className="text-muted">No detections.</p>}
      </Collapsible>

      <section className="card p-3">
        <h2 className="text-sm font-medium">Model notes</h2>
        {data.model_explanations.length ? (
          <ul className="list">
            {data.model_explanations.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        ) : <p className="text-muted">No explanations provided.</p>}
      </section>

      <section className="card p-3">
        <h2 className="text-sm font-medium">Graph</h2>
        <div className="graph" aria-hidden="true" />
      </section>

      <details className="card p-3">
        <summary>Code view</summary>
        <pre className="pre" aria-label="Raw JSON">
{JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </main>
  )
}