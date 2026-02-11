import { generateText } from 'ai';
import { routerModel } from '../config/ai.js';
import type { MessageRole } from './base/base.agent.js';

export type AgentType = 'support' | 'order' | 'billing' | 'fallback';

export interface RouterResult {
  agent: AgentType;
  confidence: number;
  reasoning: string;
}

export class RouterAgent {
  private systemPrompt = `You are a customer support query router/Support Agent to handle user request for support/help related to orders, billing, and general inquiries related to products and swades.ai. Analyze the user's query and determine which specialized agent should handle it.

Available agents:
- ORDER: Order status, tracking, delivery updates, order cancellations, order modifications, "where is my order", "cancel my order", "my recent orders"
- BILLING: Payments, refunds, invoices, subscriptions, charges, "I need a refund", "my last invoice", "payment issue", billing disputes
- SUPPORT: General help, FAQs, account issues, troubleshooting, how-to questions, password reset, email change, return policy, shipping info, website navigation, "who are you", "what can you do", identity questions

Classification rules:
- "refund" or "invoice" or "payment" or "billing" or "charge" or "subscription" → BILLING
- "order" or "cancel" or "delivery" or "tracking" or "shipped" or "package" → ORDER
- "password" or "account" or "help" or "how" or "guide" or "faq" or "policy" or "reset" or "troubleshoot" or "support" or "who" or "what" or "identity" → SUPPORT
- Consider the conversation context when classifying
- Set confidence between 0.0 and 1.0 based on how well the query matches

You MUST respond with ONLY a valid JSON object in this exact format:
{"agent": "ORDER", "confidence": 0.95, "reasoning": "User is asking about order tracking"}

Do NOT include any text before or after the JSON. Only output the JSON object.`;

  async classify(
    userMessage: string,
    context: Array<{ role: MessageRole; content: string }>,
  ): Promise<RouterResult> {
    try {
      const result = await generateText({
        model: routerModel(),
        messages: [
          { role: 'system', content: this.systemPrompt },
          ...context.slice(-6).map(m => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
          })),
          { role: 'user', content: userMessage },
        ],
        // @ts-ignore - maxTokens is supported but type definition is missing in some versions
        maxTokens: 200,
      });

      const response = result.text.trim();

      // Try JSON parsing first
      try {
        // Extract JSON from response (handle markdown code blocks, etc.)
        const jsonMatch = response.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const agentRaw = (parsed.agent || '').toUpperCase();
          const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5;
          const reasoning = parsed.reasoning || response;

          let agent: AgentType = 'fallback';
          if (agentRaw === 'ORDER') agent = 'order';
          else if (agentRaw === 'BILLING') agent = 'billing';
          else if (agentRaw === 'SUPPORT') agent = 'support';

          // Route low-confidence to support instead of fallback
          if (confidence < 0.4) {
            agent = 'fallback';
          } else if (confidence < 0.6 && agent === 'fallback') {
            agent = 'support'; // Default to support for moderate-confidence unknowns
          }

          return { agent, confidence, reasoning };
        }
      } catch {
        // JSON parsing failed, fall through to keyword matching
      }

      // Fallback: keyword-based classification
      const lower = response.toLowerCase();
      const userLower = userMessage.toLowerCase();

      let agent: AgentType = 'support'; // Default to support, not fallback
      let confidence = 0.7;

      // Check user message keywords for more reliable classification
      // Mixed order+invoice queries → billing (has invoice tools + can reference orders)
      if (/\b(invoice|refund)\b/.test(userLower) && /\b(order)\b/.test(userLower)) {
        agent = 'billing';
        confidence = 0.9;
      } else if (/\b(order|cancel|delivery|tracking|shipped|package|shipping)\b/.test(userLower)) {
        agent = 'order';
        confidence = 0.85;
      } else if (/\b(refund|invoice|billing|payment|charge|subscription|bill)\b/.test(userLower)) {
        agent = 'billing';
        confidence = 0.85;
      } else if (/\b(password|account|help|how|guide|faq|policy|reset|troubleshoot|support|who|what|identity)\b/.test(userLower)) {
        agent = 'support';
        confidence = 0.85;
      } else if (lower.includes('order')) {
        agent = 'order';
        confidence = 0.75;
      } else if (lower.includes('billing') || lower.includes('refund') || lower.includes('invoice')) {
        agent = 'billing';
        confidence = 0.75;
      } else if (lower.includes('support')) {
        agent = 'support';
        confidence = 0.75;
      }

      return {
        agent,
        confidence,
        reasoning: response,
      };
    } catch (error) {
      console.error('Router classification error:', error);
      // On error, default to support instead of fallback
      return {
        agent: 'support',
        confidence: 0.5,
        reasoning: 'Error during classification, defaulting to support',
      };
    }
  }
}
