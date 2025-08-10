import React, { useState, useEffect, useRef } from 'react'
import { getScreenshotAnnotations, type ScreenshotAnnotation } from '../services/apiClient'

interface UrlscanScreenshotProps {
  scanId: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function UrlscanScreenshot({ scanId }: UrlscanScreenshotProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [annotations, setAnnotations] = useState<ScreenshotAnnotation | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      if (!scanId) {
        setError('No scan ID provided')
        setLoading(false)
        return
      }

      try {
        // Fetch screenshot and annotations in parallel
        const [screenshotResponse, annotationsData] = await Promise.all([
          fetch(`${API_BASE_URL}/api/urlscan/${scanId}/screenshot`),
          getScreenshotAnnotations(scanId)
        ])
        
        if (!cancelled) {
          // Handle screenshot
          if (screenshotResponse.ok) {
            const blob = await screenshotResponse.blob()
            const objectUrl = URL.createObjectURL(blob)
            setImageUrl(objectUrl)
            setError(null)
          } else if (screenshotResponse.status === 404) {
            setError('No screenshot available for this scan')
          } else {
            setError('Failed to load screenshot')
          }

          // Handle annotations
          setAnnotations(annotationsData)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load screenshot')
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
      // Clean up object URL to prevent memory leaks
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [scanId])

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    })
  }

  const openInNewTab = () => {
    if (imageUrl) {
      window.open(imageUrl, '_blank')
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium">
          URLScan Screenshot
          {annotations && annotations.boxes.length > 0 && (
            <span className="ml-2 text-xs text-orange-400">(AI Annotated)</span>
          )}
        </div>
        {imageUrl && (
          <button
            onClick={openInNewTab}
            className="text-xs text-gray-400 hover:text-white transition-colors"
            title="Open in new tab"
          >
            🔍 Zoom
          </button>
        )}
      </div>
      
      <div 
        ref={containerRef}
        className="relative aspect-video w-full rounded border border-white/5 bg-white/5 overflow-hidden"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading screenshot...</span>
            </div>
          </div>
        )}
        
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-sm text-gray-400">
              <div className="mb-2">📸</div>
              <div>{error}</div>
            </div>
          </div>
        )}
        
        {imageUrl && !loading && !error && (
          <>
            <img
              ref={imageRef}
              src={imageUrl}
              alt="URLScan website screenshot"
              className="w-full h-full object-contain"
              onLoad={handleImageLoad}
              onError={() => {
                setError('Failed to display screenshot')
                setImageUrl(null)
              }}
            />
            
            {/* AI Annotations Overlay */}
            {annotations && annotations.boxes.length > 0 && imageDimensions && containerRef.current && imageRef.current && (
              <div className="absolute inset-0 pointer-events-none">
                {annotations.boxes.map((box, index) => {
                  // Get container dimensions
                  const containerRect = containerRef.current!.getBoundingClientRect()
                  const containerWidth = containerRect.width
                  const containerHeight = containerRect.height

                  // Calculate object-contain scaling
                  const scaleX = containerWidth / imageDimensions.width
                  const scaleY = containerHeight / imageDimensions.height
                  const scale = Math.min(scaleX, scaleY)

                  // Calculate actual displayed image dimensions
                  const displayWidth = imageDimensions.width * scale
                  const displayHeight = imageDimensions.height * scale

                  // Calculate offsets for centering (object-contain behavior)
                  const offsetX = (containerWidth - displayWidth) / 2
                  const offsetY = (containerHeight - displayHeight) / 2

                  // Scale and position the box
                  const scaledX = box.x * scale + offsetX
                  const scaledY = box.y * scale + offsetY
                  const scaledWidth = box.w * scale
                  const scaledHeight = box.h * scale

                  return (
                    <div
                      key={index}
                      className="absolute border-2 border-red-500 backdrop-blur-[1px]"
                      style={{
                        left: `${scaledX}px`,
                        top: `${scaledY}px`,
                        width: `${scaledWidth}px`,
                        height: `${scaledHeight}px`,
                      }}
                    >
                      <div className="absolute -top-6 left-0 rounded bg-red-500 px-1 py-0.5 text-[10px] text-white shadow-lg whitespace-nowrap">
                        {box.tag}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
      
      {annotations && annotations.boxes.length > 0 && (
        <div className="mt-2 text-xs text-gray-400">
          AI detected {annotations.boxes.length} potentially suspicious element{annotations.boxes.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
