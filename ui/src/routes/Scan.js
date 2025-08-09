import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getScan } from '../services/apiClient';
const riskColor = (score) => {
    if (score >= 80)
        return 'text-red-300 bg-red-500/15 border-red-500/30';
    if (score >= 50)
        return 'text-amber-300 bg-amber-500/15 border-amber-500/30';
    return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';
};
export default function Scan() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [notFound, setNotFound] = useState(false);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!id)
                return;
            const res = await getScan(id);
            if (!cancelled) {
                setData(res);
                setNotFound(!res);
            }
        })();
        return () => { cancelled = true; };
    }, [id]);
    if (notFound) {
        return (_jsxs("main", { className: "container mx-auto max-w-3xl px-4 py-16 text-center text-white", children: [_jsx("h1", { className: "mb-4 text-2xl font-semibold", children: "Scan not found" }), _jsx("p", { className: "mb-6 text-gray-400", children: "We couldn't load that scan." }), _jsx(Link, { className: "rounded bg-indigo-500 px-4 py-2", to: "/", children: "Back to home" })] }));
    }
    if (!data) {
        return _jsx("main", { className: "container mx-auto max-w-3xl px-4 py-16 text-center text-white", children: _jsx("div", { className: "h-56 animate-pulse rounded-xl border border-white/10 bg-white/5" }) });
    }
    return (_jsx("main", { className: "min-h-screen bg-[#0b0e16] text-white", children: _jsxs("section", { className: "container mx-auto max-w-3xl px-4 py-10", children: [_jsxs("div", { className: "mb-6", children: [_jsxs("h1", { className: "text-xl font-semibold", children: ["Scan ", data.uuid] }), _jsxs("p", { className: "text-sm text-gray-400", children: ["Submitted ", new Date(data.submitted).toLocaleString()] })] }), _jsxs("div", { className: "mb-8 w-full rounded-xl border border-white/10 bg-white/5 p-5", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsxs("div", { className: "text-lg font-semibold", children: ["Verdict: ", data.verdict] }), _jsxs("span", { className: `rounded-full border px-3 py-1 text-sm ${riskColor(data.risk_score)}`, children: ["Risk ", data.risk_score] })] }), _jsxs("div", { className: "mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm text-gray-300", children: [_jsxs("div", { className: "rounded-lg border border-white/10 bg-black/20 p-3", children: ["Domain age: ", data.domain_age_days || 0, " days"] }), _jsxs("div", { className: "rounded-lg border border-white/10 bg-black/20 p-3", children: ["Final host: ", new URL(data.final_url || data.normalized).hostname] }), _jsxs("div", { className: "rounded-lg border border-white/10 bg-black/20 p-3", children: ["IP / ASN: ", data.ip || 'n/a', " ", data.asn ? `(${data.asn})` : ''] })] }), _jsxs("details", { className: "mb-3", children: [_jsx("summary", { className: "cursor-pointer select-none text-sm text-gray-200", children: "Redirect path" }), _jsx("ol", { className: "mt-2 list-decimal space-y-1 pl-6 text-sm text-gray-300", children: (data.redirect_chain?.length ? data.redirect_chain : [data.normalized]).map((u, i) => _jsx("li", { children: u }, i)) })] }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsxs("div", { className: "rounded-lg border border-white/10 bg-black/20 p-3", children: [_jsx("div", { className: "mb-2 font-medium", children: "WHOIS" }), _jsxs("div", { className: "text-sm text-gray-300", children: ["Registrar: ", data.whois.registrar || 'n/a'] }), _jsxs("div", { className: "text-sm text-gray-300", children: ["Created: ", data.whois.created || 'n/a'] })] }), _jsxs("div", { className: "rounded-lg border border-white/10 bg-black/20 p-3", children: [_jsx("div", { className: "mb-2 font-medium", children: "SSL" }), _jsxs("div", { className: "text-sm text-gray-300", children: ["Issuer: ", data.ssl.issuer || 'n/a'] }), _jsxs("div", { className: "text-sm text-gray-300", children: ["Valid: ", data.ssl.valid_from || '—', " \u2192 ", data.ssl.valid_to || '—'] })] })] }), _jsxs("div", { className: "mt-3 rounded-lg border border-white/10 bg-black/20 p-3", children: [_jsx("div", { className: "mb-2 font-medium", children: "Map" }), _jsxs("div", { className: "h-28 w-full rounded bg-white/5 text-center text-xs text-gray-400", children: ["Geolocation: ", data.geolocation.country, " ", data.geolocation.region, " ", data.geolocation.city] })] }), data.model_explanations?.length > 0 && (_jsxs("div", { className: "mt-3 rounded-lg border border-indigo-400/30 bg-indigo-500/10 p-3", children: [_jsx("div", { className: "mb-1 text-sm font-medium", children: "AI notes" }), _jsx("ul", { className: "list-disc pl-5 text-sm text-indigo-200", children: data.model_explanations.map((m, i) => (_jsx("li", { children: m }, i))) })] })), _jsxs("details", { className: "mt-3", children: [_jsx("summary", { className: "cursor-pointer select-none text-sm text-gray-200", children: "View raw JSON" }), _jsx("pre", { className: "mt-2 overflow-x-auto rounded bg-black/60 p-3 text-xs text-gray-200", children: JSON.stringify(data, null, 2) })] }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsx("button", { className: "rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/15", onClick: () => {
                                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                        const a = document.createElement('a');
                                        a.href = URL.createObjectURL(blob);
                                        a.download = `phishintel_report_${data.uuid || 'temp'}.json`;
                                        a.click();
                                        URL.revokeObjectURL(a.href);
                                    }, children: "Export Report" }), _jsx("a", { className: "rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/15", href: data.final_url, target: "_blank", rel: "noreferrer", children: "Open final URL" })] })] })] }) }));
}
