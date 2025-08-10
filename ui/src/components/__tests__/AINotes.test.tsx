import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import AINotes from '../AINotes'

// Mock the API client
vi.mock('../../services/apiClient', () => ({
  getScreenshotNotes: vi.fn()
}))

describe('AINotes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders existing notes when provided', () => {
    const notes = ['Fake login form detected', 'Suspicious download button']
    
    render(<AINotes notes={notes} scanId={null} />)
    
    expect(screen.getByText('AI notes')).toBeInTheDocument()
    expect(screen.getByText('Fake login form detected')).toBeInTheDocument()
    expect(screen.getByText('Suspicious download button')).toBeInTheDocument()
  })

  it('is hidden when no notes exist and no scanId provided', () => {
    const { container } = render(<AINotes notes={[]} scanId={null} />)
    
    expect(container.firstChild).toBeNull()
  })

  it('fetches and displays screenshot notes when scanId is provided', async () => {
    const { getScreenshotNotes } = await import('../../services/apiClient')
    const existingNotes = ['Existing analysis note']
    const screenshotNotes = ['Login prompt', 'Download CTA']
    
    ;(getScreenshotNotes as any).mockResolvedValueOnce(screenshotNotes)
    
    render(<AINotes notes={existingNotes} scanId="test-scan-id" />)
    
    // Should show existing notes immediately
    expect(screen.getByText('AI notes')).toBeInTheDocument()
    expect(screen.getByText('Existing analysis note')).toBeInTheDocument()
    
    // Should show loading state
    expect(screen.getByText(/loading screenshot analysis/)).toBeInTheDocument()
    
    // Should merge screenshot notes after loading
    await waitFor(() => {
      expect(screen.getByText('Login prompt')).toBeInTheDocument()
      expect(screen.getByText('Download CTA')).toBeInTheDocument()
    })
    
    // Loading indicator should disappear
    expect(screen.queryByText(/loading screenshot analysis/)).not.toBeInTheDocument()
  })

  it('deduplicates similar notes between textual and screenshot analysis', async () => {
    const { getScreenshotNotes } = await import('../../services/apiClient')
    const existingNotes = ['Login form detected', 'Urgent action required']
    const screenshotNotes = ['login form', 'Download button', 'urgent action']
    
    ;(getScreenshotNotes as any).mockResolvedValueOnce(screenshotNotes)
    
    render(<AINotes notes={existingNotes} scanId="test-scan-id" />)
    
    await waitFor(() => {
      expect(screen.getByText('Download button')).toBeInTheDocument()
    })
    
    // Should not duplicate similar notes (case-insensitive substring matching)
    expect(screen.getByText('Login form detected')).toBeInTheDocument() // Original
    expect(screen.queryByText('login form')).not.toBeInTheDocument() // Duplicate (substring)
    
    expect(screen.getByText('Urgent action required')).toBeInTheDocument() // Original
    expect(screen.queryByText('urgent action')).not.toBeInTheDocument() // Duplicate (substring)
    
    // Unique note should be added
    expect(screen.getByText('Download button')).toBeInTheDocument()
  })

  it('handles API errors gracefully and still shows existing notes', async () => {
    const { getScreenshotNotes } = await import('../../services/apiClient')
    const existingNotes = ['Existing analysis note']
    
    ;(getScreenshotNotes as any).mockRejectedValueOnce(new Error('API error'))
    
    render(<AINotes notes={existingNotes} scanId="test-scan-id" />)
    
    // Should still show existing notes
    expect(screen.getByText('AI notes')).toBeInTheDocument()
    expect(screen.getByText('Existing analysis note')).toBeInTheDocument()
    
    // Loading should complete
    await waitFor(() => {
      expect(screen.queryByText(/loading screenshot analysis/)).not.toBeInTheDocument()
    })
    
    // Should not crash or show error message
    expect(screen.getByText('Existing analysis note')).toBeInTheDocument()
  })

  it('shows only screenshot notes when no existing notes provided', async () => {
    const { getScreenshotNotes } = await import('../../services/apiClient')
    const screenshotNotes = ['Phishing attempt detected', 'Fake SSL warning']
    
    ;(getScreenshotNotes as any).mockResolvedValueOnce(screenshotNotes)
    
    render(<AINotes notes={[]} scanId="test-scan-id" />)
    
    await waitFor(() => {
      expect(screen.getByText('Phishing attempt detected')).toBeInTheDocument()
      expect(screen.getByText('Fake SSL warning')).toBeInTheDocument()
    })
  })

  it('is hidden when API returns empty screenshot notes and no existing notes', async () => {
    const { getScreenshotNotes } = await import('../../services/apiClient')
    
    ;(getScreenshotNotes as any).mockResolvedValueOnce([])
    
    const { container } = render(<AINotes notes={[]} scanId="test-scan-id" />)
    
    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })

  it('handles cleanup when component unmounts during loading', async () => {
    const { getScreenshotNotes } = await import('../../services/apiClient')
    
    // Create a promise that won't resolve immediately
    let resolvePromise: (value: string[]) => void
    const promise = new Promise<string[]>((resolve) => {
      resolvePromise = resolve
    })
    ;(getScreenshotNotes as any).mockReturnValueOnce(promise)
    
    const { unmount } = render(<AINotes notes={[]} scanId="test-scan-id" />)
    
    // Unmount before promise resolves
    unmount()
    
    // Resolve after unmount - should not cause errors
    resolvePromise!(['Late note'])
    
    // Test passes if no errors are thrown
  })

  it('renders with correct accessibility structure', () => {
    const notes = ['Test note']
    
    render(<AINotes notes={notes} scanId={null} />)
    
    // Test essential structure and accessibility
    expect(screen.getByText('AI notes')).toBeInTheDocument()
    
    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()
    
    const listItem = screen.getByRole('listitem')
    expect(listItem).toBeInTheDocument()
    expect(listItem).toHaveTextContent('Test note')
  })
})
