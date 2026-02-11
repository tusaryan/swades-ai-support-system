import { describe, it, expect } from 'vitest';
import { app } from '../app.js';

describe('Workflow API', () => {
    it('POST /api/workflow/escalate should trigger workflow', async () => {
        const res = await app.request('/api/workflow/escalate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ticketId: 'TICKET-123',
                userEmail: 'test@example.com',
                reason: 'Integration Test'
            }),
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('runId');
    });

    it('POST /api/workflow/escalate should validate body', async () => {
        const res = await app.request('/api/workflow/escalate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                // Missing fields
                ticketId: 'TICKET-123'
            }),
        });

        expect(res.status).toBe(400);
    });
});
