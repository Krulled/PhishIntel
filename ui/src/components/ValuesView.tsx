import React from 'react'
import { normalizeScan, flattenForTable, type NormalizedScan } from '../services/valuesNormalizer'
import UrlscanScreenshot from './UrlscanScreenshot'
import AINotes from './AINotes'

export default function ValuesView({ raw }: { raw: any }) {
  const norm: NormalizedScan = normalizeScan(raw)
  const flat = flattenForTable(norm)
  const keys = Object.keys(flat).sort((a, b) => a.localeCompare(b))

  const submittedReadable = norm.createdAt?.split(' · ')[1] || 'n/a'
  const headerLine = `Scan ${norm.id || 'n/a'} — ${norm.url || 'n/a'} (Submitted: ${submittedReadable})`

  // Extract scan ID for screenshot component
  const scanId = raw?.uuid || raw?.id || raw?.scan_id || raw?.scanId || norm.id || ''

  return (
    <section className="space-y-3">
      {/* Header line with copy scan ID button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-300">{headerLine}</div>
        {scanId && (
          <button
            onClick={() => navigator.clipboard?.writeText(scanId)}
            className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/15 transition-colors"
            title="Copy Scan ID"
          >
            📋 {scanId.substring(0, 8)}...
          </button>
        )}
      </div>

      {/* Verdict block */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold">Verdict: {norm.verdict || 'n/a'}</h2>
          <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-gray-200">
            Risk {norm.riskScore}{norm.riskScoreLabel ? ` (${norm.riskScoreLabel})` : ''}
          </span>
        </div>
        <div className="mt-1 grid grid-cols-1 gap-2 text-xs text-gray-300 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-700/40 bg-black/20 p-2">Domain age: {norm.domainAgeDays == null ? 'n/a' : `${norm.domainAgeDays} days`}</div>
          <div className="rounded-2xl border border-zinc-700/40 bg-black/20 p-2">Final host: {norm.finalHost || 'n/a'}</div>
          <div className="rounded-2xl border border-zinc-700/40 bg-black/20 p-2">IP / ASN: {norm.ipAsn || 'n/a'}</div>
        </div>
      </div>

      {/* AI notes immediately under Verdict - now fetches and merges screenshot notes */}
      <AINotes notes={norm.notes || []} scanId={scanId} />

      {/* Redirect path */}
      <div className="rounded-2xl border border-zinc-700/40 bg-black/20 p-4">
        <div className="mb-2 text-sm font-semibold">Redirect path</div>
        {norm.redirects && norm.redirects.length > 0 ? (
          <ol className="list-decimal space-y-1 pl-6 text-sm text-gray-300">
            {norm.redirects.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ol>
        ) : (
          <div className="text-sm text-gray-300">n/a</div>
        )}
      </div>

      {/* SSL card */}
      <div className="rounded-2xl border border-zinc-700/40 bg-black/20 p-4">
        <div className="mb-2 text-sm font-semibold">SSL</div>
        <div className="text-sm text-gray-300">Issuer: {norm.ssl.issuer || 'n/a'}</div>
        <div className="text-sm text-gray-300">Valid: {norm.ssl.validFrom || '—'} → {norm.ssl.validTo || '—'}</div>
        <div className="text-sm text-gray-300">Status: {norm.ssl.status || 'n/a'}</div>
      </div>

      {/* URLScan Screenshot section (replaces Evidence/Map) */}
      <div data-testid="evidence-section">
        <UrlscanScreenshot scanId={scanId} />
      </div>

      {/* All Values (Flattened) table */}
      <div className="rounded-2xl border border-zinc-700/40 bg-black/20 p-4">
        <div className="mb-3 text-sm font-semibold">All Values (Flattened)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400">
                <th className="w-1/3 border-b border-white/10 pb-1">Key</th>
                <th className="border-b border-white/10 pb-1">Value</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k} className="align-top">
                  <td className="py-1 pr-3 text-gray-300">{k}</td>
                  <td className="py-1 text-gray-100">{flat[k] || 'n/a'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex flex-wrap gap-2 text-sm">
        <button className="rounded bg-white/10 px-3 py-2 hover:bg-white/15 transition-colors">Export Report</button>
        {norm.url && norm.url !== 'n/a' ? (
          <a 
            href={norm.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="rounded bg-white/10 px-3 py-2 hover:bg-white/15 transition-colors inline-block"
          >
            🔗 Open final URL
          </a>
        ) : (
          <span className="rounded bg-white/10 px-3 py-2 text-gray-400">🔗 Open final URL (n/a)</span>
        )}
      </div>
    </section>
  )
}