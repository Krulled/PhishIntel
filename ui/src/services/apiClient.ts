import { backendHealthService } from './backendHealth';

export type Verdict = 'Safe' | 'Suspicious' | 'Malicious'

export type ScanResult = {
  status: string
  verdict: Verdict
  uuid: string
  submitted: string
  normalized: string
  redirect_chain: string[]
  final_url: string
  whois: { registrar: string; created: string; updated: string; expires: string; country: string }
  ssl: { issuer: string; valid_from: string; valid_to: string; sni: string }
  domain_age_days: number
  ip: string
  asn: string

  detections: Record<string, unknown>
  blacklists: string[]
  heuristics: Record<string, { pass?: boolean; score?: number } | unknown>
  model_explanations: string[]
  risk_score: number
  error?: string
}

export type ScreenshotAnnotation = {
  image: { width: number; height: number }
  boxes: Array<{
    x: number
    y: number
    w: number
    h: number
    tag: string
  }>
  model: string
  version: string
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function toCurl(url: string, body: unknown): string {
  return `curl -sS -X POST '${url}' -H 'Content-Type: application/json' --data '${JSON.stringify(body)}'`
}

async function doFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init })
}

export async function analyze(inputValue: string): Promise<{ result: ScanResult; curl: string }>{
  // Wait for backend to be healthy before making request
  const isHealthy = await backendHealthService.waitForHealthy(30000); // 30 second timeout
  if (!isHealthy) {
    throw new Error('Backend service is unavailable. Please try again later.');
  }
  
  const endpoint = `${API_BASE_URL}/analyze`
  const payload = { input: inputValue }
  const curl = toCurl(endpoint, payload)

  // First attempt
  try {
    const res = await doFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(90000),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`)
    }
    const data = (await res.json()) as ScanResult
    return { result: data, curl }
  } catch (err) {
    // Retry once
    try {
      const res = await doFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(90000),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`)
      }
      const data = (await res.json()) as ScanResult
      return { result: data, curl }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Network error'
      const fallback: ScanResult = {
        status: 'error',
        verdict: 'Safe',
        uuid: '',
        submitted: new Date().toISOString(),
        normalized: inputValue,
        redirect_chain: [],
        final_url: inputValue,
        whois: { registrar: '', created: '', updated: '', expires: '', country: '' },
        ssl: { issuer: '', valid_from: '', valid_to: '', sni: '' },
        domain_age_days: 0,
        ip: '',
        asn: '',

        detections: {},
        blacklists: [],
        heuristics: {},
        model_explanations: [],
        risk_score: 0,
        error: message,
      }
      throw Object.assign(new Error(message), { curl, result: fallback })
    }
  }
}

export async function getScan(uuid: string): Promise<ScanResult | null> {
  const res = await doFetch(`${API_BASE_URL}/api/scan/${uuid}`)
  if (res.ok) return (await res.json()) as ScanResult
  return null
}

export async function fetchRecentRemote(): Promise<string[]> {
  try {
    const res = await doFetch(`${API_BASE_URL}/api/recent`)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data?.uuids) ? data.uuids : []
  } catch {
    return []
  }
}

export function saveRecent(uuid: string) {
  const key = 'phishintel_recent_uuids'
  const list = JSON.parse(localStorage.getItem(key) || '[]') as string[]
  const next = [uuid, ...list.filter((u) => u !== uuid)].slice(0, 10)
  localStorage.setItem(key, JSON.stringify(next))
}

export function getRecent(): string[] {
  const key = 'phishintel_recent_uuids'
  return JSON.parse(localStorage.getItem(key) || '[]') as string[]
}

export async function getUrlscanScreenshotBlob(scanId: string): Promise<Blob | null> {
  try {
    const res = await doFetch(`${API_BASE_URL}/api/urlscan/${scanId}/screenshot`)
    if (res.ok && res.headers.get('content-type')?.includes('image')) {
      return await res.blob()
    }
    return null
  } catch {
    return null
  }
}

// Backward compatibility
export const getUrlscanScreenshot = getUrlscanScreenshotBlob

export function isLikelyImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  const trimmed = url.trim()
  if (!trimmed.startsWith('http')) return false
  
  // Check for common image extensions
  const hasImageExtension = /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(trimmed)
  
  // Check for URLScan screenshot pattern
  const isUrlscanScreenshot = trimmed.includes('/screenshots/') || trimmed.includes('urlscan.io')
  
  return hasImageExtension || isUrlscanScreenshot
}

export async function getScreenshotNotes(scanId: string): Promise<string[]> {
  try {
    const res = await doFetch(`${API_BASE_URL}/api/ai/screenshot-notes/${scanId}`)
    if (res.status === 204 || !res.ok) {
      return [] // No notes available
    }
    const data = await res.json()
    return Array.isArray(data?.notes) ? data.notes : []
  } catch {
    return []
  }
}

export type BoxesResponse = {
  image: { width: number; height: number }
  boxes: Array<{
    x: number
    y: number
    w: number
    h: number
    tag: string
  }>
  model: string
  version: string
}

export async function getScreenshotBoxes(scanId: string): Promise<BoxesResponse | null> {
  try {
    const res = await doFetch(`${API_BASE_URL}/api/ai/screenshot-boxes/${scanId}`)
    if (res.status === 204 || !res.ok) {
      return null // No boxes available
    }
    return (await res.json()) as BoxesResponse
  } catch {
    return null
  }
}

export async function getScreenshotAnnotations(scanId: string): Promise<ScreenshotAnnotation | null> {
  try {
    const res = await doFetch(`${API_BASE_URL}/api/ai/annotate_screenshot/${scanId}`)
    if (res.status === 204) {
      return null // No annotations available
    }
    if (res.ok) {
      return (await res.json()) as ScreenshotAnnotation
    }
    return null
  } catch {
    return null
  }
}

export async function getUrlscanSummary(uuid: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/urlscan/${uuid}/summary`);
    
    if (response.status === 204) {
      return null;
    }
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.summary || null;
  } catch (error) {
    console.error('Failed to fetch URLScan summary:', error);
    return null;
  }
}