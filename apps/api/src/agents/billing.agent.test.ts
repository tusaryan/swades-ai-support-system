import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingAgent } from './billing.agent.js';

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

import { streamText } from 'ai';

describe('BillingAgent', () => {
    let agent: BillingAgent;

    beforeEach(() => {
        vi.clearAllMocks();
        agent = new BillingAgent();
    });

    it('should process a billing query and call tools', async () => {
        (streamText as any).mockResolvedValue({
            textStream: 'I can help with your invoice.',
        });

        const result = await agent.execute({
            userMessage: 'I need a refund for invoice INV-123',
            userId: 'user-1',
            conversationHistory: [
                { role: 'user', content: 'I need a refund for invoice INV-123' },
            ],
            conversationId: 'conv-1',
        });

        expect(streamText).toHaveBeenCalled();
        const callArgs = (streamText as any).mock.calls[0][0];
        // System prompt + 1 user message from conversationHistory
        expect(callArgs.messages).toHaveLength(2);
        expect(callArgs.messages[1].content).toBe('I need a refund for invoice INV-123');
        expect(result).toHaveProperty('textStream');
    });

    it('should include billing tools in streamText call', async () => {
        (streamText as any).mockResolvedValue({
            textStream: 'Checking refund status...',
        });

        await agent.execute({
            userMessage: 'Status of refund?',
            userId: 'user-1',
            conversationHistory: [
                { role: 'user', content: 'Status of refund?' },
            ],
            conversationId: 'conv-1',
        });

        const callArgs = (streamText as any).mock.calls[0][0];
        // Actual tool names from billingTools
        expect(callArgs.tools).toHaveProperty('getInvoiceStatus');
        expect(callArgs.tools).toHaveProperty('requestRefund');
        expect(callArgs.tools).toHaveProperty('getLastInvoice');
        expect(callArgs.tools).toHaveProperty('listInvoices');
    });
});
