import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from '../../src/app.js';
import { db } from '../../src/lib/db.js';
import { users } from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';
import 'dotenv/config';

// Mock the Agents
vi.mock('../../src/agents/router.agent.js', () => {
    return {
        RouterAgent: vi.fn().mockImplementation(() => ({
            classify: vi.fn().mockResolvedValue({
                agent: 'order',
                confidence: 0.9,
                reasoning: 'Mocked reasoning',
            }),
        })),
    };
});



vi.mock('../../src/agents/order.agent.js', () => {
    return {
        OrderAgent: vi.fn().mockImplementation(() => ({
            execute: vi.fn().mockResolvedValue({
                textStream: (async function* () {
                    yield 'Order status: Processing';
                })(),
            }),
        })),
    };
});

vi.mock('../../src/agents/billing.agent.js', () => {
    return {
        BillingAgent: vi.fn().mockImplementation(() => ({
            execute: vi.fn().mockResolvedValue({
                textStream: (async function* () {
                    yield 'Invoice #123 is paid';
                })(),
            }),
        })),
    };
});

vi.mock('../../src/agents/support.agent.js', () => {
    return {
        SupportAgent: vi.fn().mockImplementation(() => ({
            execute: vi.fn().mockResolvedValue({
                textStream: (async function* () {
                    yield 'Here is how to reset password...';
                })(),
            }),
        })),
    };
});

describe('API Integration (Mocked LLM)', () => {
    let authToken = '';

    beforeEach(async () => {
        vi.clearAllMocks();
        // Setup auth token
        const user = await db.query.users.findFirst({
            where: eq(users.email, 'sayam@swades.ai'),
        });

        if (!user) {
            // Fallback if seed didn't run or is not available
            // For test purposes only, we might fail if no user.
            // But existing tests suggest seed runs.
            return;
        }

        const secret = process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key-change-this';
        authToken = await sign({ userId: user.id, email: user.email, type: 'access' }, secret);
    });

    it('should handle a chat request successfully', async () => {
        if (!authToken) {
            console.warn('Skipping test - no auth token (seed db first)');
            return;
        }

        // Debug routes
        console.log('Available routes:', app.routes.map(r => `${r.method} ${r.path}`));


        // Check health
        const healthRes = await app.request('/api/health');
        console.log('Health check status:', healthRes.status);
        console.log('Health check body:', await healthRes.text());

        const response = await app.request('http://localhost/api/chat/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                message: 'Where is my order?',
                // conversationId omitted to trigger creation
            })
        });

        expect(response.status).toBe(200);
        // The endpoint returns a stream. In Hono app.request(), we get a Response object.
        expect(response.headers.get('content-type')).toContain('text/plain');

        // We can read the body to verify content
        const text = await response.text();
        expect(text).toContain('Order status: Processing');
        expect(text).toContain('Order status: Processing');
    });
});
