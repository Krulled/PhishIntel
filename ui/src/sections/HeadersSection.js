import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function HeadersSection({ headers }) {
    return (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { className: "text-gray-400", children: _jsxs("tr", { children: [_jsx("th", { className: "py-2", children: "Name" }), _jsx("th", { className: "py-2", children: "Value" })] }) }), _jsx("tbody", { children: headers.map((h, i) => (_jsxs("tr", { className: h.suspicious ? 'bg-red-500/10' : '', children: [_jsx("td", { className: "py-2 align-top font-mono", children: h.name }), _jsx("td", { className: "py-2 align-top break-all", children: h.value })] }, i))) })] }) }));
}
