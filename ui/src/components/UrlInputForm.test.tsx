import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Home from '../routes/Home'

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
    render(<MemoryRouter><Home /></MemoryRouter>)
    const form = screen.getAllByRole('form')[0]
    const scope = within(form)
    await userEvent.click(scope.getByRole('button', { name: /analyze/i }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/Please enter a valid URL/i)
  })

  it('disables button when input is empty', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    const form = screen.getByRole('form')
    const button = within(form).getByRole('button', { name: /analyze/i })
    expect(button).toBeDisabled()
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'https://example.com')
    expect(button).not.toBeDisabled()
  })
})