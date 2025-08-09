export type AnalysisResponse = {
    status: string;
    uuid: string;
    submitted: string;
    normalized: string | null;
    verdict: 'Safe' | 'Suspicious' | 'Malicious';
    risk_score: number;
    redirect_chain: string[];
    final_url: string | null;
    whois: {
        registrar: string | null;
        created: string | null;
        updated: string | null;
        expires: string | null;
        country: string | null;
    };
    ssl: {
        issuer: string | null;
        valid_from: string | null;
        valid_to: string | null;
        sni: string | null;
    };
    domain_age_days: number | null;
    ip: string | null;
    asn: string | null;
    geo: {
        country: string | null;
        region: string | null;
        city: string | null;
    };
    detections: Record<string, string>;
    blacklists: string[];
    heuristics: Record<string, {
        pass: boolean;
        score: number;
    }>;
    model_explanations: string[];
    error?: string | null;
};
export declare function analyze(input: string, clientId?: string): Promise<AnalysisResponse>;
export declare function getScan(uuid: string): Promise<AnalysisResponse>;
