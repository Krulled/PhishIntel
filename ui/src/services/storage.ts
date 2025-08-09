import type { AnalysisResponse } from './apiClient'

const RECENT_KEY = 'phishintel:recent'
const PREFIX = 'phishintel:result:'

function getRecentList(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const list = raw ? JSON.parse(raw) as string[] : []
    return Array.isArray(list) ? list : []
  } catch { return [] }
}

function setRecentList(list: string[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 10))) } catch {}
}

export function saveResult(result: AnalysisResponse) {
  try {
    localStorage.setItem(PREFIX + result.uuid, JSON.stringify(result))
    const list = getRecentList().filter(id => id !== result.uuid)
    list.unshift(result.uuid)
    setRecentList(list)
  } catch {}
}

export function getCached(uuid: string): AnalysisResponse | null {
  try {
    const raw = localStorage.getItem(PREFIX + uuid)
    return raw ? JSON.parse(raw) as AnalysisResponse : null
  } catch { return null }
}

export function getRecent(n = 5): { uuid: string; verdict: string; submitted: string }[] {
  return getRecentList().slice(0, n).map((id) => {
    const cached = getCached(id)
    return { uuid: id, verdict: cached?.verdict || 'Safe', submitted: cached?.submitted || '' }
  })
}