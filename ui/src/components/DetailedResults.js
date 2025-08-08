import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
export default function DetailedResults({ data }) {
    const [showRaw, setShowRaw] = useState(false);
    // Create the detailed analysis object similar to the backend output
    const detailedAnalysis = {
        ai_analysis: {
            phish: data.phish_detection || 'unknown',
            reasoning: data.ai_reasoning || 'No AI analysis available',
            screenshot: data.screenshot || null,
            urlscan: {
                ssl: {
                    issuer: data.ssl.issuer,
                    valid_from: data.ssl.validFrom,
                    valid_days: data.ssl.validTo,
                    age_days: data.dns.ageDays
                },
                dns: {
                    a: data.dns.a,
                    ns: data.dns.ns,
                    domain: new URL(data.url).hostname,
                    ip: data.dns.a[0] || null,
                    ptr: null
                },
                whois: data.whois.registrar !== 'Unknown' ? {
                    registrar: data.whois.registrar,
                    created: data.whois.created
                } : {}
            }
        },
        ai_traditional_analysis: false,
        url: data.url,
        virus_total: {
            malicious_count: 0,
            total_engines: 91
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex justify-center", children: _jsxs("button", { onClick: () => setShowRaw(!showRaw), className: "btn btn-secondary", children: [showRaw ? 'Hide' : 'Show', " Detailed Analysis"] }) }), showRaw && (_jsxs("div", { className: "card p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4 text-center", children: "Detailed Analysis Results" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "border border-border rounded-lg p-4", children: [_jsx("h4", { className: "font-semibold text-blue-400 mb-2", children: "AI Analysis" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Phishing Detection:" }), _jsx("span", { className: `font-mono ${detailedAnalysis.ai_analysis.phish === 'yes' ? 'text-red-400' :
                                                            detailedAnalysis.ai_analysis.phish === 'no' ? 'text-green-400' :
                                                                'text-yellow-400'}`, children: detailedAnalysis.ai_analysis.phish })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "Reasoning:" }), _jsx("p", { className: "text-sm mt-1", children: detailedAnalysis.ai_analysis.reasoning })] }), detailedAnalysis.ai_analysis.screenshot && (_jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "Screenshot:" }), _jsx("p", { className: "text-xs mt-1 break-all text-blue-400", children: detailedAnalysis.ai_analysis.screenshot })] }))] })] }), _jsxs("div", { className: "border border-border rounded-lg p-4", children: [_jsx("h4", { className: "font-semibold text-green-400 mb-2", children: "URLScan.io Data" }), _jsxs("div", { className: "mb-4", children: [_jsx("h5", { className: "font-medium text-yellow-400 mb-2", children: "SSL Certificate" }), _jsxs("div", { className: "space-y-1 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Issuer:" }), _jsx("span", { className: "font-mono", children: detailedAnalysis.ai_analysis.urlscan.ssl.issuer })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Valid From:" }), _jsx("span", { className: "font-mono", children: detailedAnalysis.ai_analysis.urlscan.ssl.valid_from })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Valid Days:" }), _jsx("span", { className: "font-mono", children: detailedAnalysis.ai_analysis.urlscan.ssl.valid_days })] })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("h5", { className: "font-medium text-purple-400 mb-2", children: "DNS Records" }), _jsxs("div", { className: "space-y-1 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "A Records:" }), _jsx("span", { className: "font-mono", children: detailedAnalysis.ai_analysis.urlscan.dns.a.length > 0
                                                                    ? JSON.stringify(detailedAnalysis.ai_analysis.urlscan.dns.a)
                                                                    : 'No A records' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "NS Records:" }), _jsx("span", { className: "font-mono", children: detailedAnalysis.ai_analysis.urlscan.dns.ns.length > 0
                                                                    ? JSON.stringify(detailedAnalysis.ai_analysis.urlscan.dns.ns)
                                                                    : 'No NS records' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Domain:" }), _jsx("span", { className: "font-mono", children: detailedAnalysis.ai_analysis.urlscan.dns.domain })] })] })] }), _jsxs("div", { children: [_jsx("h5", { className: "font-medium text-cyan-400 mb-2", children: "WHOIS Data" }), _jsx("div", { className: "space-y-1 text-sm", children: Object.keys(detailedAnalysis.ai_analysis.urlscan.whois).length > 0 ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Registrar:" }), _jsx("span", { className: "font-mono", children: detailedAnalysis.ai_analysis.urlscan.whois.registrar })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Created:" }), _jsx("span", { className: "font-mono", children: detailedAnalysis.ai_analysis.urlscan.whois.created })] })] })) : (_jsx("span", { className: "text-gray-500", children: "No WHOIS data available" })) })] })] }), _jsxs("div", { className: "border border-border rounded-lg p-4", children: [_jsx("h4", { className: "font-semibold text-orange-400 mb-2", children: "Raw JSON Output" }), _jsx("pre", { className: "text-xs bg-gray-900 p-4 rounded overflow-x-auto", children: _jsx("code", { children: JSON.stringify(detailedAnalysis, null, 2) }) })] })] })] }))] }));
}
