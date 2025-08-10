import { useState, useEffect } from 'react'

interface ScanEntry {
  id: string
  name: string
  riskScore: number
  status: string
  timestamp: number
}

const FIRST_NAMES = ['Ava', 'Liam', 'Noah', 'Emma', 'Mia', 'Lucas', 'Zoe', 'Aiden']
const LAST_NAMES = ['Kim', 'Patel', 'Nguyen', 'Garcia', 'Smith', 'Rossi', 'Müller']
const COUNTRY_FLAGS = ['🇺🇸', '🇬🇧', '🇨🇦', '🇩🇪', '🇫🇷', '🇯🇵', '🇦🇺', '🇸🇪']

function generateRandomScan(): ScanEntry {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  const flag = COUNTRY_FLAGS[Math.floor(Math.random() * COUNTRY_FLAGS.length)]
  const riskScore = Math.floor(Math.random() * 101) // 0-100
  
  let status = 'Safe'
  if (riskScore >= 60) status = 'High Risk'
  else if (riskScore >= 20) status = 'Medium Risk'
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: `${firstName} ${lastName} ${flag}`,
    riskScore,
    status,
    timestamp: Date.now()
  }
}

export default function RecentScansTicker() {
  const [scans, setScans] = useState<ScanEntry[]>([
    generateRandomScan(),
    generateRandomScan(),
    generateRandomScan()
  ])

  useEffect(() => {
    const addNewScan = () => {
      const newScan = generateRandomScan()
      setScans(prev => [newScan, ...prev.slice(0, 7)]) // Keep max 8 items
    }

    // Add new scan every 3-6 seconds
    const getRandomInterval = () => Math.floor(Math.random() * 3000) + 3000
    
    let timeoutId: number
    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        addNewScan()
        scheduleNext()
      }, getRandomInterval())
    }

    scheduleNext()

    return () => clearTimeout(timeoutId)
  }, [])

  const getRiskColor = (score: number) => {
    if (score >= 60) return 'text-red-400 bg-red-500/20'
    if (score >= 20) return 'text-yellow-400 bg-yellow-500/20'
    return 'text-green-400 bg-green-500/20'
  }

  return (
    <div className="w-full">
      <div className="mb-3 text-center text-sm text-gray-400">Recent scans</div>
      <div className="space-y-2 max-h-48 overflow-hidden">
        {scans.map((scan, index) => (
          <div 
            key={scan.id}
            className={`flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm transition-all duration-500 ${
              index === 0 ? 'animate-pulse' : ''
            }`}
            style={{ 
              opacity: Math.max(0.3, 1 - (index * 0.15)),
              transform: `translateY(${index * 2}px)`
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-300">{scan.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRiskColor(scan.riskScore)}`}>
                {scan.riskScore}
              </span>
              <span className="text-xs text-gray-400">{scan.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
