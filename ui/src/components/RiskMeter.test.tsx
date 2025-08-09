import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '../routes/Home'
import { MemoryRouter } from 'react-router-dom'

describe('RiskMeter', () => {
  const origFetch = global.fetch
  beforeEach(() => { /* @ts-ignore */ global.fetch = vi.fn() })
  afterEach(() => { global.fetch = origFetch; vi.restoreAllMocks() })

  it('validates input and shows error for invalid URL', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    const input = screen.getAllByRole('textbox')[0]
    const button = screen.getAllByRole('button', { name: /analyze/i })[0]
    
    const user = (await import('@testing-library/user-event')).default
    await user.type(input, 'invalid-url')
    await user.click(button)
    
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/valid URL/i)
  })
})