import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingAgent } from './billing.agent.js';

// Mock dependencies
vi.mock('ai', () => ({
    generateText: vi.fn(),
    streamText: vi.fn(),
    tool: vi.fn((config) => ({ ...config, execute: config.execute })),
}));

vi.mock('../config/ai.js', () => ({
    agentModel: vi.fn(),
}));

import { generateText, streamText } from 'ai';

describe('BillingAgent', () => {
    let agent: BillingAgent;

    beforeEach(() => {
        vi.clearAllMocks();
        agent = new BillingAgent();
    });

    it('should process a billing query and call tools', async () => {
        // Mock streamText for the response
        (streamText as any).mockResolvedValue({
            textStream: 'I can help with your invoice.',
        });

        const result = await agent.execute({
            userMessage: 'I need a refund for invoice INV-123',
            userId: 'user-1',
            conversationHistory: [],
            conversationId: 'conv-1',
        });

        expect(streamText).toHaveBeenCalled();
        const callArgs = (streamText as any).mock.calls[0][0];
        expect(callArgs.messages).toHaveLength(2); // System + User
        expect(callArgs.messages[1].content).toBe('I need a refund for invoice INV-123');
        expect(result).toHaveProperty('textStream');
    });

    it('should handle tool execution loops if mocked', async () => {
        // In a real scenario, useChat/streamText handles the loop. 
        // Here we just verify that tools are passed to streamText.

        (streamText as any).mockResolvedValue({
            textStream: 'Checking refund status...',
        });

        await agent.execute({
            userMessage: 'Status of refund?',
            userId: 'user-1',
            conversationHistory: [],
            conversationId: 'conv-1',
        });

        const callArgs = (streamText as any).mock.calls[0][0];
        expect(callArgs.tools).toHaveProperty('getLatestInvoice');
        expect(callArgs.tools).toHaveProperty('requestRefund');
    });
});
