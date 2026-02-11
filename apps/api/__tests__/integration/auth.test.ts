import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { db } from '../../src/lib/db.js';
import { users } from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';

describe('Auth Integration', () => {
    const testEmail = 'test-auth-user@example.com';
    const testPassword = 'Password123!';

    // Cleanup before and after
    const cleanup = async () => {
        await db.delete(users).where(eq(users.email, testEmail));
    };

    beforeAll(async () => {
        await cleanup();
    });

    afterAll(async () => {
        await cleanup();
    });

    it('should register a new user with phone number and role', async () => {
        const response = await app.request('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword,
                fullName: 'Test User',
                phoneNumber: '+15550000000',
                role: 'customer'
            })
        });

        expect(response.status).toBe(201);
        const body = await response.json();
        expect(body).toHaveProperty('user');
        expect(body.user.email).toBe(testEmail);
        expect(body.user.role).toBe('customer');
        // PhoneNumber might not be returned in simple user object depending on implementation, 
        // but we can check the DB or login.
    });

    it('should login with the new user', async () => {
        const response = await app.request('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword
            })
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('token');
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
                fullName: 'Duplicate User'
            })
        });

        expect(response.status).toBe(400); // Or 409 depending on controller
    });
});
