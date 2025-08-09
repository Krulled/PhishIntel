import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import UrlscanScreenshot from './UrlscanScreenshot'

describe('UrlscanScreenshot', () => {
  const origFetch = global.fetch
  const origCreateObjectURL = global.URL.createObjectURL
  const origRevokeObjectURL = global.URL.revokeObjectURL

  beforeEach(() => {
    // @ts-ignore
    global.fetch = vi.fn()
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    global.fetch = origFetch
    global.URL.createObjectURL = origCreateObjectURL
    global.URL.revokeObjectURL = origRevokeObjectURL
    vi.restoreAllMocks()
  })

  it('shows loading state initially', () => {
    render(<UrlscanScreenshot scanId="test-scan-id" />)
    expect(screen.getByText(/loading screenshot/i)).toBeInTheDocument()
  })

  it('displays image on successful fetch', async () => {
    const mockBlob = new Blob(['fake image data'], { type: 'image/png' })
    
    // @ts-ignore
    global.fetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob)
    })

    render(<UrlscanScreenshot scanId="test-scan-id" />)
    
    await waitFor(() => {
      expect(screen.getByAltText(/urlscan website screenshot/i)).toBeInTheDocument()
    })
    
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob)
  })

  it('shows error message on 404', async () => {
    // @ts-ignore
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    render(<UrlscanScreenshot scanId="test-scan-id" />)
    
    await waitFor(() => {
      expect(screen.getByText(/no screenshot available/i)).toBeInTheDocument()
    })
  })

  it('shows generic error on fetch failure', async () => {
    // @ts-ignore
    global.fetch.mockRejectedValueOnce(new Error('Network error'))

    render(<UrlscanScreenshot scanId="test-scan-id" />)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load screenshot/i)).toBeInTheDocument()
    })
  })

  it('shows error when no scan ID provided', async () => {
    render(<UrlscanScreenshot scanId="" />)
    
    await waitFor(() => {
      expect(screen.getByText(/no scan id provided/i)).toBeInTheDocument()
    })
  })
})