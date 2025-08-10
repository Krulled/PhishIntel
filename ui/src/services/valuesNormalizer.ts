export type NormalizedScan = {
  id: string | null
  verdict: 'Safe' | 'Suspicious' | 'Malicious' | 'n/a'
  riskScore: number
  riskScoreLabel: string | null
  url: string | null
  finalHost: string | null
  ipAsn: string | null
  domainAgeDays: number | null
  redirects: string[] | null
  whois: {
    registrar: string | null
    created: string | null
  }
  ssl: {
    issuer: string | null
    validFrom: string | null
    validTo: string | null
    status: string | null
  }
  notes: string[] | null
  createdAt: string | null
  updatedAt: string | null
}

function get<T = unknown>(obj: any, paths: string[]): T | null {
  for (const p of paths) {
    const val = p.split('.').reduce((acc: any, key: string) => (acc && acc[key] != null ? acc[key] : undefined), obj)
    if (val != null) return val as T
  }
  return null
}

function toTitleCaseVerdict(input: any): 'Safe' | 'Suspicious' | 'Malicious' | 'n/a' {
  if (!input || typeof input !== 'string') return 'n/a'
  const v = input.toLowerCase()
  if (v.startsWith('mal')) return 'Malicious'
  if (v.startsWith('sus')) return 'Suspicious'
  if (v.startsWith('safe')) return 'Safe'
  return 'n/a'
}

function parseNumber(n: any): number | null {
  if (typeof n === 'number' && Number.isFinite(n)) return n
  if (typeof n === 'string' && n.trim() !== '' && !Number.isNaN(Number(n))) return Number(n)
  return null
}

function isoAndReadable(dateStr: any): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  const iso = d.toISOString()
  const readable = d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  return `${iso} · ${readable}`
}

export function hostFromUrl(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

export function normalizeScan(raw: any): NormalizedScan {
  const id = get<string>(raw, ['id', 'scan_id', 'scanId', 'uuid'])
  const verdict = toTitleCaseVerdict(get<string>(raw, ['verdict', 'status']))

  const riskRaw = get<any>(raw, ['risk', 'risk_score', 'score', 'riskScore'])
  const riskParsed = parseNumber(riskRaw)
  const riskScore = riskParsed ?? 0
  const riskScoreLabel = riskParsed == null ? 'n/a' : null

  const url = get<string>(raw, ['url', 'submitted_url', 'original_url', 'normalized', 'final_url'])
  const finalHost = hostFromUrl(get<string>(raw, ['final_url', 'finalHost', 'final_host', 'host']) || url)

  const ip = get<string>(raw, ['ip_asn', 'ipAsn', 'ip'])
  const asn = get<string>(raw, ['asn'])
  const ipAsn = ip && asn ? `${ip} (${asn})` : ip || asn || null

  const domainAgeDays = parseNumber(get<any>(raw, ['domain_age_days', 'domainAge', 'domain_age']))

  const redirects = get<string[] | string>(raw, ['redirect_path', 'redirects', 'hops', 'redirect_chain'])
  const redirectsArr = Array.isArray(redirects)
    ? redirects
    : typeof redirects === 'string' && redirects.trim() !== ''
    ? redirects.split(',').map((s) => s.trim()).filter(Boolean)
    : null

  const whoisRegistrar = get<string>(raw, ['whois.registrar', 'registrar'])
  const whoisCreated = get<string>(raw, ['whois.created', 'domain_created', 'registered_at'])

  const sslIssuer = get<string>(raw, ['ssl.issuer', 'certificate.issuer'])
  const sslValidFrom = get<string>(raw, ['ssl.valid_from', 'certificate.valid_from'])
  const sslValidTo = get<string>(raw, ['ssl.valid_to', 'certificate.valid_to', 'ssl.valid'])
  const sslStatus = get<string>(raw, ['ssl.status'])

  const notesRaw = get<any>(raw, ['notes', 'ai_notes', 'analyst_notes', 'explanation', 'model_explanations'])
  let notes: string[] | null = null
  if (Array.isArray(notesRaw)) {
    notes = notesRaw.filter((x) => typeof x === 'string').slice(0, 3)
  } else if (typeof notesRaw === 'string') {
    notes = [notesRaw]
  }

  const createdAt = isoAndReadable(get<string>(raw, ['created_at', 'createdAt', 'submitted_at', 'submitted']))
  const updatedAt = isoAndReadable(get<string>(raw, ['updated_at', 'updatedAt']))



  return {
    id: id || null,
    verdict,
    riskScore,
    riskScoreLabel,
    url: url || null,
    finalHost: finalHost || null,
    ipAsn: ipAsn || null,
    domainAgeDays: domainAgeDays ?? null,
    redirects: redirectsArr || null,
    whois: {
      registrar: whoisRegistrar || null,
      created: isoAndReadable(whoisCreated) || whoisCreated || null,
    },
    ssl: {
      issuer: sslIssuer || null,
      validFrom: isoAndReadable(sslValidFrom) || sslValidFrom || null,
      validTo: isoAndReadable(sslValidTo) || sslValidTo || null,
      status: sslStatus || null,
    },
    notes,
    createdAt,
    updatedAt,
  }
}

export function flattenForTable(obj: NormalizedScan): Record<string, string> {
  const out: Record<string, string> = {}
  function walk(prefix: string, value: any) {
    if (value == null) return
    if (Array.isArray(value)) {
      out[prefix] = value.join(', ')
      return
    }
    if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        walk(prefix ? `${prefix}.${k}` : k, v)
      }
      return
    }
    out[prefix] = String(value)
  }
  walk('', obj)
  // Remove riskScoreLabel from table to avoid duplication; keep riskScore
  delete out['riskScoreLabel']
  // Ensure dot notation keys sorted later by caller
  return out
}