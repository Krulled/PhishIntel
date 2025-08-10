import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'

describe('Home', () => {
  it('renders single URL input and Analyze button', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )

    // Check for URL input
    const input = screen.getByPlaceholderText(/enter url to analyze/i)
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('inputmode', 'url')

    // Check for Analyze button - get the one from the form specifically
    const form = screen.getByRole('form')
    const button = within(form).getByRole('button', { name: /analyze/i })
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled() // Should be disabled when input is empty
  })

  it('displays live activity feed components', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )

    // Check for live stats - use getAllByText to handle multiple occurrences
    expect(screen.getAllByText(/live/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/scans\/min/i)).toBeInTheDocument()

    // Check for recent scans ticker
    expect(screen.getByText(/recent scans/i)).toBeInTheDocument()
  })

  it('does not show old option pickers', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )

    // Verify no file upload or other option pickers are present
    expect(screen.queryByText(/file/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/search/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /upload/i })).not.toBeInTheDocument()
  })

  it('shows PHISHINTEL branding and description', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )

    expect(screen.getAllByText('PHISHINTEL').length).toBeGreaterThan(0)
    expect(screen.getByText(/analyze urls for phishing threats/i)).toBeInTheDocument()
  })
})
