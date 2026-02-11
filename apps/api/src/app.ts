import { Hono } from 'hono';
import { loggerMiddleware } from './middleware/logger.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware.js';
import { corsMiddleware } from './middleware/cors.middleware.js';
import { chatRouter } from './routes/chat.routes.js';
import { agentsRouter } from './routes/agents.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { ordersRouter } from './routes/orders.routes.js';
import { billingRouter } from './routes/billing.routes.js';
import { workflowRouter } from './routes/workflow.routes.js';
import { profileRouter } from './routes/profile.routes.js';
import { articlesRouter } from './routes/articles.routes.js';
import { streamText, generateText } from 'ai';
import { streamText as honoStream } from 'hono/streaming';
import { agentModel, routerModel } from './config/ai.js';

const app = new Hono();

// Core middlewares
app.use('*', loggerMiddleware);
app.use('*', corsMiddleware);
app.use(
  '*',
  rateLimitMiddleware({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 20,
  }),
);

// Routes
// Lightweight local test route for quickly exercising the active model (no auth)
// POST /api/chat/local-test
// Body: { message: string, mode?: 'agent'|'router' }
app.post('/api/chat/local-test', async (c) => {
  try {
    const body = (await c.req.json()) as { message?: string; mode?: 'agent' | 'router'; stream?: boolean };
    const { message, mode } = body;
    if (!message || message.trim().length === 0) {
      return c.json({ error: 'Message is required' }, 400);
    }

    const model = mode === 'router' ? routerModel() : agentModel();

    // Support a non-streaming test mode by passing { stream: false } in request body
    const doStream = body.stream !== undefined ? Boolean(body.stream) : true;

    if (!doStream) {
      const resp = await generateText({ model, messages: [{ role: 'user', content: message }] });
      return c.json({ message: resp.text });
    }

    const result = await streamText({ model: model, messages: [{ role: 'user', content: message }] });

    return honoStream(c, async (stream) => {
      for await (const chunk of result.textStream) {
        await stream.write(chunk);
      }
    });
  } catch (err) {
    console.error('Local test route error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

const routes = app
  .route('/api/chat', chatRouter)
  .route('/api/agents', agentsRouter)
  .route('/api/auth', authRouter)
  .route('/api/orders', ordersRouter)
  .route('/api/billing', billingRouter)
  .route('/api/workflow', workflowRouter)
  .route('/api/profile', profileRouter)
  .route('/api/articles', articlesRouter)
  .route('/api/health', healthRouter);

// Error handler (must be last)
app.onError(errorMiddleware);

export type AppType = typeof routes;
export { app };

