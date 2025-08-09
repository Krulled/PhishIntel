import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import Home from '../routes/Home'
import Scan from '../routes/Scan'

const sample = {
  status: 'ok', uuid: 'abc123', submitted: new Date().toISOString(), normalized: 'http://e', verdict: 'Safe', risk_score: 0,
  redirect_chain: [], final_url: 'http://e', whois: { registrar: null, created: null, updated: null, expires: null, country: null },
  ssl: { issuer: null, valid_from: null, valid_to: null, sni: null }, domain_age_days: null, ip: null, asn: null, geo: { country: null, region: null, city: null },
  detections: {}, blacklists: [], heuristics: {}, model_explanations: [], error: null
}

describe('smoke flow', () => {
  it('navigates to scan after analysis', async () => {
    const fetchMock = vi.spyOn(global, 'fetch' as any).mockResolvedValue({ ok: true, json: async () => sample })
    const router = createMemoryRouter([
      { path: '/', element: <Home /> },
      { path: '/scan/:uuid', element: <Scan /> },
    ], { initialEntries: ['/'] })

    render(<RouterProvider router={router} />)

    const input = screen.getByPlaceholderText(/URL, IP, domain, or hash/i)
    fireEvent.change(input, { target: { value: 'http://example.com' } })

    const btn = screen.getByRole('button', { name: /Analyze/i })
    fireEvent.click(btn)

    await waitFor(() => expect(router.state.location.pathname).toMatch(/\/scan\/abc123/))
    fetchMock.mockRestore()
  })
})