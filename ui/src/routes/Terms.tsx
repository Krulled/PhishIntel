import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Terms() {
  useEffect(() => {
    document.title = 'Terms of Service - PhishIntel'
  }, [])

  return (
    <main className="min-h-screen bg-[#0b0e16] text-white">
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Terms of Service</h1>
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
              PhishIntel is a research and analysis tool that helps evaluate URLs for potential phishing risks. 
              By using this service, you agree to these Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Acceptable Use</h2>
            <p>
              Do not use PhishIntel to target individuals, violate laws, or interfere with systems you do not 
              own or control.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">No Guarantee</h2>
            <p>
              Results are probabilistic and may be incomplete or inaccurate. Always confirm with your own 
              security processes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Privacy</h2>
            <p>
              See our <Link to="/privacy" className="text-indigo-400 hover:text-indigo-300 underline">Privacy Policy</Link> to 
              understand what we collect and why.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Liability</h2>
            <p>
              To the maximum extent permitted by law, PhishIntel and contributors are not liable for damages 
              arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Changes</h2>
            <p>
              We may update these Terms; continued use means acceptance.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Contact</h2>
            <p>
              security@yourdomain.example
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
