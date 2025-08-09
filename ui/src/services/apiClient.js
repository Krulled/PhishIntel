const API_BASE = import.meta.env?.VITE_API_URL || '';
function withTimeout(ms, promise) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    return promise.finally(() => clearTimeout(timeout));
}
async function request(path, init, retry = true) {
    const url = `${API_BASE}${path}`;
    try {
        const res = await withTimeout(20000, fetch(url, { ...init }));
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
        }
        return res.json();
    }
    catch (err) {
        if (retry) {
            await new Promise((r) => setTimeout(r, 800));
            return request(path, init, false);
        }
        throw err;
    }
}
function isValidResponse(obj) {
    const requiredKeys = [
        'status', 'uuid', 'submitted', 'normalized', 'verdict', 'risk_score', 'redirect_chain', 'final_url', 'whois', 'ssl', 'domain_age_days', 'ip', 'asn', 'geo', 'detections', 'blacklists', 'heuristics', 'model_explanations'
    ];
    return obj && typeof obj === 'object' && requiredKeys.every(k => k in obj);
}
export async function analyze(input, clientId) {
    const body = JSON.stringify({ input, client_id: clientId });
    const data = await request('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
    });
    if (!isValidResponse(data))
        throw new Error('Invalid API schema');
    return data;
}
export async function getScan(uuid) {
    const data = await request(`/scan/${encodeURIComponent(uuid)}`);
    if (!isValidResponse(data))
        throw new Error('Invalid API schema');
    return data;
}
