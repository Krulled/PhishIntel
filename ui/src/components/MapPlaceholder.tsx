import React from 'react'
import type { ScanResult } from '../services/apiClient'

export default function MapPlaceholder({ geolocation }: Pick<ScanResult, 'geolocation'>) {
  const { country, region, city } = geolocation || { country: '', region: '', city: '' }
  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="mb-2 font-medium">Map</div>
      <div className="h-28 w-full rounded bg-white/5 text-center text-xs text-gray-400 flex items-center justify-center">
        Geolocation: {country} {region} {city}
      </div>
    </div>
  )
}