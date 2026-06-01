import { z } from "zod";
declare const configSchema: z.ZodObject<{
    provider: z.ZodDefault<z.ZodString>;
    model: z.ZodDefault<z.ZodString>;
    apiKey: z.ZodOptional<z.ZodString>;
    budget: z.ZodOptional<z.ZodObject<{
        sessionMaxUsd: z.ZodDefault<z.ZodNumber>;
        dailyMaxUsd: z.ZodDefault<z.ZodNumber>;
        monthlyMaxUsd: z.ZodDefault<z.ZodNumber>;
        warnAtPercent: z.ZodDefault<z.ZodNumber>;
        hardStop: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        sessionMaxUsd: number;
        dailyMaxUsd: number;
        monthlyMaxUsd: number;
        warnAtPercent: number;
        hardStop: boolean;
    }, {
        sessionMaxUsd?: number | undefined;
        dailyMaxUsd?: number | undefined;
        monthlyMaxUsd?: number | undefined;
        warnAtPercent?: number | undefined;
        hardStop?: boolean | undefined;
    }>>;
    providers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        apiKey: z.ZodOptional<z.ZodString>;
        baseUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        apiKey?: string | undefined;
        baseUrl?: string | undefined;
    }, {
        apiKey?: string | undefined;
        baseUrl?: string | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    provider: string;
    model: string;
    apiKey?: string | undefined;
    budget?: {
        sessionMaxUsd: number;
        dailyMaxUsd: number;
        monthlyMaxUsd: number;
        warnAtPercent: number;
        hardStop: boolean;
    } | undefined;
    providers?: Record<string, {
        apiKey?: string | undefined;
        baseUrl?: string | undefined;
    }> | undefined;
}, {
    provider?: string | undefined;
    model?: string | undefined;
    apiKey?: string | undefined;
    budget?: {
        sessionMaxUsd?: number | undefined;
        dailyMaxUsd?: number | undefined;
        monthlyMaxUsd?: number | undefined;
        warnAtPercent?: number | undefined;
        hardStop?: boolean | undefined;
    } | undefined;
    providers?: Record<string, {
        apiKey?: string | undefined;
        baseUrl?: string | undefined;
    }> | undefined;
}>;
export type OpenCliConfig = z.infer<typeof configSchema>;
export declare function loadConfig(): Promise<OpenCliConfig>;
export declare function validateConfig(config: unknown): OpenCliConfig;
export {};
//# sourceMappingURL=config.d.ts.map