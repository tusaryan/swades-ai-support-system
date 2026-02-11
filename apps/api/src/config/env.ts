import { z } from 'zod';
import 'dotenv/config';

const aiProviderEnum = z.enum(['gemini', 'openai', 'anthropic', 'ollama']).default('gemini');

const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST;

const envSchema = z
  .object({
    DATABASE_URL: z.string().default('postgresql://ci:ci@localhost:5432/ci'),
    JWT_ACCESS_SECRET: z.string().min(1).default(isTest ? 'test-access-secret' : ''),
    JWT_REFRESH_SECRET: z.string().min(1).default(isTest ? 'test-refresh-secret' : ''),
    JWT_ACCESS_EXPIRY: z.string().default('30m'),
    JWT_REFRESH_EXPIRY: z.string().default('7d'),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(20),

    // AI provider selection
    AI_PROVIDER: aiProviderEnum,

    // AI Configuration
    AI_BASE_URL: z.string().optional(), // For local providers like Ollama
    AI_API_KEY: z.string().optional(),  // Generic key for local/other providers

    // Ollama model names (router doesn't need tool support, agents do)
    OLLAMA_ROUTER_MODEL: z.string().default('gemma3:4b'),  // For classification (no tools)
    OLLAMA_AGENT_MODEL: z.string().default('qwen3:4b'),    // For agents (needs tool calling)

    // API keys – only the active provider's key is required
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
  })
  .refine(
    (env) => {
      // Skip API key validation in test/CI environments
      if (env.NODE_ENV === 'test') return true;
      switch (env.AI_PROVIDER) {
        case 'gemini':
          return !!env.GOOGLE_GENERATIVE_AI_API_KEY;
        case 'openai':
          return !!env.OPENAI_API_KEY;
        case 'anthropic':
          return !!env.ANTHROPIC_API_KEY;
        case 'ollama':
          return true;
      }
    },
    (env) => ({
      message: `API key missing for selected AI provider "${env.AI_PROVIDER}". ` +
        `Set ${env.AI_PROVIDER === 'gemini' ? 'GOOGLE_GENERATIVE_AI_API_KEY' : env.AI_PROVIDER === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'}.`,
    }),
  );

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}
