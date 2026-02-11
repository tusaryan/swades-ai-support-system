export type AgentRole = 'support' | 'order' | 'billing';

export type MessageRole = 'user' | 'assistant' | 'system' | 'data';

export interface AgentExecutionParams {
  userMessage: string;
  userId: string;
  conversationId?: string;
  conversationHistory: Array<{ role: MessageRole; content: string }>;
}

export interface AgentExecutionResult {
  // Vercel AI SDK stream result is passed through
  textStream: AsyncIterable<string>;
}

export abstract class BaseAgent {
  abstract execute(params: AgentExecutionParams): Promise<AgentExecutionResult>;
}

