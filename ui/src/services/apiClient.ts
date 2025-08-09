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
  geolocation: { country: string; region: string; city: string }
  detections: Record<string, unknown>
  blacklists: string[]
  heuristics: Record<string, { pass?: boolean; score?: number } | unknown>
  model_explanations: string[]
  risk_score: number
  error?: string
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE || (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000'

const TOKEN_KEY = 'phishintel_token'

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY) } catch {}
}

function toCurl(url: string, body: unknown): string {
  return `curl -sS -X POST '${url}' -H 'Content-Type: application/json' --data '${JSON.stringify(body)}'`
}

async function doFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const token = getToken()
  const baseHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
  const mergedHeaders = { ...(init?.headers as any), ...baseHeaders }
  return fetch(input, { ...init, headers: mergedHeaders })
}

export async function analyze(inputValue: string): Promise<{ result: ScanResult; curl: string }>{
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
        geolocation: { country: '', region: '', city: '' },
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

export async function login(username: string, password: string): Promise<{ token: string; user: { name: string } } | { error: string }>{
  const endpoint = `${API_BASE_URL}/api/auth/login`
  const res = await doFetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (res.status === 501) {
    return { error: 'auth_disabled' }
  }
  if (!res.ok) {
    try { return await res.json() } catch { return { error: `HTTP_${res.status}` } }
  }
  const data = await res.json()
  try { localStorage.setItem(TOKEN_KEY, data.token) } catch {}
  return data
}