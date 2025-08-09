import { describe, it, expect, vi } from 'vitest';
import { analyze, getScan } from '../services/apiClient';
const sample = {
    status: 'ok', uuid: 'u1', submitted: new Date().toISOString(), normalized: 'http://e', verdict: 'Safe', risk_score: 0,
    redirect_chain: [], final_url: 'http://e', whois: { registrar: null, created: null, updated: null, expires: null, country: null },
    ssl: { issuer: null, valid_from: null, valid_to: null, sni: null }, domain_age_days: null, ip: null, asn: null, geo: { country: null, region: null, city: null },
    detections: {}, blacklists: [], heuristics: {}, model_explanations: [], error: null
};
describe('apiClient', () => {
    it('validates schema on analyze', async () => {
        const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => sample });
        const res = await analyze('http://example.com');
        expect(res.uuid).toBe('u1');
        fetchMock.mockRestore();
    });
    it('throws on invalid schema', async () => {
        const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ foo: 'bar' }) });
        await expect(analyze('http://ex')).rejects.toThrow();
        fetchMock.mockRestore();
    });
    it('getScan propagates http error', async () => {
        const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found', text: async () => 'Not Found' });
        await expect(getScan('x')).rejects.toThrow();
        fetchMock.mockRestore();
    });
});
