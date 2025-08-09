import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { analyze } from '../services/apiClient'
import CyberLoading from '../components/CyberLoading'

export default function Queue() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  
  const url = searchParams.get('url')

  useEffect(() => {
    if (!url) {
      navigate('/')
      return
    }

    let cancelled = false

    async function performAnalysis() {
      try {
        const { result } = await analyze(url)
        if (!cancelled) {
          const scanId = result.uuid || crypto.randomUUID()
          navigate(`/scan/${scanId}`, { 
            replace: true,
            state: { scanResult: result }
          })
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Analysis failed:', err)
          setError(err?.message || 'Analysis failed. Please try again.')
        }
      }
    }

    performAnalysis()

    return () => {
      cancelled = true
    }
  }, [url, navigate])

  if (error) {
    return (
      <main className="min-h-screen bg-[#0b0e16] text-white">
        <section className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4">
          <div className="text-center space-y-4">
            <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-red-500/10 ring-1 ring-red-400/30" aria-hidden />
            <h1 className="text-2xl font-semibold text-red-300">Analysis Failed</h1>
            <p className="text-gray-300 max-w-md">{error}</p>
            <button 
              onClick={() => navigate('/')}
              className="inline-flex items-center rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              Try Again
            </button>
          </div>
        </section>
      </main>
    )
  }

  return <CyberLoading message={`Analyzing ${url}...`} />
}
