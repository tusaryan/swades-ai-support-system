import type { Context } from 'hono';
import { RouterAgent } from '../agents/router.agent.js';

const AGENTS = [
  {
    type: 'support',
    name: 'Support Agent',
    description: 'Handles general support, FAQs, and troubleshooting.',
  },
  {
    type: 'order',
    name: 'Order Agent',
    description: 'Handles order status, tracking, and delivery questions.',
  },
  {
    type: 'billing',
    name: 'Billing Agent',
    description: 'Handles invoices, payments, and refunds.',
  },
];

export class AgentsController {
  private routerAgent = new RouterAgent();

  async listAgents(c: Context) {
    return c.json({ agents: AGENTS });
  }

  async getCapabilities(c: Context) {
    const type = c.req.param('type');

    const capabilities: Record<string, string[]> = {
      support: [
        'Answer FAQs',
        'Provide troubleshooting steps',
        'Guide account settings',
        'Route to human when needed',
      ],
      order: [
        'Check order status',
        'Provide tracking information',
        'List recent orders',
        'Explain delivery timelines',
      ],
      billing: [
        'Show invoices',
        'Explain charges',
        'Check refund status',
        'List payment methods',
      ],
    };

    const caps = capabilities[type] ?? [];
    if (caps.length === 0) {
      return c.json({ error: 'Unknown agent type' }, 404);
    }

    return c.json({ type, capabilities: caps });
  }

  async classify(c: Context) {
    try {
      const { message, context = [] } = await c.req.json<{
        message: string;
        context?: Array<{ role: 'user' | 'assistant' | 'system' | 'data'; content: string }>;
      }>();

      if (!message || message.trim().length === 0) {
        return c.json({ error: 'Message is required' }, 400);
      }

      const result = await this.routerAgent.classify(message, context);
      return c.json(result);
    } catch (error) {
      console.error('Error in classify:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
}

