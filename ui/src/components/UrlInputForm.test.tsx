import { describe, it, expect } from 'vitest'
import { render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// Using the embedded UrlInputForm in App for simplicity

describe('UrlInputForm', () => {
  it('shows error for invalid URL and announces via alert', async () => {
    const { getAllByRole } = render(<App />)
    const form = getAllByRole('form', { name: /analyze url/i })[0]
    const scope = within(form)
    await userEvent.click(scope.getByRole('button', { name: /analyze/i }))
    const alert = await scope.findByRole('alert')
    expect(alert).toHaveTextContent(/valid http\(s\) url/i)
  })

  it('accepts a valid URL and triggers analysis', async () => {
    const { getAllByRole, findAllByLabelText } = render(<App />)
    const form = getAllByRole('form', { name: /analyze url/i })[0]
    const input = (await findAllByLabelText(/url/i))[0]
    await userEvent.type(input, 'https://example.com')
    await userEvent.click(within(form).getByRole('button', { name: /analyze/i }))
    // analysis results appear
    expect(await (await import('@testing-library/react')).screen.findByLabelText(/analysis results/i, {}, { timeout: 3000 })).toBeInTheDocument()
  })
})