import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderAgent } from './order.agent.js';

// Mock dependencies
vi.mock('ai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('ai')>();
    return {
        ...actual,
        generateText: vi.fn(),
        streamText: vi.fn(),
        tool: vi.fn((config: any) => ({ ...config, execute: config.execute })),
    };
});

vi.mock('../config/ai.js', () => ({
    agentModel: vi.fn(),
}));

import { generateText, streamText } from 'ai';

describe('OrderAgent', () => {
    let agent: OrderAgent;

    beforeEach(() => {
        vi.clearAllMocks();
        agent = new OrderAgent();
    });

    it('should process a user message and call tools if needed', async () => {
        // Mock streamText to return a tool call
        (streamText as any).mockResolvedValue({
            textStream: 'Checking order...',
            toolCalls: [
                {
                    toolCallId: 'call_1',
                    toolName: 'getOrderById',
                    args: { orderId: 'ORD-123' },
                },
            ],
            toolResults: [],
        });

        const result = await agent.execute({
            userMessage: 'Where is order ORD-123?',
            userId: 'user-1',
            conversationHistory: [],
            conversationId: 'conv-1',
        });

        expect(streamText).toHaveBeenCalled();
        expect(result).toHaveProperty('textStream');
    });

    it('should directly stream response if no tools are needed', async () => {
        // Mock streamText for direct response
        (streamText as any).mockResolvedValue({
            textStream: 'Mocked stream',
            toolCalls: [],
        });

        const result = await agent.execute({
            userMessage: 'Hello',
            userId: 'user-1',
            conversationHistory: [],
            conversationId: 'conv-1',
        });

        expect(streamText).toHaveBeenCalled();
        expect(result).toHaveProperty('textStream');
    });
});
