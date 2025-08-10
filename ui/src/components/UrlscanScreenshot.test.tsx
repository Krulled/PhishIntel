import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import UrlscanScreenshot from './UrlscanScreenshot'

// Mock the API client
vi.mock('../services/apiClient', () => ({
  getScreenshotAnnotations: vi.fn()
}))

// Mock global fetch
global.fetch = vi.fn()

describe('UrlscanScreenshot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('renders loading state initially', () => {
    render(<UrlscanScreenshot scanId="test-scan-id" />)
    expect(screen.getByText('Loading screenshot...')).toBeInTheDocument()
  })

  it('renders screenshot when fetch succeeds', async () => {
    const mockBlob = new Blob(['fake image data'], { type: 'image/png' })
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob)
    })

    const { getScreenshotAnnotations } = await import('../services/apiClient')
    ;(getScreenshotAnnotations as any).mockResolvedValueOnce(null)

    render(<UrlscanScreenshot scanId="test-scan-id" />)

    await waitFor(() => {
      expect(screen.getByAltText('URLScan website screenshot')).toBeInTheDocument()
    })
  })

  it('renders error message when fetch fails', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    const { getScreenshotAnnotations } = await import('../services/apiClient')
    ;(getScreenshotAnnotations as any).mockResolvedValueOnce(null)

    render(<UrlscanScreenshot scanId="test-scan-id" />)

    await waitFor(() => {
      expect(screen.getByText('No screenshot available for this scan')).toBeInTheDocument()
    })
  })

  it('shows AI annotation indicator when annotations are present', async () => {
    const mockBlob = new Blob(['fake image data'], { type: 'image/png' })
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob)
    })

    const mockAnnotations = {
      image: { width: 1280, height: 720 },
      boxes: [
        { x: 100, y: 100, w: 200, h: 150, tag: 'Fake Login' }
      ],
      model: 'gpt-4o-mini',
      version: 'v1'
    }

    const { getScreenshotAnnotations } = await import('../services/apiClient')
    ;(getScreenshotAnnotations as any).mockResolvedValueOnce(mockAnnotations)

    render(<UrlscanScreenshot scanId="test-scan-id" />)

    await waitFor(() => {
      expect(screen.getByText('(AI Annotated)')).toBeInTheDocument()
      expect(screen.getByText('AI detected 1 potentially suspicious element')).toBeInTheDocument()
    })
  })

  it('handles no scan ID gracefully', async () => {
    render(<UrlscanScreenshot scanId="" />)

    await waitFor(() => {
      expect(screen.getByText('No scan ID provided')).toBeInTheDocument()
    })
  })
})
