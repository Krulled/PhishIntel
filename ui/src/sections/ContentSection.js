import { jsx as _jsx } from "react/jsx-runtime";
export default function ContentSection({ signals }) {
    return (_jsx("div", { children: signals.length === 0 ? (_jsx("p", { className: "text-sm text-gray-400", children: "No suspicious signals detected." })) : (_jsx("ul", { className: "mt-2 grid gap-2 sm:grid-cols-2", children: signals.map((s, i) => (_jsx("li", { className: "rounded-lg bg-muted px-3 py-2 text-sm", children: s }, i))) })) }));
}
