import { describe, it, expect } from 'vitest';
import { app } from '../../src/app.js';
import { db } from '../../src/lib/db.js';
import { users } from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';
import 'dotenv/config'; // Load .env

// Helper to delay between tests to respect rate limits
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Live Agent Integration', () => {
    let authToken = '';

    // skip if no API key is present
    if (!process.env.GEMINI_API_KEY) {
        console.warn('Skipping live agent tests - no GEMINI_API_KEY found');
        it.skip('skipping integration tests because GEMINI_API_KEY is missing', () => { });
        return;
    }

    it('should authenticate as demo user', async () => {
        const user = await db.query.users.findFirst({
            where: eq(users.email, 'sayam@swades.ai'),
        });

        if (!user) {
            throw new Error('Demo user not found. Run db:seed first.');
        }

        // Create a token manually
        const secret = process.env.JWT_SECRET || 'supersecret';
        authToken = await sign({ userId: user.id, email: user.email, type: 'access' }, secret);
    });

    it('should get a response from the Order Agent', async () => {
        await delay(2000); // Rate limit buffer

        const response = await app.request('/api/chat/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                message: 'Where is my order ORD-2025-002?',
                conversationId: 'test-conv-1'
            })
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/plain');
    }, 30000); // Extended timeout

    it('should handle general chitchat', async () => {
        await delay(2000); // Rate limit buffer

        const response = await app.request('/api/chat/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                message: 'Hello, who are you?',
                conversationId: 'test-conv-1'
            })
        });

        expect(response.status).toBe(200);
    }, 30000);
});
