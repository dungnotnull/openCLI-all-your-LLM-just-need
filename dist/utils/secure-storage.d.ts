export declare function setApiKey(provider: string, key: string): Promise<void>;
export declare function getApiKey(provider: string): Promise<string | null>;
export declare function deleteApiKey(provider: string): Promise<void>;
export declare function getApiKeyOrEnv(provider: string, envVar: string): string | null;
export declare function listProviders(): Promise<string[]>;
//# sourceMappingURL=secure-storage.d.ts.map