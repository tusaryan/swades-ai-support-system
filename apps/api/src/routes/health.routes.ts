import { Hono } from 'hono';
import { getActiveProvider, getActiveModels } from '../config/ai.js';

export const healthRouter = new Hono()
  .get('/', (c) => c.json({
    status: 'ok',
    uptime: process.uptime(),
    ai: {
      provider: getActiveProvider(),
      models: getActiveModels(),
    },
  }));


