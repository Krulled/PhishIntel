import { useState, useEffect } from 'react'

export default function LiveStats() {
  const [scansPerMinute, setScansPerMinute] = useState(342)

  useEffect(() => {
    const updateStats = () => {
      // Generate random scans per minute between 180-480
      const newValue = Math.floor(Math.random() * (480 - 180 + 1)) + 180
      setScansPerMinute(newValue)
    }

    // Update every 8 seconds
    const interval = setInterval(updateStats, 8000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        <span>Live</span>
      </div>
      <span>•</span>
      <span>
        <span className="font-mono text-white">{scansPerMinute}</span> scans/min
      </span>
    </div>
  )
}
