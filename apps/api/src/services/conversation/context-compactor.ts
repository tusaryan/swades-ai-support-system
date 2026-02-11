import { generateText } from 'ai';
import { routerModel } from '../../config/ai.js';

/**
 * Context Compaction Service
 *
 * Strategy: Keep the most recent N messages verbatim and summarize
 * older messages into a compact system-level summary. This prevents
 * token overflow while retaining full context of the latest exchanges
 * and a condensed version of the earlier conversation.
 *
 * Configuration:
 *  - RECENT_WINDOW: Number of latest messages to keep verbatim (default 10)
 *  - COMPACTION_THRESHOLD: Only compact when history exceeds this count (default 16)
 */

const RECENT_WINDOW = parseInt(process.env.CONTEXT_WINDOW_SIZE || '10', 10);
const COMPACTION_THRESHOLD = parseInt(process.env.COMPACTION_THRESHOLD || '16', 10);

type HistoryMessage = { role: 'user' | 'assistant' | 'system' | 'data'; content: string };

/**
 * Compacts conversation history if it exceeds the threshold.
 *
 * @param history  Full conversation history (oldest first)
 * @returns        Compacted history with a summary prefix + recent messages
 */
export async function compactHistory(history: HistoryMessage[]): Promise<HistoryMessage[]> {
    // If below threshold, return as-is — no need to compact short conversations
    if (history.length <= COMPACTION_THRESHOLD) {
        return history;
    }

    const olderMessages = history.slice(0, history.length - RECENT_WINDOW);
    const recentMessages = history.slice(history.length - RECENT_WINDOW);

    // Build a text block from older messages for summarization
    const olderText = olderMessages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n');

    try {
        const { text: summary } = await generateText({
            model: routerModel(),
            system: `You are a conversation summarizer. Produce a concise summary of the conversation below.
Focus on:
- Key topics discussed and questions asked
- Important information provided (order IDs, invoice numbers, account details, etc.)
- Decisions made or actions taken
- Any unresolved issues or pending follow-ups

Keep the summary under 200 words. Be factual and precise.`,
            prompt: olderText,
        });

        const summaryMessage: HistoryMessage = {
            role: 'system',
            content: `[Conversation Summary — earlier messages condensed]\n${summary}`,
        };

        return [summaryMessage, ...recentMessages];
    } catch (error) {
        console.error('[ContextCompaction] Summarization failed, using truncation fallback:', error);
        // Fallback: just return the recent window without a summary
        return recentMessages;
    }
}
