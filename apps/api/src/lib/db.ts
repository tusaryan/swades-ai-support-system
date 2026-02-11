import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { loadEnv } from '../config/env.js';
import * as schema from '../db/schema.js';

const env = loadEnv();

// postgres.js query client
const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
});

// Drizzle ORM instance using postgres.js client and schema
export const db = drizzle({ client: queryClient, schema });

