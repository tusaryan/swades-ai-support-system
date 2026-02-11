import type { Context, Next } from 'hono';

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(options: { windowMs: number; max: number }) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const now = Date.now();

    let record = requestCounts.get(ip);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + options.windowMs };
      requestCounts.set(ip, record);
    } else {
      record.count++;
    }

    // Set informational headers on every response
    const remaining = Math.max(0, options.max - record.count);
    c.header('X-RateLimit-Limit', String(options.max));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));

    if (record.count > options.max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      c.header('Retry-After', String(retryAfterSec));
      return c.json(
        {
          error: 'Too many requests. Please slow down.',
          errorType: 'rate_limit',
          retryAfter: retryAfterSec,
        },
        429,
      );
    }

    await next();
  };
}
