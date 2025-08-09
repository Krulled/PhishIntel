import type { AnalysisResponse } from './apiClient';
export declare function saveResult(result: AnalysisResponse): void;
export declare function getCached(uuid: string): AnalysisResponse | null;
export declare function getRecent(n?: number): {
    uuid: string;
    verdict: string;
    submitted: string;
}[];
