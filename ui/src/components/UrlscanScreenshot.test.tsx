import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UrlscanScreenshot from './UrlscanScreenshot'

// Mock the API client
vi.mock('../services/apiClient', () => ({
  getUrlscanScreenshotBlob: vi.fn(),
  isLikelyImageUrl: vi.fn()
}))

// Mock global URL methods
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

describe('UrlscanScreenshot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders with stable data-testid', () => {
    render(<UrlscanScreenshot scanId="test-scan-id" />)
    expect(screen.getByTestId('urlscan-screenshot-card')).toBeInTheDocument()
  })

  it('shows loading state initially when scanId is provided', () => {
    render(<UrlscanScreenshot scanId="test-scan-id" />)
    expect(screen.getByLabelText('Loading screenshot...')).toBeInTheDocument()
  })

  it('renders screenshot when API succeeds', async () => {
    const { getUrlscanScreenshotBlob } = await import('../services/apiClient')
    const mockBlob = new Blob(['fake image data'], { type: 'image/png' })
    ;(getUrlscanScreenshotBlob as any).mockResolvedValueOnce(mockBlob)

    render(<UrlscanScreenshot scanId="test-scan-id" />)

    await waitFor(() => {
      expect(screen.getByAltText(/URLScan screenshot for test-scan-id/)).toBeInTheDocument()
    })

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob)
  })

  it('shows fallback form when API fails', async () => {
    const { getUrlscanScreenshotBlob } = await import('../services/apiClient')
    ;(getUrlscanScreenshotBlob as any).mockResolvedValueOnce(null)

    render(<UrlscanScreenshot scanId="test-scan-id" />)

    await waitFor(() => {
      expect(screen.getByText(/Couldn't load screenshot automatically/)).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/Paste screenshot URL from URLScan/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Use URL/ })).toBeInTheDocument()
  })

  it('shows fallback form immediately when no scanId provided', () => {
    render(<UrlscanScreenshot scanId={null} />)
    
    expect(screen.getByText(/Couldn't load screenshot automatically/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Paste screenshot URL from URLScan/)).toBeInTheDocument()
  })

  it('enables Use URL button when valid URL is pasted', async () => {
    const { isLikelyImageUrl } = await import('../services/apiClient')
    ;(isLikelyImageUrl as any).mockReturnValue(true)

    render(<UrlscanScreenshot scanId={null} />)
    
    const input = screen.getByLabelText(/Paste screenshot URL from URLScan/)
    const button = screen.getByRole('button', { name: /Use URL/ })
    
    expect(button).toBeDisabled()
    
    await userEvent.type(input, 'https://urlscan.io/screenshots/test.png')
    
    expect(button).not.toBeDisabled()
  })

  it('displays pasted URL as image when Use URL is clicked', async () => {
    const { isLikelyImageUrl } = await import('../services/apiClient')
    ;(isLikelyImageUrl as any).mockReturnValue(true)

    render(<UrlscanScreenshot scanId={null} />)
    
    const input = screen.getByLabelText(/Paste screenshot URL from URLScan/)
    const button = screen.getByRole('button', { name: /Use URL/ })
    
    await userEvent.type(input, 'https://urlscan.io/screenshots/test.png')
    await userEvent.click(button)
    
    expect(screen.getByAltText(/URLScan screenshot for pasted URL/)).toBeInTheDocument()
  })

  it('supports Enter key to use pasted URL', async () => {
    const { isLikelyImageUrl } = await import('../services/apiClient')
    ;(isLikelyImageUrl as any).mockReturnValue(true)

    render(<UrlscanScreenshot scanId={null} />)
    
    const input = screen.getByLabelText(/Paste screenshot URL from URLScan/)
    
    await userEvent.type(input, 'https://urlscan.io/screenshots/test.png')
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })
    
    expect(screen.getByAltText(/URLScan screenshot for pasted URL/)).toBeInTheDocument()
  })

  it('opens image in new tab when clicked', async () => {
    const { getUrlscanScreenshotBlob } = await import('../services/apiClient')
    const mockBlob = new Blob(['fake image data'], { type: 'image/png' })
    ;(getUrlscanScreenshotBlob as any).mockResolvedValueOnce(mockBlob)

    // Mock window.open
    const mockOpen = vi.fn()
    vi.stubGlobal('open', mockOpen)

    render(<UrlscanScreenshot scanId="test-scan-id" />)

    await waitFor(() => {
      expect(screen.getByAltText(/URLScan screenshot for test-scan-id/)).toBeInTheDocument()
    })

    const image = screen.getByAltText(/URLScan screenshot for test-scan-id/)
    await userEvent.click(image)

    expect(mockOpen).toHaveBeenCalledWith('blob:mock-url', '_blank')
  })

  it('shows error message when screenshot not found', async () => {
    const { getUrlscanScreenshotBlob } = await import('../services/apiClient')
    ;(getUrlscanScreenshotBlob as any).mockResolvedValueOnce(null)

    render(<UrlscanScreenshot scanId="test-scan-id" />)

    await waitFor(() => {
      expect(screen.getByText(/No screenshot found for this scan/)).toBeInTheDocument()
    })
  })
})