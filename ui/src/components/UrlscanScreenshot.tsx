import React, { useState, useEffect } from 'react'

interface UrlscanScreenshotProps {
  scanId: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function UrlscanScreenshot({ scanId }: UrlscanScreenshotProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchScreenshot() {
      if (!scanId) {
        setError('No scan ID provided')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/urlscan/${scanId}/screenshot`)
        
        if (!cancelled) {
          if (response.ok) {
            const blob = await response.blob()
            const objectUrl = URL.createObjectURL(blob)
            setImageUrl(objectUrl)
            setError(null)
          } else if (response.status === 404) {
            setError('No screenshot available for this scan')
          } else {
            setError('Failed to load screenshot')
          }
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load screenshot')
          setLoading(false)
        }
      }
    }

    fetchScreenshot()

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

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="mb-2 text-sm font-medium">URLScan Screenshot</div>
      
      <div className="relative aspect-video w-full rounded border border-white/5 bg-white/5 overflow-hidden">
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
          <img
            src={imageUrl}
            alt="URLScan website screenshot"
            className="w-full h-full object-cover"
            onError={() => {
              setError('Failed to display screenshot')
              setImageUrl(null)
            }}
          />
        )}
      </div>
    </div>
  )
}