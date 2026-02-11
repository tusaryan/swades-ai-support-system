// @ts-nocheck
import { tool } from 'ai';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { messages } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export const conversationTools = (conversationId: string) => ({
  getRecentHistory: tool({
    description: 'Get recent conversation history with the support assistant',
    parameters: z.object({
      limit: z.number().int().min(1).max(20).default(10),
    }),
    execute: async (args: any) => {
      try {
        const { limit } = args;
        const history = await db.query.messages.findMany({
          where: eq(messages.conversationId, conversationId),
          orderBy: desc(messages.createdAt),
          limit: limit,
        });

        return history.reverse().map((msg) => ({
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
        }));
      } catch (error) {
        console.error('Error fetching conversation messages:', error);
        return { error: 'Failed to fetch messages' };
      }
    },
  }),
});
