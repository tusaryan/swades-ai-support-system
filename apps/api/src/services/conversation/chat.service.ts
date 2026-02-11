import { db } from '../../lib/db.js';
import { conversations, messages } from '../../db/schema.js';
import { RouterAgent } from '../../agents/router.agent.js';
import { OrderAgent } from '../../agents/order.agent.js';
import { SupportAgent } from '../../agents/support.agent.js';
import { BillingAgent } from '../../agents/billing.agent.js';
import type { AgentExecutionResult } from '../../agents/base/base.agent.js';
import { eq, and, desc } from 'drizzle-orm';
import { compactHistory } from './context-compactor.js';

export interface ProcessMessageResult extends AgentExecutionResult {
  agentType: string;
  conversationId: string;
}

export class ChatService {
  private router = new RouterAgent();
  private orderAgent = new OrderAgent();
  private supportAgent = new SupportAgent();
  private billingAgent = new BillingAgent();

  async createConversation(userId: string, initialMessage: string) {
    const [conversation] = await db
      .insert(conversations)
      .values({
        userId,
        title: initialMessage.slice(0, 80),
      })
      .returning();

    return conversation;
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await db.query.conversations.findFirst({
      where: and(eq(conversations.id, conversationId), eq(conversations.userId, userId)),
    });
    return conversation ?? null;
  }

  async getUserConversations(userId: string) {
    return db.query.conversations.findMany({
      where: eq(conversations.userId, userId),
      orderBy: (c, { desc: d }) => [d(c.updatedAt)],
      limit: 20,
    });
  }

  async getConversationHistory(conversationId: string) {
    const rows = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(50);

    // Oldest first for LLM context
    const ordered = rows.slice().reverse();

    return ordered.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  async deleteConversation(conversationId: string, userId: string) {
    await db.delete(messages).where(eq(messages.conversationId, conversationId));
    await db
      .delete(conversations)
      .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));
  }

  async processMessage(input: {
    message: string;
    userId: string;
    conversationId: string;
    history: Array<{ role: 'user' | 'assistant' | 'system' | 'data'; content: string }>;
  }): Promise<ProcessMessageResult> {
    const { message, userId, conversationId, history: rawHistory } = input;

    // Compact history to prevent token overflow in long conversations
    const history = await compactHistory(rawHistory);

    // Persist user message
    await db
      .insert(messages)
      .values({
        conversationId,
        role: 'user',
        content: message,
      })
      .returning();

    const routerResult = await this.router.classify(message, history);
    console.log('[ChatService] Router result:', JSON.stringify(routerResult));

    let agentResult: AgentExecutionResult;
    let agentType: string;

    if (routerResult.agent === 'order') {
      agentType = 'order';
      agentResult = await this.orderAgent.execute({
        userMessage: message,
        userId,
        conversationHistory: [...history, { role: 'user', content: message }],
        conversationId,
      });
    } else if (routerResult.agent === 'billing') {
      agentType = 'billing';
      agentResult = await this.billingAgent.execute({
        userMessage: message,
        userId,
        conversationHistory: [...history, { role: 'user', content: message }],
        conversationId,
      });
    } else if (routerResult.agent === 'support') {
      agentType = 'support';
      agentResult = await this.supportAgent.execute({
        userMessage: message,
        userId,
        conversationHistory: [...history, { role: 'user', content: message }],
        conversationId,
      });
    } else {
      // Fallback with very low confidence — still try support agent
      agentType = 'support';
      agentResult = await this.supportAgent.execute({
        userMessage: message,
        userId,
        conversationHistory: [...history, { role: 'user', content: message }],
        conversationId,
      });
    }

    // Wrap the agent stream so we can capture full text and persist it
    const persistedStream = this.persistAssistantMessage(
      agentResult.textStream,
      conversationId,
      agentType as 'order' | 'billing' | 'support',
    );

    return {
      textStream: persistedStream,
      agentType,
      conversationId,
    };
  }

  private async *persistAssistantMessage(
    stream: AsyncIterable<string>,
    conversationId: string,
    agentType: 'support' | 'order' | 'billing',
  ): AsyncIterable<string> {
    let fullText = '';
    for await (const chunk of stream) {
      console.log(`[ChatService] Chunk received: "${chunk}"`);
      fullText += chunk;
      yield chunk;
    }

    console.log(`[ChatService] Stream finished. Total length: ${fullText.length}`);

    if (fullText.trim().length > 0) {
      await db.insert(messages).values({
        conversationId,
        role: 'assistant',
        content: fullText,
        agentType,
      });

      // Touch conversation updatedAt
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    }
  }
}
