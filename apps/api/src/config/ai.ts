import { google } from '@ai-sdk/google';
import { createOllama } from 'ai-sdk-ollama';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { loadEnv } from './env.js';
import type { LanguageModel } from 'ai';

/**
 * Central AI model configuration.
 *
 * Switch between providers by setting AI_PROVIDER in .env:
 *   gemini    → Google Gemini 2.5 Flash  (free tier available)
 *   openai    → OpenAI GPT-4o-mini       (free tier available)
 *   anthropic → Anthropic Claude Sonnet  (paid)
 *   ollama    → Local Ollama (Gemma 3)   (free, local)
 */

type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'ollama';

// Setup Local Ollama Provider (Native API)
// Normalize base URL: prefer root host (e.g. http://localhost:11434)
const rawBaseUrl = loadEnv().AI_BASE_URL || 'http://localhost:11434';
// If user supplied a url ending with /v1 or /api, strip those to leave the host root
let ollamaBaseUrl = rawBaseUrl.replace(/\/v1$|\/api$/i, '');
if (!ollamaBaseUrl) ollamaBaseUrl = 'http://localhost:11434';

// If an AI API key is provided (e.g. placeholder for local Ollama),
// forward it as an Authorization header. This lets SDKs that expect
// a key initialize properly while still using a local Ollama host.
const ollama = createOllama({
    baseURL: ollamaBaseUrl,
    headers: loadEnv().AI_API_KEY ? { Authorization: `Bearer ${loadEnv().AI_API_KEY}` } : undefined,
});

// Model mappings per provider
// Ollama uses separate models: router (no tools needed) vs agent (tool calling required)
const ollamaRouterModel = () => loadEnv().OLLAMA_ROUTER_MODEL || 'gemma3:4b';
const ollamaAgentModel = () => loadEnv().OLLAMA_AGENT_MODEL || 'qwen3:4b';

const ROUTER_MODELS: Record<AIProvider, () => LanguageModel> = {
    gemini: () => google('gemini-2.5-flash-lite') as any,
    openai: () => openai('gpt-4o-mini') as any,
    anthropic: () => anthropic('claude-3-5-sonnet-latest') as any,
    ollama: () => ollama(ollamaRouterModel()) as any,
};

const AGENT_MODELS: Record<AIProvider, () => LanguageModel> = {
    gemini: () => google('gemini-2.5-flash') as any,
    openai: () => openai('gpt-4o') as any,
    anthropic: () => anthropic('claude-3-5-sonnet-latest') as any,
    // think: true tells ai-sdk-ollama to process qwen3's reasoning tokens
    // instead of silently discarding them (which causes empty output errors)
    ollama: () => ollama(ollamaAgentModel(), { think: true }) as any,
};

function getProvider(): AIProvider {
    const provider = loadEnv().AI_PROVIDER;
    if (provider === 'openai' || provider === 'anthropic' || provider === 'gemini' || provider === 'ollama') {
        return provider;
    }
    return 'gemini'; // Default
}

/** Lightweight model for query classification (router) */
// Providers return LanguageModelV1 but we need LanguageModel type compatibility.
// Casting to any to bypass strict version checks between ai sdk and providers.
export const routerModel = () => ROUTER_MODELS[getProvider()]() as any;

/** Full model for agent responses (streaming + tool calls) */
export const agentModel = () => AGENT_MODELS[getProvider()]() as any;

export type { LanguageModel };

/** Current active provider name – useful for logging */
export const getActiveProvider = (): AIProvider => getProvider();

/** Current active model names – useful for health check */
export const getActiveModels = (): { router: string; agent: string } => {
    const provider = getProvider();
    switch (provider) {
        case 'gemini': return { router: 'gemini-2.5-flash-lite', agent: 'gemini-2.5-flash' };
        case 'openai': return { router: 'gpt-4o-mini', agent: 'gpt-4o' };
        case 'anthropic': return { router: 'claude-3-5-sonnet-latest', agent: 'claude-3-5-sonnet-latest' };
        case 'ollama': return { router: ollamaRouterModel(), agent: ollamaAgentModel() };
    }
};
