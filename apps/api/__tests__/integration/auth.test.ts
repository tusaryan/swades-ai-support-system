import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../../src/app.js';

// These integration tests require a real database connection.
// Skip them in CI or when DATABASE_URL is not configured.
const hasRealDb =
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes('ci@localhost');

describe.skipIf(!hasRealDb)('Auth Integration', () => {
    const testEmail = 'test-auth-user@example.com';
    const testPassword = 'Password123!';

    // Only import DB utilities inside the conditional block
    let db: any;
    let users: any;
    let eq: any;

    beforeAll(async () => {
        const dbModule = await import('../../src/lib/db.js');
        const schemaModule = await import('../../src/db/schema.js');
        const ormModule = await import('drizzle-orm');
        db = dbModule.db;
        users = schemaModule.users;
        eq = ormModule.eq;
        // Cleanup before tests
        await db.delete(users).where(eq(users.email, testEmail));
    });

    afterAll(async () => {
        if (db && users && eq) {
            await db.delete(users).where(eq(users.email, testEmail));
        }
    });

    it('should register a new user', async () => {
        const response = await app.request('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword,
                name: 'Test User',
                phoneNumber: '+15550000000',
            }),
        });

        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body).toHaveProperty('user');
        expect(body.user.email).toBe(testEmail);
        expect(body).toHaveProperty('accessToken');
    });

    it('should login with the new user', async () => {
        const response = await app.request('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword,
            }),
        });

        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body).toHaveProperty('accessToken');
        expect(body).toHaveProperty('user');
        expect(body.user.email).toBe(testEmail);
    });

    it('should fail to register with duplicate email', async () => {
        const response = await app.request('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: 'AnotherPassword123!',
                name: 'Duplicate User',
            }),
        });

        // Should fail since the email already exists
        expect([400, 500]).toContain(response.status);
    });
});
