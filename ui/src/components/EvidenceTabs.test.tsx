import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EvidenceTabs from './EvidenceTabs'
import type { SafeAnalysisResult } from '../services/analyzer'

const mockData: SafeAnalysisResult = {
  url: 'https://example.com',
  verdict: 'Safe',
  risk: 'low',
  timestamp: '2023-01-01T00:00:00Z',
  redirects: [],
  ssl: { issuer: 'Test CA', validFrom: '2023-01-01', validTo: '2024-01-01' },
  dns: { a: ['192.168.1.1'], ns: ['ns1.example.com'] },
  whois: { registrar: 'Test Registrar', created: '2020-01-01' },
  headers: {},
  contentSignals: [],
  phish_detection: 'no',
  ai_reasoning: 'Safe website',
  findings: []
}

describe('EvidenceTabs', () => {
  it('renders all expected tabs except Raw JSON', () => {
    render(<EvidenceTabs data={mockData} />)
    
    // Check that expected tabs are present
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /ai analysis/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /redirects/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /dns & ssl/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /headers/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /content/i })).toBeInTheDocument()
  })

  it('does NOT render Raw JSON tab', () => {
    render(<EvidenceTabs data={mockData} />)
    
    // Assert that Raw JSON tab does not exist
    expect(screen.queryByRole('tab', { name: /raw json/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /json/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/raw json/i)).not.toBeInTheDocument()
  })

  it('renders AI analysis content by default', () => {
    render(<EvidenceTabs data={mockData} />)
    
    // The overview tab should be active by default
    expect(screen.getByText(/risk rationale and summary/i)).toBeInTheDocument()
  })
})