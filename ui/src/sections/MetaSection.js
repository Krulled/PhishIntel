import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function MetaSection({ ssl, dns, whois }) {
    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === 'Unknown')
            return 'Unknown';
        try {
            return new Date(dateStr).toLocaleDateString();
        }
        catch {
            return dateStr;
        }
    };
    const getRiskLevel = (ssl, dns, whois) => {
        let riskFactors = [];
        // SSL risk factors
        if (ssl.issuer === 'Unknown' || ssl.issuer?.toLowerCase().includes('unknown')) {
            riskFactors.push('SSL Certificate Issues');
        }
        // DNS risk factors
        if (dns.ageDays < 30) {
            riskFactors.push('Recently Registered Domain');
        }
        // WHOIS risk factors
        if (whois.registrar === 'Unknown' || whois.registrar?.toLowerCase().includes('unknown')) {
            riskFactors.push('Suspicious Registrar');
        }
        return riskFactors;
    };
    const riskFactors = getRiskLevel(ssl, dns, whois);
    return (_jsxs("div", { className: "space-y-4", children: [riskFactors.length > 0 && (_jsxs("div", { className: "card p-4 border-l-4 border-amber-500 bg-amber-500/10", children: [_jsx("h3", { className: "text-sm font-medium text-amber-300 mb-2", children: "\u26A0\uFE0F Risk Factors Detected" }), _jsx("ul", { className: "text-sm text-amber-200 space-y-1", children: riskFactors.map((factor, index) => (_jsxs("li", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-amber-400" }), factor] }, index))) })] })), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [_jsxs("div", { className: "card p-4", children: [_jsxs("h3", { className: "text-sm font-medium flex items-center gap-2", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-blue-500" }), "SSL Certificate"] }), _jsxs("dl", { className: "mt-3 space-y-2 text-sm", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-gray-400 text-xs", children: "Issuer" }), _jsx("dd", { className: "font-mono text-xs break-all", children: ssl.issuer === 'Unknown' ? (_jsx("span", { className: "text-red-400", children: "Unknown/Invalid" })) : (ssl.issuer) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-gray-400 text-xs", children: "Valid From" }), _jsx("dd", { className: "text-xs", children: formatDate(ssl.validFrom) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-gray-400 text-xs", children: "Valid To" }), _jsx("dd", { className: "text-xs", children: formatDate(ssl.validTo) })] })] })] }), _jsxs("div", { className: "card p-4", children: [_jsxs("h3", { className: "text-sm font-medium flex items-center gap-2", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-green-500" }), "DNS Information"] }), _jsxs("dl", { className: "mt-3 space-y-2 text-sm", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-gray-400 text-xs", children: "IP Addresses (A)" }), _jsx("dd", { className: "font-mono text-xs", children: dns.a.length > 0 ? (dns.a.map((ip, index) => (_jsx("div", { className: "break-all", children: ip }, index)))) : (_jsx("span", { className: "text-gray-500", children: "No A records" })) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-gray-400 text-xs", children: "Nameservers (NS)" }), _jsx("dd", { className: "font-mono text-xs", children: dns.ns.length > 0 ? (dns.ns.map((ns, index) => (_jsx("div", { className: "break-all", children: ns }, index)))) : (_jsx("span", { className: "text-gray-500", children: "No NS records" })) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-gray-400 text-xs", children: "Domain Age" }), _jsx("dd", { className: "text-xs", children: dns.ageDays > 0 ? (_jsxs("span", { className: dns.ageDays < 30 ? 'text-amber-400' : 'text-green-400', children: [dns.ageDays, " days", dns.ageDays < 30 && _jsx("span", { className: "ml-1 text-xs", children: "\u26A0\uFE0F New" })] })) : (_jsx("span", { className: "text-gray-500", children: "Unknown" })) })] })] })] }), _jsxs("div", { className: "card p-4", children: [_jsxs("h3", { className: "text-sm font-medium flex items-center gap-2", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-purple-500" }), "WHOIS Information"] }), _jsxs("dl", { className: "mt-3 space-y-2 text-sm", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-gray-400 text-xs", children: "Registrar" }), _jsx("dd", { className: "text-xs break-all", children: whois.registrar === 'Unknown' ? (_jsx("span", { className: "text-red-400", children: "Unknown/Invalid" })) : (whois.registrar) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-gray-400 text-xs", children: "Registration Date" }), _jsx("dd", { className: "text-xs", children: formatDate(whois.created) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-gray-400 text-xs", children: "Status" }), _jsx("dd", { className: "text-xs", children: whois.registrar === 'Unknown' ? (_jsx("span", { className: "text-red-400", children: "Suspicious" })) : (_jsx("span", { className: "text-green-400", children: "Valid" })) })] })] })] })] }), _jsxs("div", { className: "card p-4 bg-gray-800/50", children: [_jsx("h3", { className: "text-sm font-medium mb-2", children: "\uD83D\uDD0D Analysis Notes" }), _jsxs("div", { className: "text-xs text-gray-300 space-y-1", children: [_jsx("p", { children: "\u2022 SSL certificates from unknown issuers may indicate security risks" }), _jsx("p", { children: "\u2022 Domains registered less than 30 days ago are considered suspicious" }), _jsx("p", { children: "\u2022 Unknown or invalid registrar information suggests potential fraud" }), _jsx("p", { children: "\u2022 Multiple IP addresses may indicate load balancing or CDN usage" })] })] })] }));
}
