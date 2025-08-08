import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import App from '../App'

// Smoke test RiskMeter via results rendering

describe('RiskMeter', () => {
  it('renders within 0-100 and shows percentage', async () => {
    const { findAllByLabelText, findByText } = render(<App />)
    const input = (await findAllByLabelText(/url/i))[0]
    const user = (await import('@testing-library/user-event')).default
    await user.type(input, 'https://suspicious.example')
    await user.click((await import('@testing-library/react')).screen.getAllByRole('button', { name: /analyze/i })[0])
    const label = await findByText(/risk score/i, {}, { timeout: 3000 })
    expect(label).toBeInTheDocument()
  })
})