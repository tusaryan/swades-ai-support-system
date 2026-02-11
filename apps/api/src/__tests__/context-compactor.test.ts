import { describe, it, expect, vi } from 'vitest';

// Mock the AI model before importing compactHistory
vi.mock('../config/ai.js', () => ({
    routerModel: () => ({
        doGenerate: async () => ({ text: 'Summary of older conversation about order issues.' }),
    }),
}));

vi.mock('ai', () => ({
    generateText: async () => ({ text: 'Summary: User asked about order status and billing.' }),
}));

import { compactHistory } from '../services/conversation/context-compactor.js';

type HistoryMessage = { role: 'user' | 'assistant' | 'system' | 'data'; content: string };

function makeHistory(count: number): HistoryMessage[] {
    const msgs: HistoryMessage[] = [];
    for (let i = 0; i < count; i++) {
        msgs.push({
            role: i % 2 === 0 ? 'user' : 'assistant',
            content: `Message ${i + 1}`,
        });
    }
    return msgs;
}

describe('Context Compactor', () => {
    it('should return history as-is when below threshold', async () => {
        const history = makeHistory(5);
        const result = await compactHistory(history);
        expect(result).toEqual(history);
        expect(result.length).toBe(5);
    });

    it('should compact history when above threshold (16+ messages)', async () => {
        const history = makeHistory(20);
        const result = await compactHistory(history);
        // Should be shorter than original
        expect(result.length).toBeLessThan(history.length);
        // First message should be a system summary
        expect(result[0].role).toBe('system');
        expect(result[0].content).toContain('[Conversation Summary');
    });

    it('should keep recent messages verbatim after compaction', async () => {
        const history = makeHistory(20);
        const result = await compactHistory(history);
        // Recent 10 messages should be preserved (default RECENT_WINDOW=10)
        const recentOriginal = history.slice(-10);
        const recentCompacted = result.slice(1); // skip summary
        expect(recentCompacted).toEqual(recentOriginal);
    });

    it('should handle edge case of exactly threshold messages', async () => {
        const history = makeHistory(16);
        const result = await compactHistory(history);
        // At threshold, should still return as-is (threshold is <=)
        expect(result).toEqual(history);
    });
});
