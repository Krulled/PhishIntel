import React from 'react'
import type { ScanResult } from '../services/apiClient'

type Props = Pick<ScanResult, 'domain_age_days' | 'final_url' | 'normalized' | 'ip' | 'asn'>

export default function QuickFacts({ domain_age_days, final_url, normalized, ip, asn }: Props) {
  const host = (() => { try { return new URL(final_url || normalized).hostname } catch { return '' } })()
  return (
    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm text-gray-300">
      <div className="rounded-lg border border-white/10 bg-black/20 p-3">Domain age: {domain_age_days || 0} days</div>
      <div className="rounded-lg border border-white/10 bg-black/20 p-3">Final host: {host}</div>
      <div className="rounded-lg border border-white/10 bg-black/20 p-3">IP / ASN: {ip || 'n/a'} {asn ? `(${asn})` : ''}</div>
    </div>
  )
}