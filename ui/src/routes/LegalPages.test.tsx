import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Terms from './Terms'
import Privacy from './Privacy'
import Security from './Security'

describe('Legal Pages', () => {
  it('renders Terms page with content and back button', () => {
    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>
    )

    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
    expect(screen.getByText(/Last updated: 2025-01-10/i)).toBeInTheDocument()
    expect(screen.getByText(/research and analysis tool/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument()
  })

  it('renders Privacy page with content and back button', () => {
    render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>
    )

    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    expect(screen.getByText(/Last updated: 2025-01-10/i)).toBeInTheDocument()
    expect(screen.getByText(/What We Collect/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument()
  })

  it('renders Security page with content and back button', () => {
    render(
      <MemoryRouter>
        <Security />
      </MemoryRouter>
    )

    expect(screen.getByText('Security Practices')).toBeInTheDocument()
    expect(screen.getByText(/Last updated: 2025-01-10/i)).toBeInTheDocument()
    expect(screen.getByText(/SSRF mitigation/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument()
  })

  it('back to home button navigates to correct path', () => {
    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>
    )

    const backButton = screen.getByRole('link', { name: /back to home/i })
    expect(backButton).toHaveAttribute('href', '/')
  })
})
