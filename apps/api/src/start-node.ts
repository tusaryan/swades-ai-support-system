import { serve } from '@hono/node-server';
import { app } from './app.js';
import { loadEnv } from './config/env.js';

const env = loadEnv();

const port = Number(env.PORT) || 3000;

console.log(`API server starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});


export type { AppType } from './app.js';
