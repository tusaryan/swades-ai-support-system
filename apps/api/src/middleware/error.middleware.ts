import type { Context } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';

export class AppError extends Error {
  statusCode: StatusCode;
  isOperational: boolean;

  constructor(message: string, statusCode: StatusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export async function errorMiddleware(err: Error, c: Context) {
  if (err instanceof AppError) {
    c.status(err.statusCode);
    return c.json({
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  console.error('Unexpected error:', err);

  c.status(500);
  return c.json({
    error: 'Internal server error',
    statusCode: 500,
  });
}

