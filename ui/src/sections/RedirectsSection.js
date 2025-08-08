import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function RedirectsSection({ redirects }) {
    return (_jsx("ol", { className: "relative ms-4 border-s border-border", children: redirects.map((r) => (_jsxs("li", { className: "mb-4 ms-4", children: [_jsx("div", { className: "absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full bg-accent-green" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "font-mono text-sm", children: r.domain }), _jsxs("div", { className: "text-xs text-gray-400", children: ["HTTP ", r.status] })] }), _jsxs("div", { className: "text-xs text-gray-300", children: ["Estimated risk: ", r.risk] })] }, r.index))) }));
}
