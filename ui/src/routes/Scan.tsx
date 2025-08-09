import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getScan, type ScanResult } from '../services/apiClient'
import ResultsSummary from '../components/ResultsSummary'
import QuickFacts from '../components/QuickFacts'
import RedirectViewer from '../components/RedirectViewer'
import WhoisCard from '../components/WhoisCard'
import SSLCard from '../components/SSLCard'
import MapPlaceholder from '../components/MapPlaceholder'
import AINotes from '../components/AINotes'

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
        <ResultsSummary verdict={data.verdict} risk_score={data.risk_score} uuid={data.uuid} submitted={data.submitted} final_url={data.final_url} normalized={data.normalized} />
        <QuickFacts domain_age_days={data.domain_age_days} final_url={data.final_url} normalized={data.normalized} ip={data.ip} asn={data.asn} />
        <RedirectViewer chain={data.redirect_chain} normalized={data.normalized} />
        <div className="grid gap-3 sm:grid-cols-2">
          <WhoisCard whois={data.whois} domain_age_days={data.domain_age_days} />
          <SSLCard ssl={data.ssl} />
        </div>
        <MapPlaceholder geolocation={data.geolocation} />
        <AINotes notes={data.model_explanations} />
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
      </section>
    </main>
  )
}