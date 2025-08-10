import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Privacy() {
  useEffect(() => {
    document.title = 'Privacy Policy - PhishIntel'
  }, [])

  return (
    <main className="min-h-screen bg-[#0b0e16] text-white">
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
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
            <h2 className="mb-3 text-lg font-semibold text-white">What We Collect</h2>
            <p>
              Submitted URLs, limited technical metadata (timestamps, status), and optional screenshots 
              required for analysis.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">How We Use Data</h2>
            <p>
              To run scans, improve detection quality, and display anonymized activity metrics.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Retention</h2>
            <p>
              We keep data only as long as needed for analysis and troubleshooting; screenshots may be 
              cached temporarily.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Third Parties</h2>
            <p>
              We use external APIs (e.g., URLScan, OpenAI) to perform analysis. Data shared is minimized 
              to what's necessary.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Cookies/Storage</h2>
            <p>
              We may use localStorage for session state (e.g., tokens) and preferences. No tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Your Choices</h2>
            <p>
              You can request deletion of identifiable records by contacting us.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Security</h2>
            <p>
              We apply rate limits, SSRF guards, timeouts, and secure headers to protect the service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Changes/Contact</h2>
            <p>
              We may update this policy. Contact security@yourdomain.example.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
