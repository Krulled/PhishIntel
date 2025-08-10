import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LiveStats from '../components/LiveStats'
import RecentScansTicker from '../components/RecentScansTicker'

export default function Home() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function validate(value: string): boolean {
    try { 
      const u = new URL(value.startsWith('http') ? value : `https://${value}`)
      return /^(http|https):$/.test(u.protocol) 
    } catch { 
      return false 
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedInput = input.trim()
    if (!validate(trimmedInput)) { 
      setError('Please enter a valid URL (e.g., https://example.com)')
      inputRef.current?.focus()
      return 
    }
    setError(null)
    
    // Navigate to queue with URL as query parameter
    const encodedUrl = encodeURIComponent(trimmedInput)
    navigate(`/queue?url=${encodedUrl}`)
  }

  return (
    <main className="min-h-screen bg-[#0b0e16] text-white">
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left column - Main form */}
          <section className="flex flex-col justify-center">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-indigo-500/10 ring-1 ring-indigo-400/30 lg:mx-0" aria-hidden />
              <h1 className="text-2xl font-semibold tracking-tight">PHISHINTEL</h1>
              <p className="mt-1 text-sm text-gray-300">Analyze URLs for phishing threats and security risks.</p>
            </div>

            <form onSubmit={onSubmit} className="w-full" aria-labelledby="url-input-label">
              <label id="url-input-label" className="sr-only">URL to analyze</label>
              <div className="flex w-full flex-col gap-3">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  inputMode="url"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'error-message' : undefined}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 outline-none ring-1 ring-white/5 focus:ring-indigo-400"
                  placeholder="Enter URL to analyze (e.g., https://example.com)"
                  autoFocus
                />
                <button 
                  className="w-full rounded-lg bg-indigo-500 px-4 py-3 font-medium text-white hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed" 
                  type="submit"
                  disabled={!input.trim()}
                >
                  Analyze
                </button>
              </div>
            </form>

            {error && (
              <div role="alert" id="error-message" className="mt-4 w-full rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="mt-6 text-xs text-gray-400 text-center lg:text-left">
              By submitting you agree to share results with the security community. 
              See <a className="underline hover:text-gray-300" href="/terms" target="_blank" rel="noreferrer">Terms</a>, 
              <a className="underline hover:text-gray-300" href="/privacy" target="_blank" rel="noreferrer"> Privacy</a>, and 
              <a className="underline hover:text-gray-300" href="/security.html" target="_blank" rel="noreferrer"> Security</a>.
            </div>


          </section>

          {/* Right column - Live activity feed */}
          <section className="flex flex-col justify-center space-y-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4">
                <LiveStats />
              </div>
              <RecentScansTicker />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}