import { tool } from 'ai';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { supportArticles } from '../db/schema.js';
import { eq, ilike, or, sql } from 'drizzle-orm';

// --- Zod Schemas ---
const searchArticlesSchema = z.object({
  query: z.string().describe('The search query for support articles'),
});

const getArticleSchema = z.object({
  articleId: z.string().describe('The ID of the article to retrieve'),
});

const getArticlesByCategorySchema = z.object({
  category: z.string().describe('The category to filter by (e.g., "billing", "shipping", "account")'),
});

type SearchArticlesArgs = z.infer<typeof searchArticlesSchema>;
type GetArticleArgs = z.infer<typeof getArticleSchema>;
type GetArticlesByCategoryArgs = z.infer<typeof getArticlesByCategorySchema>;

// Fallback data in case DB is empty or connection fails
const FALLBACK_ARTICLES = [
  {
    id: 'fallback_001',
    title: 'Return & Refund Policy',
    category: 'billing',
    tags: ['refund', 'return', 'policy', 'money back'],
    content: `We offer a 30-day return policy for most items. To initiate a return:
1. Contact support within 30 days of delivery
2. Provide your order number and reason for return
3. We'll send you a return label via email
4. Ship the item back using our prepaid label
5. Refunds are processed within 5-7 business days after we receive the item

Items must be in original condition with tags attached.`,
  },
  {
    id: 'fallback_002',
    title: 'Shipping Information',
    category: 'orders',
    tags: ['shipping', 'delivery', 'time', 'cost'],
    content: `Standard shipping takes 5-7 business days. Express shipping takes 2-3 business days. 
Free shipping is available on orders over $100. International shipping may take up to 14 days depending on customs.`,
  },
  {
    id: 'fallback_003',
    title: 'Payment Methods',
    category: 'billing',
    tags: ['payment', 'card', 'paypal', 'apple pay'],
    content: `We accept Visa, Mastercard, American Express, PayPal, and Apple Pay. We do not accept cash on delivery.`,
  },
  {
    id: 'fallback_004',
    title: 'How to Track Order',
    category: 'orders',
    tags: ['track', 'tracking', 'where is my order'],
    content: `Log in to your account and go to "My Orders". Click on the order to view its tracking status and number.`,
  }
];

export const supportTools = {
  searchArticles: tool({
    description: 'Search for help center articles based on a query. Use this to find relevant information for user questions about policies, returns, shipping, etc.',
    parameters: searchArticlesSchema,
    execute: async ({ query }: SearchArticlesArgs) => {
      const lowerQuery = `%${query.toLowerCase()}%`;

      try {
        const results = await db
          .select({
            id: supportArticles.id,
            title: supportArticles.title,
            category: supportArticles.category,
            tags: supportArticles.tags,
            content: supportArticles.content
          })
          .from(supportArticles)
          .where(
            or(
              ilike(supportArticles.title, lowerQuery),
              ilike(supportArticles.content, lowerQuery),
            )
          )
          .limit(3);

        if (results.length > 0) return results;
      } catch (error) {
        console.error("Database search failed, using fallback:", error);
      }

      // Fallback search
      const fallbackResults = FALLBACK_ARTICLES.filter(a =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.content.toLowerCase().includes(query.toLowerCase()) ||
        a.tags.some(t => t.includes(query.toLowerCase()))
      );

      return fallbackResults.slice(0, 3);
    },
  } as any),

  getArticle: tool({
    description: 'Get the full content of a specific help article by ID',
    parameters: getArticleSchema,
    execute: async ({ articleId }: GetArticleArgs) => {
      try {
        const result = await db
          .select()
          .from(supportArticles)
          .where(eq(supportArticles.id, articleId))
          .limit(1);

        if (result.length > 0) return result[0];
      } catch (error) {
        console.error("Database get failed, using fallback:", error);
      }

      const fallback = FALLBACK_ARTICLES.find(a => a.id === articleId);
      if (fallback) return fallback;

      return { error: `Article not found.` };
    },
  } as any),

  getArticlesByCategory: tool({
    description: 'List help articles in a specific category',
    parameters: getArticlesByCategorySchema,
    execute: async ({ category }: GetArticlesByCategoryArgs) => {
      try {
        const results = await db
          .select({
            id: supportArticles.id,
            title: supportArticles.title,
            category: supportArticles.category
          })
          .from(supportArticles)
          .where(ilike(supportArticles.category, category));

        if (results.length > 0) return results;
      } catch (error) {
        console.error("Database category list failed, using fallback:", error);
      }

      const fallbackResults = FALLBACK_ARTICLES.filter(a =>
        a.category.toLowerCase() === category.toLowerCase()
      ).map(({ id, title, category }) => ({ id, title, category }));

      if (fallbackResults.length > 0) return fallbackResults;

      return { message: `No articles found in category "${category}".` };
    },
  } as any),
};
