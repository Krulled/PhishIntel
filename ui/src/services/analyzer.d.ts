export type SafeAnalysisResult = {
    url: string;
    submittedAt: string;
    riskScore: number;
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    findings: {
        id: string;
        title: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        description?: string;
    }[];
    redirects: {
        index: number;
        domain: string;
        status: number;
        risk: 'low' | 'medium' | 'high';
    }[];
    ssl: {
        issuer: string;
        validFrom: string;
        validTo: string;
    };
    dns: {
        a: string[];
        ns: string[];
        ageDays: number;
    };
    whois: {
        registrar: string;
        created: string;
    };
    headers: {
        name: string;
        value: string;
        suspicious?: boolean;
    }[];
    contentSignals: string[];
    screenshot?: string;
    ai_reasoning?: string;
    phish_detection?: string;
};
export declare function getAnalysis(url: string): Promise<SafeAnalysisResult>;
