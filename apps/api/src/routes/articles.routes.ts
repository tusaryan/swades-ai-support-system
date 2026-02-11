import { Hono } from 'hono';
import { db } from '../lib/db.js';
import { supportArticles } from '../db/schema.js';

// Public route — no auth required (for homepage FAQ)
export const articlesRouter = new Hono()
    .get('/', async (c) => {
        const articles = await db.select().from(supportArticles);
        return c.json(articles);
    });
