import { describe, it, expect } from 'vitest';
import { app } from '../app.js';

describe('Agents API', () => {
    describe('GET /api/agents', () => {
        it('should return a list of available agents', async () => {
            const res = await app.request('/api/agents');
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body).toHaveProperty('agents');
            expect(Array.isArray(body.agents)).toBe(true);
            expect(body.agents.length).toBeGreaterThanOrEqual(3);

            // Verify agent structure
            const agentTypes = body.agents.map((a: any) => a.type);
            expect(agentTypes).toContain('support');
            expect(agentTypes).toContain('order');
            expect(agentTypes).toContain('billing');

            // Verify each agent has required fields
            for (const agent of body.agents) {
                expect(agent).toHaveProperty('type');
                expect(agent).toHaveProperty('name');
                expect(agent).toHaveProperty('description');
            }
        });
    });

    describe('GET /api/agents/:type/capabilities', () => {
        it('should return capabilities for the support agent', async () => {
            const res = await app.request('/api/agents/support/capabilities');
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body).toHaveProperty('type', 'support');
            expect(body).toHaveProperty('capabilities');
            expect(Array.isArray(body.capabilities)).toBe(true);
            expect(body.capabilities.length).toBeGreaterThan(0);
        });

        it('should return capabilities for the order agent', async () => {
            const res = await app.request('/api/agents/order/capabilities');
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body).toHaveProperty('type', 'order');
            expect(body.capabilities.length).toBeGreaterThan(0);
        });

        it('should return capabilities for the billing agent', async () => {
            const res = await app.request('/api/agents/billing/capabilities');
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body).toHaveProperty('type', 'billing');
            expect(body.capabilities.length).toBeGreaterThan(0);
        });

        it('should return 404 for unknown agent type', async () => {
            const res = await app.request('/api/agents/unknown-agent/capabilities');
            expect(res.status).toBe(404);
            const body = await res.json();
            expect(body).toHaveProperty('error');
        });
    });
});
