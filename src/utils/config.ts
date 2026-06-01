import { cosmiconfig } from "cosmiconfig";
import { z } from "zod";

const configSchema = z.object({
  provider: z.string().default("deepseek"),
  model: z.string().default("deepseek-v3"),
  apiKey: z.string().optional(),
  budget: z
    .object({
      sessionMaxUsd: z.number().default(1.0),
      dailyMaxUsd: z.number().default(5.0),
      monthlyMaxUsd: z.number().default(50.0),
      warnAtPercent: z.number().default(80),
      hardStop: z.boolean().default(true),
    })
    .optional(),
  providers: z
    .record(
      z.object({
        apiKey: z.string().optional(),
        baseUrl: z.string().optional(),
      })
    )
    .optional(),
});

export type OpenCliConfig = z.infer<typeof configSchema>;

const explorer = cosmiconfig("opencli", {
  searchPlaces: [
    "~/.opencli/config.yml",
    "~/.opencli/config.yaml",
    ".openclirc",
    ".openclirc.json",
  ],
});

export async function loadConfig(): Promise<OpenCliConfig> {
  const result = await explorer.search();
  const raw = result?.config ?? {};

  try {
    return configSchema.parse(raw);
  } catch (error) {
    console.error("Invalid config format:", error);
    return configSchema.parse({});
  }
}

export function validateConfig(config: unknown): OpenCliConfig {
  return configSchema.parse(config);
}
