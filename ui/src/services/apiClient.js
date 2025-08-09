const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
function toCurl(url, body) {
    return `curl -sS -X POST '${url}' -H 'Content-Type: application/json' --data '${JSON.stringify(body)}'`;
}
async function doFetch(input, init) {
    return fetch(input, { ...init });
}
export async function analyze(inputValue) {
    const endpoint = `${API_BASE_URL}/analyze`;
    const payload = { input: inputValue };
    const curl = toCurl(endpoint, payload);
    // First attempt
    try {
        const res = await doFetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(90000),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
        }
        const data = (await res.json());
        return { result: data, curl };
    }
    catch (err) {
        // Retry once
        try {
            const res = await doFetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(90000),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
            }
            const data = (await res.json());
            return { result: data, curl };
        }
        catch (e) {
            const message = e instanceof Error ? e.message : 'Network error';
            const fallback = {
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
            };
            throw Object.assign(new Error(message), { curl, result: fallback });
        }
    }
}
export async function getScan(uuid) {
    const res = await doFetch(`${API_BASE_URL}/api/scan/${uuid}`);
    if (res.ok)
        return (await res.json());
    return null;
}
export async function fetchRecentRemote() {
    try {
        const res = await doFetch(`${API_BASE_URL}/api/recent`);
        if (!res.ok)
            return [];
        const data = await res.json();
        return Array.isArray(data?.uuids) ? data.uuids : [];
    }
    catch {
        return [];
    }
}
export function saveRecent(uuid) {
    const key = 'phishintel_recent_uuids';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    const next = [uuid, ...list.filter((u) => u !== uuid)].slice(0, 10);
    localStorage.setItem(key, JSON.stringify(next));
}
export function getRecent() {
    const key = 'phishintel_recent_uuids';
    return JSON.parse(localStorage.getItem(key) || '[]');
}
