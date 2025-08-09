import React from 'react'
import type { ScanResult } from '../services/apiClient'

export default function SSLCard({ ssl }: Pick<ScanResult, 'ssl'>) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="mb-2 font-medium">SSL</div>
      <div className="text-sm text-gray-300">Issuer: {ssl.issuer || 'n/a'}</div>
      <div className="text-sm text-gray-300">Valid: {ssl.valid_from || '—'} → {ssl.valid_to || '—'}</div>
      <div className="text-sm text-gray-300">SNI: {ssl.sni || 'n/a'}</div>
    </div>
  )
}