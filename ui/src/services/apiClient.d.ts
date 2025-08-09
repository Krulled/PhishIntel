export type Verdict = 'Safe' | 'Suspicious' | 'Malicious';
export type ScanResult = {
    status: string;
    verdict: Verdict;
    uuid: string;
    submitted: string;
    normalized: string;
    redirect_chain: string[];
    final_url: string;
    whois: {
        registrar: string;
        created: string;
        updated: string;
        expires: string;
        country: string;
    };
    ssl: {
        issuer: string;
        valid_from: string;
        valid_to: string;
        sni: string;
    };
    domain_age_days: number;
    ip: string;
    asn: string;
    geolocation: {
        country: string;
        region: string;
        city: string;
    };
    detections: Record<string, unknown>;
    blacklists: string[];
    heuristics: Record<string, {
        pass?: boolean;
        score?: number;
    } | unknown>;
    model_explanations: string[];
    risk_score: number;
    error?: string;
};
export declare function analyze(inputValue: string): Promise<{
    result: ScanResult;
    curl: string;
}>;
export declare function getScan(uuid: string): Promise<ScanResult | null>;
export declare function fetchRecentRemote(): Promise<string[]>;
export declare function saveRecent(uuid: string): void;
export declare function getRecent(): string[];
