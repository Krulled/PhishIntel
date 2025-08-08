import { describe, it, expect } from 'vitest'
import { saveResult, getResult } from '../services/storage'

describe('storage round trip with uuid', () => {
  it('saves and retrieves analysis result by id', async () => {
    const id = 'test-id-1234'
    const data = {
      url: 'https://example.com',
      submittedAt: new Date().toISOString(),
      riskScore: 10,
      riskLevel: 'Low',
      findings: [],
      redirects: [],
      ssl: { issuer: 'LE', validFrom: '2024-01-01', validTo: '2025-01-01' },
      dns: { a: [], ns: [], ageDays: 1000 },
      whois: { registrar: 'Example', created: '2010-01-01' },
      headers: [],
      contentSignals: [],
    } as const
    await saveResult(id, data as any)
    const loaded = await getResult(id)
    expect(loaded?.url).toBe(data.url)
  })
})