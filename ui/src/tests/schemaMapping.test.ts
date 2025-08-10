import { describe, it, expect } from 'vitest'
import type { ScanResult } from '../services/apiClient'

function keysInOrder(obj: object): string[] {
  return JSON.stringify(obj).replace(/^{|}$/g, '').split(',').map(kv => kv.split(':')[0].replace(/\"/g, '').trim())
}

describe('ScanResult schema', () => {
  it('includes required fields in expected order', () => {
    const sample: ScanResult = {
      status: 'ok', verdict: 'Suspicious', uuid: 'u', submitted: 's', normalized: 'n', redirect_chain: [], final_url: 'f',
      whois: { registrar: '', created: '', updated: '', expires: '', country: '' },
      ssl: { issuer: '', valid_from: '', valid_to: '', sni: '' },
      domain_age_days: 0, ip: '', asn: '', detections: {}, blacklists: [], heuristics: {}, model_explanations: [], risk_score: 42,
    }
    const order = keysInOrder(sample)
    expect(order.slice(0, 6)).toEqual(['status', 'verdict', 'uuid', 'submitted', 'normalized', 'redirect_chain'])
    expect(order.includes('risk_score')).toBe(true)
  })
})