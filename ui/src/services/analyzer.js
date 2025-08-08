const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export async function getAnalysis(url) {
    try {
        console.log('🔍 Starting analysis for:', url);
        const response = await fetch(`${API_BASE_URL}/api/analyze-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
            // Increased timeout for urlscan processing (up to 2 minutes)
            signal: AbortSignal.timeout(120000)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('✅ Analysis completed:', data);
        // Transform the backend response to match frontend expectations
        return {
            url: data.url,
            submittedAt: data.submittedAt,
            riskScore: data.riskScore,
            riskLevel: data.riskLevel,
            findings: data.findings || [],
            redirects: data.redirects || [],
            ssl: data.ssl || { issuer: 'Unknown', validFrom: 'Unknown', validTo: 'Unknown' },
            dns: data.dns || { a: [], ns: [], ageDays: 0 },
            whois: data.whois || { registrar: 'Unknown', created: 'Unknown' },
            headers: data.headers || [],
            contentSignals: data.contentSignals || [],
            screenshot: data.screenshot,
            ai_reasoning: data.ai_reasoning,
            phish_detection: data.phish_detection,
        };
    }
    catch (error) {
        console.error('❌ Analysis failed:', error);
        // Show user-friendly error message
        if (error instanceof Error) {
            if (error.name === 'TimeoutError') {
                throw new Error('Analysis timed out. URLScan is taking longer than expected. Please try again.');
            }
            else if (error.message.includes('Failed to fetch')) {
                throw new Error('Cannot connect to the analysis server. Please check if the backend is running.');
            }
        }
        // Fallback to mock data if API is unavailable
        console.log('🔄 Falling back to mock data...');
        return mockAnalyze(url);
    }
}
function mockAnalyze(input) {
    const now = new Date().toISOString();
    const base = {
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
    };
    let result;
    if (/example\.com\/?$/.test(input)) {
        result = {
            url: input,
            submittedAt: now,
            riskScore: 8,
            riskLevel: 'Low',
            ...base,
            findings: [{ id: 'f1', title: 'Well-known brand domain', severity: 'low' }],
            redirects: [{ index: 0, domain: 'example.com', status: 200, risk: 'low' }],
        };
    }
    else if (/suspicious\.example/i.test(input)) {
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
        };
    }
    else if (/bit\.ly|t\.co|tinyurl/i.test(input)) {
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
        };
    }
    else {
        result = {
            url: input,
            submittedAt: now,
            riskScore: 20,
            riskLevel: 'Low',
            ...base,
            findings: [],
            redirects: [{ index: 0, domain: new URL(input).hostname, status: 200, risk: 'low' }],
        };
    }
    return new Promise((resolve) => setTimeout(() => resolve(result), 800));
}
