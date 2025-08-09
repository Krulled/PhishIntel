import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyze, saveRecent, getRecent, fetchRecentRemote } from '../services/apiClient';
const riskColor = (score) => {
    if (score >= 80)
        return 'text-red-300 bg-red-500/15 border-red-500/30';
    if (score >= 50)
        return 'text-amber-300 bg-amber-500/15 border-amber-500/30';
    return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';
};
export default function Home() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('search');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [recent, setRecent] = useState([]);
    const liveRef = useRef(null);
    useEffect(() => {
        ;
        (async () => {
            const local = getRecent();
            const remote = await fetchRecentRemote();
            const merged = [...new Set([...remote, ...local])].slice(0, 5);
            setRecent(merged);
        })();
    }, []);
    const placeholder = useMemo(() => {
        if (activeTab === 'file')
            return 'File hash (sha256), URL, IP, or domain';
        if (activeTab === 'url')
            return 'URL (https://example.com/login)';
        return 'URL, IP address, domain, or file hash';
    }, [activeTab]);
    function validate(value) {
        if (activeTab === 'url') {
            try {
                const u = new URL(value);
                return /^(http|https):$/.test(u.protocol);
            }
            catch {
                return false;
            }
        }
        return value.trim().length > 0;
    }
    async function onSubmit(e) {
        e.preventDefault();
        if (!validate(input)) {
            setError('Enter a valid input');
            return;
        }
        setError(null);
        setLoading(true);
        liveRef.current?.setAttribute('aria-busy', 'true');
        try {
            const tempId = crypto.randomUUID();
            const { result } = await analyze(input.trim());
            const id = result.uuid || tempId;
            setData(result);
            saveRecent(id);
            setRecent(getRecent());
            navigate(`/scan/${id}`);
        }
        catch (err) {
            const message = err?.message || 'Request failed';
            setError(message);
            if (err?.curl) {
                ;
                navigator.clipboard?.writeText?.(err.curl).catch(() => { });
            }
        }
        finally {
            setLoading(false);
            liveRef.current?.setAttribute('aria-busy', 'false');
        }
    }
    return (_jsx("main", { className: "min-h-screen bg-[#0b0e16] text-white", children: _jsxs("section", { className: "mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4", children: [_jsxs("div", { className: "mb-8 text-center", children: [_jsx("div", { className: "mx-auto mb-3 h-12 w-12 rounded-xl bg-indigo-500/10 ring-1 ring-indigo-400/30", "aria-hidden": true }), _jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "PHISHINTEL" }), _jsx("p", { className: "mt-1 text-sm text-gray-300", children: "Search for a URL, domain, IP, or hash to assess phishing risk." })] }), _jsx("div", { className: "mb-3 flex items-center gap-6 text-sm text-gray-300", role: "tablist", "aria-label": "Mode", children: ['file', 'url', 'search'].map(t => (_jsx("button", { role: "tab", "aria-selected": activeTab === t, className: `pb-1 ${activeTab === t ? 'border-b-2 border-indigo-400 text-white' : 'text-gray-400 hover:text-gray-200'}`, onClick: () => setActiveTab(t), children: t.toUpperCase() }, t))) }), _jsxs("form", { onSubmit: onSubmit, className: "w-full", "aria-labelledby": "search-label", children: [_jsx("label", { id: "search-label", className: "sr-only", children: "Search input" }), _jsxs("div", { className: "flex w-full flex-col items-center gap-3", children: [_jsx("input", { value: input, onChange: (e) => setInput(e.target.value), inputMode: "url", "aria-invalid": !!error, "aria-describedby": error ? 'err' : '', className: "w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 outline-none ring-1 ring-white/5 focus:ring-indigo-400", placeholder: placeholder }), _jsx("button", { className: "w-full rounded-lg bg-indigo-500 px-4 py-3 font-medium text-white hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300", type: "submit", children: "Analyze" }), _jsxs("div", { className: "text-xs text-gray-400", children: ["By submitting you agree to share results with the security community. See ", _jsx("a", { className: "underline", href: "/terms", target: "_blank", rel: "noreferrer", children: "Terms" }), ", ", _jsx("a", { className: "underline", href: "/privacy", target: "_blank", rel: "noreferrer", children: "Privacy" }), ", and ", _jsx("a", { className: "underline", href: "/security.html", target: "_blank", rel: "noreferrer", children: "Security" }), "."] })] })] }), error && (_jsx("div", { role: "alert", id: "err", className: "mt-4 w-full rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200", children: error })), _jsx("div", { ref: liveRef, "aria-live": "polite", className: "sr-only" }), loading && (_jsx("div", { className: "mt-6 w-full animate-pulse rounded-xl border border-white/10 bg-white/5 p-6 text-center", role: "status", children: "Analyzing\u2026" })), recent.length > 0 && (_jsxs("div", { className: "mt-8 w-full text-sm text-gray-300", children: [_jsx("div", { className: "mb-2 font-medium", children: "Recent scans" }), _jsx("div", { className: "flex flex-wrap gap-2", children: recent.slice(0, 5).map(id => (_jsxs("button", { className: "rounded border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10", onClick: () => navigate(`/scan/${id}`), children: [id.slice(0, 8), "\u2026"] }, id))) })] })), !loading && data && (_jsxs("div", { className: "mt-8 w-full rounded-xl border border-white/10 bg-white/5 p-5", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsxs("div", { className: "text-lg font-semibold", children: ["Verdict: ", data.verdict] }), _jsxs("span", { className: `rounded-full border px-3 py-1 text-sm ${riskColor(data.risk_score)}`, children: ["Risk ", data.risk_score] })] }), _jsxs("div", { className: "mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm text-gray-300", children: [_jsxs("div", { className: "rounded-lg border border-white/10 bg-black/20 p-3", children: ["Domain age: ", data.domain_age_days || 0, " days"] }), _jsxs("div", { className: "rounded-lg border border-white/10 bg-black/20 p-3", children: ["Final host: ", new URL(data.final_url || data.normalized).hostname] }), _jsxs("div", { className: "rounded-lg border border-white/10 bg-black/20 p-3", children: ["IP / ASN: ", data.ip || 'n/a', " ", data.asn ? `(${data.asn})` : ''] })] }), _jsxs("details", { className: "mb-3", children: [_jsx("summary", { className: "cursor-pointer select-none text-sm text-gray-200", children: "Redirect path" }), _jsx("ol", { className: "mt-2 list-decimal space-y-1 pl-6 text-sm text-gray-300", children: (data.redirect_chain?.length ? data.redirect_chain : [data.normalized]).map((u, i) => _jsx("li", { children: u }, i)) })] }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsxs("div", { className: "rounded-lg border border-white/10 bg-black/20 p-3", children: [_jsx("div", { className: "mb-2 font-medium", children: "WHOIS" }), _jsxs("div", { className: "text-sm text-gray-300", children: ["Registrar: ", data.whois.registrar || 'n/a'] }), _jsxs("div", { className: "text-sm text-gray-300", children: ["Created: ", data.whois.created || 'n/a'] })] }), _jsxs("div", { className: "rounded-lg border border-white/10 bg-black/20 p-3", children: [_jsx("div", { className: "mb-2 font-medium", children: "SSL" }), _jsxs("div", { className: "text-sm text-gray-300", children: ["Issuer: ", data.ssl.issuer || 'n/a'] }), _jsxs("div", { className: "text-sm text-gray-300", children: ["Valid: ", data.ssl.valid_from || '—', " \u2192 ", data.ssl.valid_to || '—'] })] })] }), _jsxs("div", { className: "mt-3 rounded-lg border border-white/10 bg-black/20 p-3", children: [_jsx("div", { className: "mb-2 font-medium", children: "Map" }), _jsxs("div", { className: "h-28 w-full rounded bg-white/5 text-center text-xs text-gray-400", children: ["Geolocation: ", data.geolocation.country, " ", data.geolocation.region, " ", data.geolocation.city] })] }), data.model_explanations?.length > 0 && (_jsxs("div", { className: "mt-3 rounded-lg border border-indigo-400/30 bg-indigo-500/10 p-3", children: [_jsx("div", { className: "mb-1 text-sm font-medium", children: "AI notes" }), _jsx("ul", { className: "list-disc pl-5 text-sm text-indigo-200", children: data.model_explanations.map((m, i) => (_jsx("li", { children: m }, i))) })] })), _jsxs("details", { className: "mt-3", children: [_jsx("summary", { className: "cursor-pointer select-none text-sm text-gray-200", children: "View raw JSON" }), _jsx("pre", { className: "mt-2 overflow-x-auto rounded bg-black/60 p-3 text-xs text-gray-200", children: JSON.stringify(data, null, 2) })] }), _jsx("div", { className: "mt-4 flex gap-2", children: _jsx("button", { className: "rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/15", onClick: () => {
                                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                    const a = document.createElement('a');
                                    a.href = URL.createObjectURL(blob);
                                    a.download = `phishintel_report_${data.uuid || 'temp'}.json`;
                                    a.click();
                                    URL.revokeObjectURL(a.href);
                                }, children: "Export Report" }) })] }))] }) }));
}
