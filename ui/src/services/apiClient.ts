export type AnalysisResponse = {
  status: string
  uuid: string
  submitted: string
  normalized: string | null
  verdict: 'Safe' | 'Suspicious' | 'Malicious'
  risk_score: number
  redirect_chain: string[]
  final_url: string | null
  whois: { registrar: string | null; created: string | null; updated: string | null; expires: string | null; country: string | null }
  ssl: { issuer: string | null; valid_from: string | null; valid_to: string | null; sni: string | null }
  domain_age_days: number | null
  ip: string | null
  asn: string | null
  geo: { country: string | null; region: string | null; city: string | null }
  detections: Record<string, string>
  blacklists: string[]
  heuristics: Record<string, { pass: boolean; score: number }>
  model_explanations: string[]
  error?: string | null
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || ''

function withTimeout<T>(ms: number, promise: Promise<T>): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  return promise.finally(() => clearTimeout(timeout)) as Promise<T>
}

async function request(path: string, init?: RequestInit, retry = true): Promise<any> {
  const url = `${API_BASE}${path}`
  try {
    const res = await withTimeout(20000, fetch(url, { ...init }))
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`)
    }
    return res.json()
  } catch (err) {
    if (retry) {
      await new Promise((r) => setTimeout(r, 800))
      return request(path, init, false)
    }
    throw err
  }
}

function isValidResponse(obj: any): obj is AnalysisResponse {
  const requiredKeys = [
    'status','uuid','submitted','normalized','verdict','risk_score','redirect_chain','final_url','whois','ssl','domain_age_days','ip','asn','geo','detections','blacklists','heuristics','model_explanations'
  ]
  return obj && typeof obj === 'object' && requiredKeys.every(k => k in obj)
}

export async function analyze(input: string, clientId?: string): Promise<AnalysisResponse> {
  const body = JSON.stringify({ input, client_id: clientId })
  const data = await request('/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  if (!isValidResponse(data)) throw new Error('Invalid API schema')
  return data
}

export async function getScan(uuid: string): Promise<AnalysisResponse> {
  const data = await request(`/scan/${encodeURIComponent(uuid)}`)
  if (!isValidResponse(data)) throw new Error('Invalid API schema')
  return data
}