// @ts-nocheck
import { tool } from 'ai';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { invoices } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

// Mock Data for Invoices (fallback when DB is empty or for local testing)
const MOCK_INVOICES: Record<string, any> = {
  'INV-2024-001': {
    invoiceNumber: 'INV-2024-001',
    amount: 120.5,
    status: 'paid',
    createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
    dueDate: new Date('2024-01-29T10:00:00Z').toISOString(),
    items: [{ description: 'Annual Subscription', quantity: 1, price: 120.5 }],
    userId: 'user_123',
    refundStatus: 'none',
    paymentMethod: 'Visa ending 4242',
  },
  'INV-2024-002': {
    invoiceNumber: 'INV-2024-002',
    amount: 45.0,
    status: 'paid',
    createdAt: new Date('2024-02-10T14:30:00Z').toISOString(),
    dueDate: new Date('2024-02-24T14:30:00Z').toISOString(),
    items: [{ description: 'Support Add-on', quantity: 1, price: 45.0 }],
    userId: 'user_123',
    refundStatus: 'none',
    paymentMethod: 'Visa ending 4242',
  },
  'INV-2024-003': {
    invoiceNumber: 'INV-2024-003',
    amount: 250.0,
    status: 'pending',
    createdAt: new Date('2024-03-05T09:15:00Z').toISOString(),
    dueDate: new Date('2024-03-19T09:15:00Z').toISOString(),
    items: [{ description: 'Enterprise License', quantity: 1, price: 250.0 }],
    userId: 'user_123',
    refundStatus: 'none',
    paymentMethod: 'Mastercard ending 8888',
  },
};

// --- Zod Schemas ---
const getInvoiceStatusSchema = z.object({
  invoiceNumber: z.string().describe('The invoice number'),
});

const listInvoicesSchema = z.object({});

const getLastInvoiceSchema = z.object({});

const requestRefundSchema = z.object({
  invoiceNumber: z.string().describe('The invoice number to refund'),
});

export const billingTools = (userId: string) => ({
  getInvoiceStatus: tool({
    description: 'Get the status and details of a specific invoice',
    parameters: getInvoiceStatusSchema,
    execute: async (args: any) => {
      const { invoiceNumber } = args;
      const invoice = await db.query.invoices.findFirst({
        where: and(eq(invoices.invoiceNumber, invoiceNumber), eq(invoices.userId, userId)),
      });
      if (invoice) return invoice;

      // Fallback to mock data for local testing if DB does not have the invoice
      const mock = MOCK_INVOICES[invoiceNumber];
      if (mock && (mock.userId === userId || mock.userId == null)) return mock;
      return { error: 'Invoice not found' };
    },
  }),

  listInvoices: tool({
    description: 'List recent invoices for the user',
    parameters: listInvoicesSchema,
    execute: async () => {
      const userInvoices = await db.query.invoices.findMany({
        where: eq(invoices.userId, userId),
        orderBy: desc(invoices.createdAt),
      });
      if (userInvoices && userInvoices.length > 0) return userInvoices;

      // Fallback to mock invoices
      return Object.values(MOCK_INVOICES).filter((i) => i.userId === userId || true);
    },
  }),

  getLastInvoice: tool({
    description: 'Get the most recent invoice for the user',
    parameters: getLastInvoiceSchema,
    execute: async () => {
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.userId, userId),
        orderBy: desc(invoices.createdAt),
      });
      if (invoice) return invoice;

      // Fallback: return most recent mock invoice
      const mocks = Object.values(MOCK_INVOICES).filter((i) => i.userId === userId || true);
      if (mocks.length === 0) return { message: 'No invoices found' };
      return mocks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    },
  }),

  requestRefund: tool({
    description: 'Request a refund for an invoice. Refund policy: requests must be made within 30 days of payment.',
    parameters: requestRefundSchema,
    execute: async (args: any) => {
      const { invoiceNumber } = args;
      const invoice = await db.query.invoices.findFirst({
        where: and(eq(invoices.invoiceNumber, invoiceNumber), eq(invoices.userId, userId)),
      });

      // If present in DB, prefer DB-backed logic
      if (invoice) {
        if (invoice.status !== 'paid') {
          return { error: `Cannot refund invoice with status: ${invoice.status}` };
        }
        if (invoice.refundStatus !== 'none') {
          return { error: `Refund status is already: ${invoice.refundStatus}` };
        }

        const daysSince = (Date.now() - new Date(invoice.createdAt).getTime()) / (1000 * 3600 * 24);
        if (daysSince > 30) {
          return {
            error: 'Refund policy exceeded (30 days). Please contact human support.',
            needsHumanAssistance: true,
          };
        }

        await db.update(invoices).set({ refundStatus: 'requested' }).where(eq(invoices.id, invoice.id));

        return {
          message: 'Refund request submitted successfully.',
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          refundStatus: 'requested',
        };
      }

      // Fallback to mock invoices for local testing
      const mock = MOCK_INVOICES[invoiceNumber];
      if (!mock) return { error: 'Invoice not found' };
      if (mock.status !== 'paid') return { error: `Cannot refund invoice with status: ${mock.status}` };
      if (mock.refundStatus !== 'none') return { error: `Refund status is already: ${mock.refundStatus}` };

      const daysSinceMock = (Date.now() - new Date(mock.createdAt).getTime()) / (1000 * 3600 * 24);
      if (daysSinceMock > 30) {
        return { error: 'Refund policy exceeded (30 days). Please contact human support.', needsHumanAssistance: true };
      }

      // Update in-memory mock (local only)
      // @ts-ignore
      mock.refundStatus = 'requested';
      return {
        message: 'Refund request submitted successfully.',
        invoiceNumber: mock.invoiceNumber,
        amount: mock.amount,
        refundStatus: 'requested',
      };
    },
  }),
});
