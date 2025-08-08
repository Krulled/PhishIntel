export type SafeAnalysisResult = {
  url: string
  submittedAt: string
  riskScore: number
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
  findings: { id: string; title: string; severity: 'low' | 'medium' | 'high' | 'critical' }[]
  redirects: { index: number; domain: string; status: number; risk: 'low' | 'medium' | 'high' }[]
  ssl: { issuer: string; validFrom: string; validTo: string }
  dns: { a: string[]; ns: string[]; ageDays: number }
  whois: { registrar: string; created: string }
  headers: { name: string; value: string; suspicious?: boolean }[]
  contentSignals: string[]
}

export async function getAnalysis(url: string): Promise<SafeAnalysisResult> {
  return mockAnalyze(url)
}

function mockAnalyze(input: string): Promise<SafeAnalysisResult> {
  const now = new Date().toISOString()
  const base: Omit<SafeAnalysisResult, 'url' | 'submittedAt' | 'riskScore' | 'riskLevel'> = {
    findings: [],
    redirects: [],
    ssl: { issuer: 'Let\'s Encrypt', validFrom: '2024-01-01', validTo: '2025-01-01' },
    dns: { a: ['93.184.216.34'], ns: ['ns1.example.com'], ageDays: 3650 },
    whois: { registrar: 'Example Registrar', created: '2010-05-01' },
    headers: [
      { name: 'server', value: 'nginx' },
      { name: 'x-powered-by', value: 'PHP/5.6', suspicious: true },
    ],
    contentSignals: [],
  }
  let result: SafeAnalysisResult
  if (/example\.com\/?$/.test(input)) {
    result = {
      url: input,
      submittedAt: now,
      riskScore: 8,
      riskLevel: 'Low',
      ...base,
      findings: [{ id: 'f1', title: 'Well-known brand domain', severity: 'low' }],
      redirects: [{ index: 0, domain: 'example.com', status: 200, risk: 'low' }],
    }
  } else if (/suspicious\.example/i.test(input)) {
    result = {
      url: input,
      submittedAt: now,
      riskScore: 72,
      riskLevel: 'High',
      ssl: { issuer: 'Unknown CA', validFrom: '2025-07-01', validTo: '2025-09-01' },
      dns: { a: ['203.0.113.55'], ns: ['ns.bad-dns.net'], ageDays: 3 },
      whois: { registrar: 'Shady Registrar', created: '2025-08-05' },
      headers: [
        { name: 'x-frame-options', value: 'ALLOWALL', suspicious: true },
        { name: 'content-security-policy', value: "default-src * 'unsafe-eval' 'unsafe-inline'", suspicious: true },
      ],
      contentSignals: ['Obfuscated JavaScript', 'Suspicious form posts credentials'],
      findings: [
        { id: 'f2', title: 'Brand spoof detected', severity: 'high' },
        { id: 'f3', title: 'Typosquatting pattern', severity: 'medium' },
      ],
      redirects: [
        { index: 0, domain: 'suspicious.example', status: 302, risk: 'medium' },
        { index: 1, domain: 'login-update-example.com', status: 200, risk: 'high' },
      ],
    }
  } else if (/bit\.ly|t\.co|tinyurl/i.test(input)) {
    result = {
      url: input,
      submittedAt: now,
      riskScore: 48,
      riskLevel: 'Medium',
      ...base,
      findings: [{ id: 'f4', title: 'Shortened URL obscures destination', severity: 'medium' }],
      redirects: [
        { index: 0, domain: 'bit.ly', status: 301, risk: 'medium' },
        { index: 1, domain: 'unknown-target.com', status: 200, risk: 'medium' },
      ],
    }
  } else {
    result = {
      url: input,
      submittedAt: now,
      riskScore: 20,
      riskLevel: 'Low',
      ...base,
      findings: [],
      redirects: [{ index: 0, domain: new URL(input).hostname, status: 200, risk: 'low' }],
    }
  }
  return new Promise((resolve) => setTimeout(() => resolve(result), 800))
}