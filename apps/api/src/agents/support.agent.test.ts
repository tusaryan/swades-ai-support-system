import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupportAgent } from './support.agent.js';

// Mock dependencies
vi.mock('ai', () => ({
    generateText: vi.fn(),
    streamText: vi.fn(),
    tool: vi.fn((config) => ({ ...config, execute: config.execute })),
}));

vi.mock('../config/ai.js', () => ({
    agentModel: vi.fn(),
}));

import { streamText } from 'ai';

describe('SupportAgent', () => {
    let agent: SupportAgent;

    beforeEach(() => {
        vi.clearAllMocks();
        agent = new SupportAgent();
    });

    it('should process a support query and include support tools', async () => {
        (streamText as any).mockResolvedValue({
            textStream: 'I found an article about that.',
        });

        const result = await agent.execute({
            userMessage: 'How do I reset my password?',
            userId: 'user-1',
            conversationHistory: [],
            conversationId: 'conv-1',
        });

        expect(streamText).toHaveBeenCalled();
        const callArgs = (streamText as any).mock.calls[0][0];
        expect(callArgs.tools).toHaveProperty('searchArticles');
        expect(callArgs.messages.some((m: any) => m.content === 'How do I reset my password?')).toBe(true);
        expect(result).toHaveProperty('textStream');
    });
});
