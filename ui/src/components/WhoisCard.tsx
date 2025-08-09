import React from 'react'
import type { ScanResult } from '../services/apiClient'

export default function WhoisCard({ whois, domain_age_days }: Pick<ScanResult, 'whois' | 'domain_age_days'>) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="mb-2 font-medium">WHOIS</div>
      <div className="text-sm text-gray-300">Registrar: {whois.registrar || 'n/a'}</div>
      <div className="text-sm text-gray-300">Created: {whois.created || 'n/a'}</div>
      <div className="text-sm text-gray-300">Updated: {whois.updated || 'n/a'}</div>
      <div className="text-sm text-gray-300">Expires: {whois.expires || 'n/a'}</div>
      <div className="text-sm text-gray-300">Country: {whois.country || 'n/a'}</div>
      <div className="text-sm text-gray-300">Domain age: {domain_age_days || 0} days</div>
    </div>
  )
}