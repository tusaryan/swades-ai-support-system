import type { Context, Next } from 'hono';

export async function loggerMiddleware(c: Context, next: Next) {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  const method = c.req.method;
  const path = c.req.path;
  const status = c.res.status;
  console.log(`${method} ${path} -> ${status} (${duration}ms)`);
}

