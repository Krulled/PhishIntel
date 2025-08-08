import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import EvidenceTabs from '../components/EvidenceTabs';
import DetailedResults from '../components/DetailedResults';
import { getResult } from '../services/storage';
function RiskBadge({ level }) {
    const cls = level === 'Low' ? 'bg-emerald-500/20 text-emerald-300' : level === 'Medium' ? 'bg-amber-500/20 text-amber-300' : level === 'High' ? 'bg-red-500/20 text-red-300' : 'bg-red-600/30 text-red-200';
    return _jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${cls}`, children: level });
}
function RiskMeter({ score }) {
    const pct = Math.max(0, Math.min(100, score));
    return (_jsxs("div", { className: "w-full", "aria-label": "Risk meter", role: "img", "aria-roledescription": "gauge", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": pct, children: [_jsxs("div", { className: "mb-2 flex items-center justify-between text-xs text-gray-400", children: [_jsx("span", { children: "Risk score" }), _jsx("span", { children: pct })] }), _jsx("div", { className: "h-2 w-full overflow-hidden rounded-full bg-muted", children: _jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500", style: { width: `${pct}%` } }) })] }));
}
export default function Scan() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const hashPayload = useMemo(() => {
        if (location.hash.startsWith('#h=')) {
            try {
                const decoded = atob(decodeURIComponent(location.hash.slice(3)));
                return JSON.parse(decoded);
            }
            catch { }
        }
        return null;
    }, []);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (hashPayload && !cancelled) {
                setData(hashPayload);
                return;
            }
            if (id) {
                const res = await getResult(id);
                if (res && !cancelled)
                    setData(res);
                if (!res && !cancelled)
                    setNotFound(true);
            }
        })();
        return () => { cancelled = true; };
    }, [id, hashPayload]);
    if (notFound) {
        return (_jsxs("main", { className: "container py-16 text-center", children: [_jsx("h1", { className: "text-2xl font-semibold mb-4", children: "Scan not found" }), _jsx("p", { className: "text-gray-400 mb-6", children: "We could not load that scan." }), _jsx(Link, { className: "btn btn-primary", to: "/", children: "Back to home" })] }));
    }
    if (!data) {
        return _jsx("main", { className: "container py-16 text-center", children: _jsx("div", { className: "h-56 animate-pulse rounded-xl bg-muted" }) });
    }
    const baseUrl = `${location.origin}/scan/${id}`;
    const shareHash = `#h=${encodeURIComponent(btoa(JSON.stringify(data)))}`;
    const shareUrl = shareHash.length < 1800 ? `${location.origin}/scan/${id || ''}${shareHash}` : baseUrl;
    return (_jsxs("main", { className: "container space-y-6 py-8", children: [_jsx("div", { className: "grid gap-4 md:grid-cols-3", children: _jsxs("div", { className: "card p-4 space-y-3 md:col-span-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Risk Summary" }), _jsx(RiskBadge, { level: data.riskLevel })] }), _jsx(RiskMeter, { score: data.riskScore }), _jsxs("p", { className: "text-sm text-gray-300", children: ["Analyzed ", data.url, " at ", new Date(data.submittedAt).toLocaleString()] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "btn btn-secondary", onClick: () => navigator.clipboard.writeText(shareUrl), "aria-label": "Copy link", children: "Copy link" }), _jsx("button", { className: "btn btn-secondary", onClick: () => navigator.clipboard.writeText(JSON.stringify(data, null, 2)), "aria-label": "Copy report", children: "Copy report" })] })] }) }), _jsx(EvidenceTabs, { data: data }), _jsx(DetailedResults, { data: data }), _jsxs("div", { className: "card p-4", children: [_jsx("h3", { className: "text-sm font-medium", children: "Disclosure" }), _jsx("p", { className: "text-sm text-gray-300", children: "PhishIntel offers guidance and is not a substitute for enterprise policy." })] })] }));
}
