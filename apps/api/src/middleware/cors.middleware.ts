import type { Context, Next } from 'hono';

export async function corsMiddleware(c: Context, next: Next) {
  const origin = c.req.header('Origin') || '*';

  c.header('Access-Control-Allow-Origin', origin);
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  c.header('Access-Control-Expose-Headers', 'X-Conversation-Id, X-Agent-Type');

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
  }

  await next();
}

