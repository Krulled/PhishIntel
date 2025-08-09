import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { analyze } from '../services/apiClient';
import { saveResult, getRecent } from '../services/storage';
export default function Home() {
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const recent = useMemo(() => getRecent(5), []);
    function isValid(v) {
        const s = v.trim();
        if (!s)
            return false;
        // allow url, ip, domain, or hash (basic check)
        try {
            new URL(s.includes('://') ? s : `http://${s}`);
        }
        catch {
            return false;
        }
        return true;
    }
    async function onSubmit() {
        setError(null);
        if (!isValid(input)) {
            setError('Enter a valid URL, IP, domain, or hash');
            return;
        }
        setLoading(true);
        try {
            const res = await analyze(input);
            saveResult(res);
            navigate(`/scan/${res.uuid}`);
        }
        catch (e) {
            const msg = e?.message || 'Request failed';
            setError(msg);
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("main", { className: "container p-gap mx-auto max-w-screen-sm", children: [_jsxs("section", { className: "mt-12 text-center", children: [_jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "mx-auto h-12 w-12 rounded-full bg-accent flex items-center justify-center", "aria-hidden": "true", children: "PI" }), _jsx("h1", { className: "mt-3 text-title font-semibold", children: "PhishIntel" }), _jsx("p", { className: "text-muted", children: "AI Powered Phishing and Link Threat Intelligence" })] }), _jsxs("form", { className: "mt-6", onSubmit: (e) => { e.preventDefault(); onSubmit(); }, "aria-label": "Analyze input", children: [_jsx("label", { htmlFor: "input", className: "sr-only", children: "Input" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { id: "input", name: "input", className: "input flex-1", placeholder: "URL, IP, domain, or hash", autoComplete: "off", inputMode: "url", "aria-invalid": !!error, value: input, onChange: (e) => setInput(e.target.value) }), _jsx("button", { type: "button", className: "btn", onClick: () => setInput(''), "aria-label": "Clear", children: "Clear" }), _jsx("button", { type: "submit", className: "btn btn-primary", disabled: loading, "aria-live": "polite", children: loading ? _jsx("span", { className: "spinner", role: "status", "aria-label": "Analyzing" }) : 'Analyze' })] }), _jsxs("p", { className: "mt-2 text-xs text-muted", children: ["By submitting a link or file you agree to share results with the security community. ", _jsx("a", { className: "link", href: "#terms", children: "Terms" }), " \u00B7 ", _jsx("a", { className: "link", href: "#privacy", children: "Privacy" }), " \u00B7 ", _jsx("a", { className: "link", href: "#security", children: "Security" })] })] }), error && (_jsxs("div", { className: "mt-3 callout callout-error", role: "alert", children: [_jsx("p", { children: error }), _jsxs("div", { className: "mt-2 flex gap-2 justify-center", children: [_jsx("button", { className: "btn btn-secondary", onClick: onSubmit, children: "Retry" }), _jsx("button", { className: "btn btn-secondary", onClick: () => navigator.clipboard.writeText(`curl -s -X POST -H 'Content-Type: application/json' \'${location.origin}/analyze\' -d '{"input":"${input.replace(/"/g, '\\"')}"}'`), children: "Copy curl" })] })] }))] }), recent.length > 0 && (_jsxs("section", { className: "mt-10", "aria-label": "Recent scans", children: [_jsx("h2", { className: "text-subtitle mb-2", children: "Recent scans" }), _jsx("ul", { className: "space-y-2", children: recent.map((r) => (_jsxs("li", { className: "card flex items-center justify-between p-3", children: [_jsxs("div", { children: [_jsxs("div", { className: "text-sm", children: [r.uuid.slice(0, 8), "\u2026"] }), _jsx("div", { className: "text-xs text-muted", children: r.submitted ? new Date(r.submitted).toLocaleString() : '' })] }), _jsx(Link, { className: "link", to: `/scan/${r.uuid}`, "aria-label": `Open scan ${r.uuid}`, children: r.verdict })] }, r.uuid))) })] }))] }));
}
