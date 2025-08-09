import React from 'react'
import type { ScanResult } from '../services/apiClient'

function riskClasses(score: number): string {
  if (score >= 80) return 'text-red-300 bg-red-500/15 border-red-500/30'
  if (score >= 50) return 'text-amber-300 bg-amber-500/15 border-amber-500/30'
  return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
}

type Props = Pick<ScanResult, 'verdict' | 'risk_score' | 'uuid' | 'submitted' | 'final_url' | 'normalized'>

export default function ResultsSummary({ verdict, risk_score, uuid, submitted, final_url, normalized }: Props) {
  const host = (() => {
    try { return new URL(final_url || normalized).hostname } catch { return '' }
  })()
  return (
    <div className="mb-8 w-full rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-lg font-semibold">Verdict: {verdict}</div>
        <span className={`rounded-full border px-3 py-1 text-sm ${riskClasses(risk_score)}`}>Risk {risk_score}</span>
      </div>
      <div className="text-sm text-gray-300">Host: {host}</div>
      <div className="mt-1 text-xs text-gray-400">Scan {uuid} — {submitted ? new Date(submitted).toLocaleString() : ''}</div>
    </div>
  )
}