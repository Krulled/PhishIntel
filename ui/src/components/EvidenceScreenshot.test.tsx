import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EvidenceScreenshot from './EvidenceScreenshot'
import * as apiClient from '../services/apiClient'

// Mock the apiClient module
vi.mock('../services/apiClient', () => ({
  getUrlscanScreenshot: vi.fn()
}))

describe('EvidenceScreenshot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset URL.createObjectURL and URL.revokeObjectURL mocks
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows loading state initially', () => {
    vi.mocked(apiClient.getUrlscanScreenshot).mockImplementation(() => new Promise(() => {}))
    
    render(<EvidenceScreenshot scanId="test-scan-id" />)
    
    expect(screen.getByText('Evidence Screenshot')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveClass('animate-pulse')
  })

  it('displays screenshot when available', async () => {
    const mockBlob = new Blob(['fake image data'], { type: 'image/png' })
    vi.mocked(apiClient.getUrlscanScreenshot).mockResolvedValue(mockBlob)
    
    render(<EvidenceScreenshot scanId="test-scan-id" />)
    
    await waitFor(() => {
      const img = screen.getByAltText('URLScan evidence screenshot')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'blob:mock-url')
    })
    
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob)
  })

  it('shows empty state when screenshot is not available', async () => {
    vi.mocked(apiClient.getUrlscanScreenshot).mockResolvedValue(null)
    
    render(<EvidenceScreenshot scanId="test-scan-id" />)
    
    await waitFor(() => {
      expect(screen.getByText('No screenshot available for this scan.')).toBeInTheDocument()
    })
  })

  it('opens screenshot in new tab when clicked', async () => {
    const mockBlob = new Blob(['fake image data'], { type: 'image/png' })
    vi.mocked(apiClient.getUrlscanScreenshot).mockResolvedValue(mockBlob)
    window.open = vi.fn()
    
    render(<EvidenceScreenshot scanId="test-scan-id" />)
    
    await waitFor(() => {
      expect(screen.getByAltText('URLScan evidence screenshot')).toBeInTheDocument()
    })
    
    const imageContainer = screen.getByAltText('URLScan evidence screenshot').parentElement
    await userEvent.click(imageContainer!)
    
    expect(window.open).toHaveBeenCalledWith('blob:mock-url', '_blank')
  })

  it('cleans up object URL on unmount', async () => {
    const mockBlob = new Blob(['fake image data'], { type: 'image/png' })
    vi.mocked(apiClient.getUrlscanScreenshot).mockResolvedValue(mockBlob)
    
    const { unmount } = render(<EvidenceScreenshot scanId="test-scan-id" />)
    
    await waitFor(() => {
      expect(screen.getByAltText('URLScan evidence screenshot')).toBeInTheDocument()
    })
    
    unmount()
    
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})