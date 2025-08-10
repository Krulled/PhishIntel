import React, { useEffect, useState, useRef } from 'react'
import { getUrlscanScreenshotBlob, getScreenshotBoxes, isLikelyImageUrl, type BoxesResponse } from '../services/apiClient'
import { computeOverlayRects, applyOverlayTransform } from '../utils/overlayMath'

interface UrlscanScreenshotProps {
  scanId?: string | null
}

interface Box {
  x: number
  y: number
  w: number
  h: number
  tag: string
}

export default function UrlscanScreenshot({ scanId }: UrlscanScreenshotProps) {
  const [blobUrl, setBlobUrl] = useState<string>()
  const [pastedUrl, setPastedUrl] = useState('')
  const [loading, setLoading] = useState<boolean>(!!scanId)
  const [error, setError] = useState<string>()
  const [boxes, setBoxes] = useState<Box[]>([])
  const [imageNaturalSize, setImageNaturalSize] = useState<{width: number, height: number} | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    let alive = true
    let currentBlobUrl: string | undefined

    const fetchScreenshot = async () => {
      if (!scanId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(undefined)
      setBoxes([])

      try {
        // Fetch screenshot and boxes in parallel
        const [blob, boxesResponse] = await Promise.all([
          getUrlscanScreenshotBlob(scanId),
          getScreenshotBoxes(scanId)
        ])
        
        if (!alive) return

        if (blob) {
          const url = URL.createObjectURL(blob)
          currentBlobUrl = url
          setBlobUrl(url)
          setError(undefined)
          
          // Set boxes if available
          if (boxesResponse?.boxes) {
            setBoxes(boxesResponse.boxes)
          }
        } else {
          setError('not_found')
        }
      } catch (err) {
        if (!alive) return
        setError('fetch_failed')
      } finally {
        if (alive) {
          setLoading(false)
        }
      }
    }

    fetchScreenshot()

    return () => {
      alive = false
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl)
      }
    }
  }, [scanId])

  // Clean up blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [blobUrl])

  const showFallback = !loading && !blobUrl

  const handleUsePastedUrl = () => {
    if (isLikelyImageUrl(pastedUrl)) {
      setBlobUrl(pastedUrl)
      setError(undefined)
      setBoxes([]) // Clear boxes for pasted URLs since we can't analyze them
    }
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setImageNaturalSize({
      width: img.naturalWidth,
      height: img.naturalHeight
    })
  }

  // Calculate scaling factor between display size and natural size for overlay positioning
  const getScalingFactor = () => {
    if (!imageRef.current || !imageNaturalSize) return { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 }
    
    const displayRect = imageRef.current.getBoundingClientRect()
    const containerRect = imageRef.current.parentElement?.getBoundingClientRect()
    
    if (!containerRect) return { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 }
    
    return computeOverlayRects(imageNaturalSize, { width: displayRect.width, height: displayRect.height }, { width: containerRect.width, height: containerRect.height })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUsePastedUrl()
    }
  }

  const handleImageClick = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank')
    }
  }

  // Focus input when fallback is shown
  useEffect(() => {
    if (showFallback && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showFallback])

  return (
    <section 
      data-testid="urlscan-screenshot-card" 
      className="rounded-2xl border border-zinc-700/50 bg-zinc-900/40 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">URLScan Screenshot</h3>
        {blobUrl && (
          <span className="text-xs text-zinc-400">Click to open full-size</span>
        )}
      </div>

      {loading && (
        <div 
          className="animate-pulse h-48 rounded-lg bg-zinc-800/50" 
          aria-label="Loading screenshot..."
        />
      )}

      {!loading && blobUrl && (
        <div className="relative">
          <img
            ref={imageRef}
            src={blobUrl}
            alt={`URLScan screenshot for ${scanId || 'pasted URL'}`}
            className="mx-auto max-h-[520px] w-full object-contain cursor-zoom-in rounded-lg border border-zinc-700/30"
            onClick={handleImageClick}
            title="Open full-size screenshot"
            onLoad={handleImageLoad}
            onError={() => {
              setError('image_load_failed')
              setBlobUrl(undefined)
            }}
          />
          
          {/* AI-detected suspicious element overlays */}
          {boxes.length > 0 && imageNaturalSize && (
            <div className="absolute inset-0 pointer-events-none">
              {boxes.map((box, index) => {
                const transform = getScalingFactor()
                const position = applyOverlayTransform(box, transform)
                
                return (
                  <div
                    key={index}
                    className="absolute border-2 border-red-500 bg-red-500/10"
                    style={{
                      left: `${position.left}px`,
                      top: `${position.top}px`,
                      width: `${position.width}px`,
                      height: `${position.height}px`,
                    }}
                  >
                    <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-1 py-0.5 rounded whitespace-nowrap max-w-[120px] truncate">
                      {box.tag}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {showFallback && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400">
            Couldn't load screenshot automatically. Paste the screenshot URL from URLScan findings.
          </p>
          
          <div className="flex gap-2">
            <input
              ref={inputRef}
              className="flex-1 rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="https://urlscan.io/screenshots/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.png"
              value={pastedUrl}
              onChange={e => setPastedUrl(e.target.value.trim())}
              onKeyPress={handleKeyPress}
              aria-label="Paste screenshot URL from URLScan"
            />
            <button
              className="rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={!isLikelyImageUrl(pastedUrl)}
              onClick={handleUsePastedUrl}
            >
              Use URL
            </button>
          </div>

          <p className="text-xs text-zinc-500">
            💡 Open URLScan result, copy the 'screenshot' link, and paste it here.
          </p>

          {error === 'not_found' && (
            <p className="text-xs text-red-400">
              No screenshot found for this scan. You can paste a direct URL above.
            </p>
          )}

          {error === 'fetch_failed' && (
            <p className="text-xs text-red-400">
              Failed to fetch screenshot. Check your connection or paste a direct URL above.
            </p>
          )}

          {error === 'image_load_failed' && (
            <p className="text-xs text-red-400">
              Failed to load the image. Please check the URL and try again.
            </p>
          )}
        </div>
      )}
    </section>
  )
}