import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from '../../src/app.js';
import { sign } from 'hono/jwt';

// Skip if no real database is available
const hasRealDb =
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes('ci@localhost');

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

describe.skipIf(!hasRealDb)('API Integration (Mocked LLM)', () => {
    let authToken = '';

    beforeEach(async () => {
        vi.clearAllMocks();
        // Dynamic import to avoid DB connection when skipped
        const { db } = await import('../../src/lib/db.js');
        const { users } = await import('../../src/db/schema.js');
        const { eq } = await import('drizzle-orm');

        const user = await db.query.users.findFirst({
            where: eq(users.email, 'sayam@swades.ai'),
        });

        if (!user) {
            return;
        }

        const secret = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
        authToken = await sign({ userId: user.id, email: user.email, type: 'access' }, secret);
    });

    it('should handle a chat request successfully', async () => {
        if (!authToken) {
            console.warn('Skipping test - no auth token (seed db first)');
            return;
        }

        const response = await app.request('http://localhost/api/chat/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                message: 'Where is my order?',
            }),
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/plain');

        const text = await response.text();
        expect(text).toContain('Order status: Processing');
    });
});
