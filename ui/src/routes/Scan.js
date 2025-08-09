import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCached, saveResult } from '../services/storage';
import { getScan } from '../services/apiClient';
function Badge({ verdict }) {
    const cls = verdict === 'Safe' ? 'safe' : verdict === 'Suspicious' ? 'susp' : 'mal';
    return _jsx("span", { className: `badge ${cls}`, children: verdict });
}
function Collapsible({ title, children }) {
    const [open, setOpen] = useState(false);
    return (_jsxs("div", { className: "card", children: [_jsx("button", { className: "collapse-toggle", "aria-expanded": open, onClick: () => setOpen(v => !v), children: title }), _jsx("div", { className: open ? 'collapse-open' : 'collapse-closed', children: open ? children : _jsx("div", { className: "skeleton h-6" }) })] }));
}
export default function Scan() {
    const { uuid } = useParams();
    const [data, setData] = useState(null);
    const [notFound, setNotFound] = useState(false);
    useEffect(() => {
        let cancelled = false;
        if (!uuid)
            return;
        const cached = getCached(uuid);
        if (cached)
            setData(cached);
        (async () => {
            try {
                const remote = await getScan(uuid);
                if (!cancelled) {
                    setData(remote);
                    saveResult(remote);
                }
            }
            catch (e) {
                if (!cached && !cancelled)
                    setNotFound(true);
            }
        })();
        return () => { cancelled = true; };
    }, [uuid]);
    if (notFound) {
        return (_jsxs("main", { className: "container p-gap text-center", children: [_jsx("h1", { className: "text-subtitle", children: "Scan not found" }), _jsx(Link, { className: "link", to: "/", children: "Back" })] }));
    }
    if (!data) {
        return _jsx("main", { className: "container p-gap", children: _jsx("div", { className: "skeleton h-32" }) });
    }
    const exportReport = () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `phishintel_report_${data.uuid}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    };
    return (_jsxs("main", { className: "container p-gap space-y-gap", children: [_jsxs("header", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { verdict: data.verdict }), _jsxs("div", { className: "text-sm text-muted", children: ["Risk ", data.risk_score] })] }), _jsx("button", { className: "btn btn-secondary", onClick: exportReport, children: "Export Report" })] }), _jsxs("section", { className: "card p-3", children: [_jsx("div", { className: "text-sm", children: data.final_url || data.normalized }), _jsxs("div", { className: "quickfacts", children: [_jsxs("div", { children: [_jsx("span", { children: "Domain age" }), _jsx("strong", { children: data.domain_age_days ?? '—' })] }), _jsxs("div", { children: [_jsx("span", { children: "Host IP" }), _jsx("strong", { children: data.ip ?? '—' })] }), _jsxs("div", { children: [_jsx("span", { children: "ASN" }), _jsx("strong", { children: data.asn ?? '—' })] })] })] }), _jsx(Collapsible, { title: "Redirect chain", children: data.redirect_chain.length ? (_jsx("ol", { className: "list", children: data.redirect_chain.map((u, i) => _jsx("li", { children: u }, i)) })) : _jsx("p", { className: "text-muted", children: "No redirects recorded." }) }), _jsx(Collapsible, { title: "WHOIS", children: _jsx("pre", { className: "pre", children: JSON.stringify(data.whois, null, 2) }) }), _jsx(Collapsible, { title: "SSL/TLS", children: _jsx("pre", { className: "pre", children: JSON.stringify(data.ssl, null, 2) }) }), _jsx(Collapsible, { title: "Detections", children: Object.keys(data.detections).length ? (_jsx("ul", { className: "list", children: Object.entries(data.detections).map(([k, v]) => _jsxs("li", { children: [_jsxs("strong", { children: [k, ":"] }), " ", v] }, k)) })) : _jsx("p", { className: "text-muted", children: "No detections." }) }), _jsxs("section", { className: "card p-3", children: [_jsx("h2", { className: "text-sm font-medium", children: "Model notes" }), data.model_explanations.length ? (_jsx("ul", { className: "list", children: data.model_explanations.map((m, i) => _jsx("li", { children: m }, i)) })) : _jsx("p", { className: "text-muted", children: "No explanations provided." })] }), _jsxs("section", { className: "card p-3", children: [_jsx("h2", { className: "text-sm font-medium", children: "Graph" }), _jsx("div", { className: "graph", "aria-hidden": "true" })] }), _jsxs("details", { className: "card p-3", children: [_jsx("summary", { children: "Code view" }), _jsx("pre", { className: "pre", "aria-label": "Raw JSON", children: JSON.stringify(data, null, 2) })] })] }));
}
