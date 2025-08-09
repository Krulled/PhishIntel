import React, { useEffect, useState } from 'react'
import { getUrlscanScreenshot } from '../services/apiClient'

interface EvidenceScreenshotProps {
  scanId: string
}

export default function EvidenceScreenshot({ scanId }: EvidenceScreenshotProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    const fetchScreenshot = async () => {
      try {
        const blob = await getUrlscanScreenshot(scanId)
        if (blob && !cancelled) {
          objectUrl = URL.createObjectURL(blob)
          setImageUrl(objectUrl)
          setError(false)
        } else if (!cancelled) {
          setError(true)
        }
      } catch (err) {
        if (!cancelled) {
          setError(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchScreenshot()

    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [scanId])

  const handleImageClick = () => {
    if (imageUrl) {
      window.open(imageUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900/40 p-4">
        <div className="text-sm font-semibold text-zinc-200 mb-3">Evidence Screenshot</div>
        <div className="animate-pulse h-48 rounded-lg bg-zinc-800/50" role="status" aria-label="Loading screenshot" />
      </div>
    )
  }

  if (error || !imageUrl) {
    return (
      <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900/40 p-4">
        <div className="text-sm font-semibold text-zinc-200 mb-3">Evidence Screenshot</div>
        <div className="h-48 rounded-lg bg-zinc-800/20 flex items-center justify-center">
          <p className="text-sm text-zinc-400">No screenshot available for this scan.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900/40 p-4">
      <div className="text-sm font-semibold text-zinc-200 mb-3">Evidence Screenshot</div>
      <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-800/20 cursor-pointer" onClick={handleImageClick}>
        <img 
          src={imageUrl} 
          alt="URLScan evidence screenshot"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  )
}