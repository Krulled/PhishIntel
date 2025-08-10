import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UrlscanScreenshot from './UrlscanScreenshot'

// Mock the API client
vi.mock('../services/apiClient', () => ({
  getUrlscanScreenshotBlob: vi.fn(),
  getScreenshotBoxes: vi.fn(),
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
    const { getUrlscanScreenshotBlob, getScreenshotBoxes } = await import('../services/apiClient')
    const mockBlob = new Blob(['fake image data'], { type: 'image/png' })
    ;(getUrlscanScreenshotBlob as any).mockResolvedValueOnce(mockBlob)
    ;(getScreenshotBoxes as any).mockResolvedValueOnce(null)

    render(<UrlscanScreenshot scanId="test-scan-id" />)

    await waitFor(() => {
      expect(screen.getByAltText(/URLScan screenshot for test-scan-id/)).toBeInTheDocument()
    })

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob)
  })

  it('renders overlay boxes when screenshot boxes API returns data', async () => {
    const { getUrlscanScreenshotBlob, getScreenshotBoxes } = await import('../services/apiClient')
    const mockBlob = new Blob(['fake image data'], { type: 'image/png' })
    const mockBoxes = {
      image: { width: 1280, height: 720 },
      boxes: [
        { x: 100, y: 200, w: 150, h: 50, tag: 'Login form' },
        { x: 300, y: 400, w: 100, h: 30, tag: 'Download' }
      ],
      model: 'gpt-4o-mini',
      version: 'v1'
    }
    ;(getUrlscanScreenshotBlob as any).mockResolvedValueOnce(mockBlob)
    ;(getScreenshotBoxes as any).mockResolvedValueOnce(mockBoxes)

    render(<UrlscanScreenshot scanId="test-scan-id" />)

    let image: HTMLImageElement
    await waitFor(() => {
      image = screen.getByAltText(/URLScan screenshot for test-scan-id/) as HTMLImageElement
      expect(image).toBeInTheDocument()
    })

    // Simulate image load with natural dimensions
    Object.defineProperty(image!, 'naturalWidth', { value: 1280, configurable: true })
    Object.defineProperty(image!, 'naturalHeight', { value: 720, configurable: true })
    
    // Mock getBoundingClientRect for scaling calculations
    image!.getBoundingClientRect = vi.fn(() => ({
      width: 640,
      height: 360,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 360,
      right: 640,
      toJSON: () => {}
    }))
    
    const parentElement = image!.parentElement!
    parentElement.getBoundingClientRect = vi.fn(() => ({
      width: 700,
      height: 400,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 400,
      right: 700,
      toJSON: () => {}
    }))

    // Trigger the load event
    fireEvent.load(image!)

    // Check for overlay elements with tags
    await waitFor(() => {
      expect(screen.getByText('Login form')).toBeInTheDocument()
      expect(screen.getByText('Download')).toBeInTheDocument()
    })
  })

  it('shows fallback form when API fails', async () => {
    const { getUrlscanScreenshotBlob, getScreenshotBoxes } = await import('../services/apiClient')
    ;(getUrlscanScreenshotBlob as any).mockResolvedValueOnce(null)
    ;(getScreenshotBoxes as any).mockResolvedValueOnce(null)

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
    ;(isLikelyImageUrl as any).mockImplementation((url: string) => {
      return url.includes('urlscan.io/screenshots') && url.includes('.png')
    })

    render(<UrlscanScreenshot scanId={null} />)
    
    const input = screen.getByLabelText(/Paste screenshot URL from URLScan/)
    const button = screen.getByRole('button', { name: /Use URL/ })
    
    expect(button).toBeDisabled()
    
    await userEvent.type(input, 'https://urlscan.io/screenshots/test.png')
    
    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })
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
    const { getUrlscanScreenshotBlob, getScreenshotBoxes } = await import('../services/apiClient')
    const mockBlob = new Blob(['fake image data'], { type: 'image/png' })
    ;(getUrlscanScreenshotBlob as any).mockResolvedValueOnce(mockBlob)
    ;(getScreenshotBoxes as any).mockResolvedValueOnce(null)

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
    const { getUrlscanScreenshotBlob, getScreenshotBoxes } = await import('../services/apiClient')
    ;(getUrlscanScreenshotBlob as any).mockResolvedValueOnce(null)
    ;(getScreenshotBoxes as any).mockResolvedValueOnce(null)

    render(<UrlscanScreenshot scanId="test-scan-id" />)

    await waitFor(() => {
      expect(screen.getByText(/No screenshot found for this scan/)).toBeInTheDocument()
    })
  })
})