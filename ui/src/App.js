import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Suspense, useMemo, useState } from 'react';
import { ShieldCheck, ClipboardCopy, ExternalLink } from 'lucide-react';
function Skeleton({ className = '' }) {
    return (_jsx("div", { className: `animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-[#17202a] to-muted rounded-xl ${className}` }));
}
function Header() {
    return (_jsx("header", { className: "sticky top-0 z-10 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-background/70", children: _jsxs("div", { className: "container flex h-14 items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ShieldCheck, { className: "text-accent-green", "aria-hidden": "true" }), _jsx("span", { className: "font-semibold", children: "PhishIntel" })] }), _jsx("nav", { className: "text-sm text-gray-300", "aria-label": "Primary", children: _jsx("a", { className: "hover:text-white", href: "#safety", children: "Safety" }) })] }) }));
}
function useHash() {
    const [hash, setHash] = useState(() => window.location.hash);
    useMemo(() => {
        const onHash = () => setHash(window.location.hash);
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);
    return hash;
}
function UrlInputForm({ onSubmit }) {
    const [url, setUrl] = useState('');
    const [error, setError] = useState(null);
    const validate = (value) => {
        try {
            const u = new URL(value);
            return /^https?:$/.test(u.protocol);
        }
        catch {
            return false;
        }
    };
    return (_jsxs("form", { "aria-label": "Analyze URL", className: "flex w-full max-w-2xl items-stretch gap-2", onSubmit: (e) => {
            e.preventDefault();
            if (!validate(url)) {
                setError('Enter a valid http(s) URL');
                return;
            }
            setError(null);
            onSubmit(url);
        }, children: [_jsx("label", { className: "sr-only", htmlFor: "url", children: "URL" }), _jsx("input", { id: "url", name: "url", className: "input flex-1", placeholder: "https://example.com/suspicious", autoComplete: "off", inputMode: "url", "aria-invalid": !!error, "aria-describedby": error ? 'url-error' : undefined, value: url, onPaste: (e) => {
                    const pasted = e.clipboardData.getData('text');
                    if (pasted && !url)
                        setUrl(pasted.trim());
                }, onChange: (e) => setUrl(e.target.value) }), _jsx("button", { type: "button", className: "btn btn-secondary", "aria-label": "Clear", onClick: () => setUrl(''), children: "Clear" }), _jsx("button", { className: "btn btn-primary", type: "submit", "aria-label": "Analyze", children: "Analyze" }), error && (_jsx("div", { role: "alert", id: "url-error", className: "sr-only", children: error }))] }));
}
function RiskBadge({ level }) {
    const cls = level === 'Low' ? 'bg-emerald-500/20 text-emerald-300' : level === 'Medium' ? 'bg-amber-500/20 text-amber-300' : level === 'High' ? 'bg-red-500/20 text-red-300' : 'bg-red-600/30 text-red-200';
    return _jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${cls}`, children: level });
}
function RiskMeter({ score }) {
    const pct = Math.max(0, Math.min(100, score));
    return (_jsxs("div", { className: "w-full", children: [_jsxs("div", { className: "mb-2 flex items-center justify-between text-xs text-gray-400", children: [_jsx("span", { children: "Risk score" }), _jsx("span", { children: pct })] }), _jsx("div", { className: "h-2 w-full overflow-hidden rounded-full bg-muted", children: _jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500", style: { width: `${pct}%` } }) })] }));
}
import EvidenceTabs from './components/EvidenceTabs';
import CyberLoading from './components/CyberLoading';
import DetailedResults from './components/DetailedResults';
import { getAnalysis } from './services/analyzer';
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
function Results({ data }) {
    const [copied, setCopied] = useState(false);
    return (_jsxs("section", { "aria-label": "Analysis results", className: "container space-y-6 py-8", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [_jsxs("div", { className: "card p-4 space-y-3 md:col-span-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Risk Summary" }), _jsx(RiskBadge, { level: data.riskLevel })] }), _jsx(RiskMeter, { score: data.riskScore }), _jsxs("p", { className: "text-sm text-gray-300", children: ["Analyzed ", data.url, " at ", new Date(data.submittedAt).toLocaleString()] })] }), _jsxs("div", { className: "card p-4 space-y-3", children: [_jsx("h3", { className: "text-sm font-medium", children: "Next steps" }), _jsxs("ul", { className: "list-disc pl-5 text-sm text-gray-300 space-y-1", children: [_jsx("li", { children: "Report to your provider" }), _jsx("li", { children: "Open in sandbox" }), _jsx("li", { children: "Request takedown" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { className: "btn btn-secondary", "aria-label": "Copy full report", onClick: async () => {
                                            const report = JSON.stringify(data, null, 2);
                                            await navigator.clipboard.writeText(report);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 1500);
                                        }, children: [_jsx(ClipboardCopy, { size: 16, className: "mr-1" }), "Copy"] }), _jsxs("a", { className: "btn btn-primary", href: `#share=${encodeURIComponent(JSON.stringify(data))}`, "aria-label": "Share read-only report", children: [_jsx(ExternalLink, { size: 16, className: "mr-1" }), "Share"] })] }), _jsx("div", { "aria-live": "polite", className: "sr-only", role: "status", children: copied ? 'Report copied to clipboard' : '' })] })] }), _jsx(EvidenceTabs, { data: data }), _jsxs("div", { id: "safety", className: "card p-4", children: [_jsx("h3", { className: "text-sm font-medium", children: "Safety tips" }), _jsxs("ul", { className: "mt-2 list-disc pl-5 text-sm text-gray-300 space-y-1", children: [_jsx("li", { children: "Never click unknown links; use an isolated environment." }), _jsx("li", { children: "PhishIntel offers guidance and is not a substitute for enterprise policy." })] })] })] }));
}
export default function App() {
    const hash = useHash();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(() => {
        if (hash.startsWith('#share=')) {
            try {
                return JSON.parse(decodeURIComponent(hash.slice('#share='.length)));
            }
            catch { }
        }
        return null;
    });
    if (loading) {
        return _jsx(CyberLoading, { message: "Analyzing URL for security threats..." });
    }
    return (_jsxs("div", { className: "min-h-full", children: [_jsx(Header, {}), _jsxs("main", { className: "container py-10", children: [_jsxs("section", { className: "mx-auto text-center", children: [_jsx("h1", { className: "mb-2 text-3xl font-semibold tracking-tight", children: "Analyze a link before you click." }), _jsx("p", { className: "mb-6 text-gray-300", children: "Paste any URL to get a quick, private risk assessment." }), _jsx("div", { className: "mx-auto", children: _jsx(UrlInputForm, { onSubmit: async (url) => {
                                        setLoading(true);
                                        setError(null);
                                        try {
                                            console.log('🔍 Starting analysis for:', url);
                                            const res = await getAnalysis(url);
                                            setData(res);
                                            console.log('✅ Analysis completed:', res);
                                        }
                                        catch (err) {
                                            setError(err instanceof Error ? err.message : 'Analysis failed');
                                            console.error('❌ Analysis error:', err);
                                        }
                                        finally {
                                            setLoading(false);
                                        }
                                    } }) })] }), error && (_jsx("div", { className: "mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg", children: _jsx("p", { className: "text-red-300 text-sm", children: error }) })), !loading && data && (_jsxs(_Fragment, { children: [_jsx(Suspense, { fallback: _jsx("div", { className: "mt-8", children: _jsx(Skeleton, { className: "h-56" }) }), children: _jsx(Results, { data: data }) }), _jsx(DetailedResults, { data: data })] }))] })] }));
}
