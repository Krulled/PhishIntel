import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { analyze, type ScanResult } from '../services/apiClient'
import * as api from '../services/apiClient'

const okResult: ScanResult = {
  status: 'ok', verdict: 'Safe', uuid: '1234', submitted: '2025-01-01T00:00:00Z',
  normalized: 'http://example.com', redirect_chain: [], final_url: 'http://example.com',
  whois: { registrar: '', created: '', updated: '', expires: '', country: '' },
  ssl: { issuer: '', valid_from: '', valid_to: '', sni: '' },
  domain_age_days: 0, ip: '', asn: '', geolocation: { country: '', region: '', city: '' },
  detections: {}, blacklists: [], heuristics: {}, model_explanations: [], risk_score: 10,
}

describe('apiClient.analyze', () => {
  const origFetch = global.fetch
  beforeEach(() => {
    // @ts-ignore
    global.fetch = vi.fn()
  })
  afterEach(() => {
    global.fetch = origFetch
    vi.restoreAllMocks()
  })

  it('returns parsed result on first try', async () => {
    // @ts-ignore
    global.fetch.mockResolvedValueOnce(new Response(JSON.stringify(okResult), { status: 200 }))
    const { result } = await analyze('http://example.com')
    expect(result.uuid).toBe('1234')
    expect(result.risk_score).toBe(10)
  })

  it('retries once on failure and then succeeds', async () => {
    // First attempt fails
    // @ts-ignore
    global.fetch
      .mockResolvedValueOnce(new Response('fail', { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(okResult), { status: 200 }))
    const { result } = await analyze('http://example.com')
    expect(result.status).toBe('ok')
  })

  it('throws normalized error with curl after two failures', async () => {
    // @ts-ignore
    global.fetch
      .mockResolvedValueOnce(new Response('fail', { status: 500 }))
      .mockResolvedValueOnce(new Response('fail', { status: 500 }))
    await expect(analyze('http://bad.test')).rejects.toHaveProperty('curl')
  })
})

describe('apiClient auth behavior (additive)', () => {
  const originalFetch = global.fetch
  beforeEach(() => {
    // @ts-ignore
    global.fetch = vi.fn(async (input: any, init?: any) => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    localStorage.clear()
  })
  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('attaches Authorization header when token exists', async () => {
    localStorage.setItem('phishintel_token', 'abc')
    await api.fetchRecentRemote()
    // @ts-ignore
    const call = (global.fetch as any).mock.calls[0]
    const headers = call[1]?.headers || {}
    expect(headers.Authorization).toBe('Bearer abc')
  })

  it('login returns disabled on 501', async () => {
    // @ts-ignore
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'auth_disabled' }), { status: 501 }))
    const res = await api.login('u','p')
    expect(res.disabled).toBe(true)
  })
})