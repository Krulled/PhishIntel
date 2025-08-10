import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Security() {
  useEffect(() => {
    document.title = 'Security Practices - PhishIntel'
  }, [])

  return (
    <main className="min-h-screen bg-[#0b0e16] text-white">
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Security Practices</h1>
          <Link 
            to="/" 
            className="rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <div className="space-y-6 text-gray-300">
          <div className="text-sm text-gray-400">
            Last updated: 2025-01-10
          </div>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Overview</h2>
            <p>
              MVP safeguards in place to protect users and infrastructure.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Controls</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>SSRF mitigation for outbound URL fetches</li>
              <li>Time-limited requests and size caps for external APIs</li>
              <li>Input validation for URLs; private/metadata IPs blocked</li>
              <li>Rate limiting on expensive endpoints</li>
              <li>Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)</li>
              <li>Least-privilege API keys loaded via environment variables only</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Responsible Disclosure</h2>
            <p>
              Report suspected vulnerabilities to security@yourdomain.example.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
