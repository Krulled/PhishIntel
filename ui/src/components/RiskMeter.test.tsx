import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'
import { MemoryRouter } from 'react-router-dom'

describe('RiskMeter', () => {
  const origFetch = global.fetch
  beforeEach(() => { /* @ts-ignore */ global.fetch = vi.fn() })
  afterEach(() => { global.fetch = origFetch; vi.restoreAllMocks() })

  it('renders a verdict after analysis', async () => {
    // Prime recent list request
    // @ts-ignore
    global.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ uuids: [] }), { status: 200 }))

    const payload = {
      status: 'ok', verdict: 'Malicious', uuid: 'abcd-ef', submitted: new Date().toISOString(),
      normalized: 'http://suspicious.example', redirect_chain: [], final_url: 'http://suspicious.example',
      whois: { registrar: '', created: '', updated: '', expires: '', country: '' },
      ssl: { issuer: '', valid_from: '', valid_to: '', sni: '' },
      domain_age_days: 1, ip: '1.2.3.4', asn: '', geolocation: { country: '', region: '', city: '' },
      detections: {}, blacklists: [], heuristics: {}, model_explanations: [], risk_score: 88,
    }
    // @ts-ignore
    global.fetch.mockResolvedValueOnce(new Response(JSON.stringify(payload), { status: 200 }))

    render(<MemoryRouter><App /></MemoryRouter>)
    const input = screen.getAllByRole('textbox')[0]
    const user = (await import('@testing-library/user-event')).default
    await user.type(input, 'http://suspicious.example')
    await user.click(screen.getAllByRole('button', { name: /analyze/i })[0])
    const els = await screen.findAllByText(/verdict/i, {}, { timeout: 2000 })
    expect(els[0]).toBeInTheDocument()
  })
})