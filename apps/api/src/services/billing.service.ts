import { db } from '../lib/db.js';
import { invoices } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

// Mock Data for Invoices (fallback when DB is empty or for local testing)
// Should match what's in billing.tools.ts for consistency
const MOCK_INVOICES: Record<string, any> = {
    'INV-2024-001': {
        id: 'mock-1',
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
        id: 'mock-2',
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
        id: 'mock-3',
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

export class BillingService {
    static async getInvoiceByNumber(invoiceNumber: string, userId: string) {
        const invoice = await db.query.invoices.findFirst({
            where: and(eq(invoices.invoiceNumber, invoiceNumber), eq(invoices.userId, userId)),
        });

        if (invoice) return invoice;

        // Fallback to mock data
        const mock = MOCK_INVOICES[invoiceNumber];
        if (mock && (mock.userId === userId || mock.userId == null)) return mock;

        return null;
    }

    static async getUserInvoices(userId: string) {
        const userInvoices = await db.query.invoices.findMany({
            where: eq(invoices.userId, userId),
            orderBy: desc(invoices.createdAt),
        });

        if (userInvoices && userInvoices.length > 0) return userInvoices;

        // Fallback to mock invoices
        return Object.values(MOCK_INVOICES).filter((i) => i.userId === userId || true);
    }
}
