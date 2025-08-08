import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import CyberLoading from '../components/CyberLoading';
import DetailedResults from '../components/DetailedResults';
import { getAnalysis } from '../services/analyzer';
import { saveResult } from '../services/storage';
function Header() {
    return (_jsx("header", { className: "sticky top-0 z-10 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-background/70", children: _jsxs("div", { className: "container flex h-14 items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ShieldCheck, { className: "text-accent-green", "aria-hidden": "true" }), _jsx("span", { className: "font-semibold", children: "PhishIntel" })] }), _jsx("nav", { className: "text-sm text-gray-300", "aria-label": "Primary", children: _jsx("a", { className: "hover:text-white", href: "#safety", children: "Safety" }) })] }) }));
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
    return (_jsxs("div", { className: "w-full", "aria-label": "Risk meter", role: "img", "aria-roledescription": "gauge", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": pct, children: [_jsxs("div", { className: "mb-2 flex items-center justify-between text-xs text-gray-400", children: [_jsx("span", { children: "Risk score" }), _jsx("span", { children: pct })] }), _jsx("div", { className: "h-2 w-full overflow-hidden rounded-full bg-muted", children: _jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500", style: { width: `${pct}%` } }) })] }));
}
export default function Home() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    return (_jsxs("div", { className: "min-h-full", children: [_jsx(Header, {}), _jsxs("main", { className: "container py-10", children: [_jsxs("section", { className: "mx-auto text-center", children: [_jsx("h1", { className: "mb-2 text-3xl font-semibold tracking-tight", children: "Analyze a link before you click." }), _jsx("p", { className: "mb-6 text-gray-300", children: "Paste any URL to get a quick, private risk assessment." }), _jsx("div", { className: "mx-auto", children: _jsx(UrlInputForm, { onSubmit: async (url) => {
                                        setLoading(true);
                                        setError(null);
                                        try {
                                            const id = crypto.randomUUID();
                                            const res = await getAnalysis(url);
                                            await saveResult(id, res);
                                            setData(res);
                                            navigate(`/scan/${id}`);
                                        }
                                        catch (err) {
                                            setError(err instanceof Error ? err.message : 'Analysis failed');
                                        }
                                        finally {
                                            setLoading(false);
                                        }
                                    } }) })] }), error && (_jsx("div", { className: "mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg", children: _jsx("p", { className: "text-red-300 text-sm", children: error }) })), loading && _jsx(CyberLoading, { message: "Analyzing URL for security threats..." }), !loading && data && (_jsxs(_Fragment, { children: [_jsx(Suspense, { fallback: _jsx("div", { className: "mt-8", children: _jsx("div", { className: "h-56 animate-pulse rounded-xl bg-muted" }) }), children: _jsx("section", { "aria-label": "Analysis results", className: "container space-y-6 py-8", children: _jsx("div", { className: "grid gap-4 md:grid-cols-3", children: _jsxs("div", { className: "card p-4 space-y-3 md:col-span-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Risk Summary" }), _jsx(RiskBadge, { level: data.riskLevel })] }), _jsx(RiskMeter, { score: data.riskScore }), _jsxs("p", { className: "text-sm text-gray-300", children: ["Analyzed ", data.url, " at ", new Date(data.submittedAt).toLocaleString()] })] }) }) }) }), _jsx(DetailedResults, { data: data })] }))] })] }));
}
