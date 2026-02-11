import { describe, it, expect } from 'vitest';
import { app } from '../app.js';

describe('Health API', () => {
    it('GET /api/health should return 200', async () => {
        const res = await app.request('/api/health');
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('status', 'ok');
    });
});
