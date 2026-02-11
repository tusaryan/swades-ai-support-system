import { hc } from 'hono/client';
import type { AppType } from 'api';

const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const client = hc<AppType>(apiUrl);
