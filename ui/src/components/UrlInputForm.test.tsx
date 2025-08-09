import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

describe('Home input form', () => {
  const origFetch = global.fetch
  beforeEach(() => {
    // @ts-ignore
    global.fetch = vi.fn()
  })
  afterEach(() => {
    global.fetch = origFetch
    vi.restoreAllMocks()
  })

  it('shows error for invalid input and announces via alert', async () => {
    // Prime recent list request
    // @ts-ignore
    global.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ uuids: [] }), { status: 200 }))

    render(<MemoryRouter><App /></MemoryRouter>)
    const form = screen.getAllByRole('form')[0]
    const scope = within(form)
    await userEvent.click(scope.getByRole('button', { name: /analyze/i }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/enter a valid input|valid http\(s\) url/i)
  })

  it('accepts a valid URL and triggers analysis', async () => {
    // Prime recent list request
    // @ts-ignore
    global.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ uuids: [] }), { status: 200 }))

    const payload = {
      status: 'ok', verdict: 'Safe', uuid: 'abcd-ef', submitted: new Date().toISOString(),
      normalized: 'http://example.com', redirect_chain: [], final_url: 'http://example.com',
      whois: { registrar: '', created: '', updated: '', expires: '', country: '' },
      ssl: { issuer: '', valid_from: '', valid_to: '', sni: '' },
      domain_age_days: 0, ip: '', asn: '', geolocation: { country: '', region: '', city: '' },
      detections: {}, blacklists: [], heuristics: {}, model_explanations: [], risk_score: 5,
    }
    // @ts-ignore
    global.fetch.mockResolvedValueOnce(new Response(JSON.stringify(payload), { status: 200 }))

    render(<MemoryRouter initialEntries={["/"]}><App /></MemoryRouter>)
    const input = screen.getAllByRole('textbox')[0]
    await userEvent.type(input, 'https://example.com')
    await userEvent.click(screen.getAllByRole('button', { name: /analyze/i })[0])
    const verdictEls = await screen.findAllByText(/verdict/i, {}, { timeout: 2000 })
    expect(verdictEls[0]).toBeInTheDocument()
  })
})