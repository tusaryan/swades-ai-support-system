import { describe, it, expect, vi } from 'vitest';
import { app } from '../app.js';

// Mock the workflow API to avoid needing a real workflow service
vi.mock('workflow/api', () => ({
    start: vi.fn().mockResolvedValue('mock-run-id-123'),
}));

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
                reason: 'Integration Test',
            }),
        });

        expect(res.status).toBe(200);
        const body = (await res.json()) as any;
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
                ticketId: 'TICKET-123',
            }),
        });

        expect(res.status).toBe(400);
    });
});
