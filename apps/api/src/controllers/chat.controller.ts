import type { Context } from 'hono';
import { streamText as honoStream } from 'hono/streaming';
import { ChatService } from '../services/conversation/chat.service.js';

/**
 * Classifies errors from LLM providers into user-facing categories.
 */
function classifyLLMError(error: unknown): {
  errorType: string;
  message: string;
  statusCode: number;
} {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errName = error instanceof Error ? error.name : '';

  // Rate limit errors (429 from providers)
  if (
    errMsg.includes('429') ||
    errMsg.toLowerCase().includes('rate limit') ||
    errMsg.toLowerCase().includes('quota') ||
    errMsg.toLowerCase().includes('too many requests') ||
    errMsg.toLowerCase().includes('resource exhausted') ||
    errMsg.toLowerCase().includes('rate_limit_exceeded')
  ) {
    return {
      errorType: 'rate_limit',
      message:
        'The AI service is currently rate-limited. Please wait a moment and try again.',
      statusCode: 429,
    };
  }

  // API key errors (401/403)
  if (
    errMsg.includes('401') ||
    errMsg.includes('403') ||
    errMsg.toLowerCase().includes('api key') ||
    errMsg.toLowerCase().includes('authentication') ||
    errMsg.toLowerCase().includes('unauthorized') ||
    errMsg.toLowerCase().includes('invalid key') ||
    errMsg.toLowerCase().includes('permission denied')
  ) {
    return {
      errorType: 'api_key_invalid',
      message:
        'AI service authentication failed. Please check the API key configuration.',
      statusCode: 502,
    };
  }

  // Model unavailable
  if (
    errMsg.toLowerCase().includes('model not found') ||
    errMsg.toLowerCase().includes('model_not_found') ||
    errMsg.toLowerCase().includes('not available') ||
    errMsg.toLowerCase().includes('does not exist') ||
    errMsg.toLowerCase().includes('connection refused') ||
    errMsg.toLowerCase().includes('econnrefused') ||
    errMsg.toLowerCase().includes('fetch failed')
  ) {
    return {
      errorType: 'model_unavailable',
      message:
        'The AI model is currently unavailable. Please try again later or switch providers.',
      statusCode: 503,
    };
  }

  // Token / context length errors
  if (
    errMsg.toLowerCase().includes('token') ||
    errMsg.toLowerCase().includes('context length') ||
    errMsg.toLowerCase().includes('too long')
  ) {
    return {
      errorType: 'context_overflow',
      message:
        'The conversation is too long for the AI model. Try starting a new conversation.',
      statusCode: 413,
    };
  }

  // Generic
  return {
    errorType: 'internal',
    message: 'An unexpected error occurred while processing your message. Please try again.',
    statusCode: 500,
  };
}

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  async sendMessage(c: Context) {
    try {
      const userId = c.get('userId') as string | undefined;
      if (!userId) {
        return c.json({ error: 'Unauthorized', errorType: 'unauthorized' }, 401);
      }

      const { message, conversationId } = await c.req.json<{
        message: string;
        conversationId?: string;
      }>();

      if (!message || message.trim().length === 0) {
        return c.json({ error: 'Message is required', errorType: 'validation' }, 400);
      }

      const conversation = conversationId
        ? await this.chatService.getConversation(conversationId, userId)
        : await this.chatService.createConversation(userId, message);

      if (!conversation) {
        return c.json({ error: 'Conversation not found', errorType: 'not_found' }, 404);
      }

      const history = await this.chatService.getConversationHistory(conversation.id);

      const streamResult = await this.chatService.processMessage({
        message,
        userId,
        conversationId: conversation.id,
        history,
      });

      // Set metadata headers before streaming — frontends can read these
      c.header('X-Conversation-Id', streamResult.conversationId);
      c.header('X-Agent-Type', streamResult.agentType);
      c.header('Access-Control-Expose-Headers', 'X-Conversation-Id, X-Agent-Type');

      return honoStream(c, async (stream) => {
        try {
          // Emit phase marker: routing complete, now responding
          await stream.write(`\n__PHASE:routing__\n`);

          let chunkCount = 0;
          let hasError = false;

          // Small delay to let frontend read phase marker
          await stream.write(`\n__PHASE:responding__\n`);

          for await (const chunk of streamResult.textStream) {
            chunkCount++;
            await stream.write(chunk);
          }

          if (chunkCount === 0 && !hasError) {
            await stream.write('I apologize, but I was unable to generate a response. Please try again.');
          }

          console.log(`[ChatController] Stream finished. Agent: ${streamResult.agentType}, Chunks: ${chunkCount}`);
        } catch (streamError) {
          console.error('[ChatController] Stream error:', streamError);
          const classified = classifyLLMError(streamError);
          await stream.write(`\n__ERROR:${JSON.stringify({ errorType: classified.errorType, message: classified.message })}__\n`);
        }
      });
    } catch (error) {
      console.error('Error in sendMessage:', error);

      // Classify LLM-specific errors for better frontend display
      const classified = classifyLLMError(error);
      return c.json(
        { error: classified.message, errorType: classified.errorType },
        classified.statusCode as any,
      );
    }
  }

  async getConversations(c: Context) {
    try {
      const userId = c.get('userId') as string | undefined;
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const conversations = await this.chatService.getUserConversations(userId);
      return c.json({ conversations });
    } catch (error) {
      console.error('Error in getConversations:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async getConversation(c: Context) {
    try {
      const userId = c.get('userId') as string | undefined;
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
      const conversationId = c.req.param('id');

      const conversation = await this.chatService.getConversation(conversationId, userId);
      if (!conversation) {
        return c.json({ error: 'Conversation not found' }, 404);
      }

      const messages = await this.chatService.getConversationHistory(conversationId);
      return c.json({ conversation, messages });
    } catch (error) {
      console.error('Error in getConversation:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async deleteConversation(c: Context) {
    try {
      const userId = c.get('userId') as string | undefined;
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
      const conversationId = c.req.param('id');

      await this.chatService.deleteConversation(conversationId, userId);
      return c.json({ success: true });
    } catch (error) {
      console.error('Error in deleteConversation:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
}
