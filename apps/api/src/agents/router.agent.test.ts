import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RouterAgent } from './router.agent.js';

// Mock dependencies
vi.mock('ai', () => ({
    generateText: vi.fn(),
}));

vi.mock('../config/ai.js', () => ({
    routerModel: vi.fn(),
}));

import { generateText } from 'ai';

describe('RouterAgent', () => {
    let agent: RouterAgent;

    beforeEach(() => {
        vi.clearAllMocks();
        agent = new RouterAgent();
    });

    it('should classify an order query correctly', async () => {
        (generateText as any).mockResolvedValue({
            text: '{"agent": "ORDER", "confidence": 0.9, "reasoning": "User asked about order tracking"}',
        });

        const result = await agent.classify('Where is my order?', []);

        expect(result.agent).toBe('order');
        expect(result.confidence).toBe(0.9);
        expect(generateText).toHaveBeenCalled();
    });

    it('should classify a billing query correctly', async () => {
        (generateText as any).mockResolvedValue({
            text: '{"agent": "BILLING", "confidence": 0.95}',
        });

        const result = await agent.classify('I need a refund', []);

        expect(result.agent).toBe('billing');
    });

    it('should fallback to support if classification fails or is low confidence', async () => {
        // Mock invalid JSON to trigger fallback logic within the agent
        (generateText as any).mockResolvedValue({
            text: 'Not a JSON response',
        });

        // The agent has keyword matching fallback
        const result = await agent.classify('How do I reset password?', []);

        // "password" is a keyword for support
        expect(result.agent).toBe('support');
    });

    it('should handle JSON parsing errors gracefully', async () => {
        (generateText as any).mockRejectedValue(new Error('API Error'));

        const result = await agent.classify('Something broken', []);

        expect(result.agent).toBe('support');
    });
});
