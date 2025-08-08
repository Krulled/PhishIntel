import type { SafeAnalysisResult } from './analyzer';
export declare function saveResult(id: string, result: SafeAnalysisResult): Promise<void>;
export declare function getResult(id: string): Promise<SafeAnalysisResult | undefined>;
