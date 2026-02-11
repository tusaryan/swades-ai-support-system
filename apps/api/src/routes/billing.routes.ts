import { Hono } from 'hono';
import { BillingService } from '../services/billing.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

type Variables = {
    userId: string;
    userEmail?: string;
};

export const billingRouter = new Hono<{ Variables: Variables }>()
    .use('*', authMiddleware)
    .get('/', async (c) => {
        const userId = c.get('userId');
        const invoices = await BillingService.getUserInvoices(userId);
        return c.json(invoices);
    })
    .get('/:invoiceNumber', async (c) => {
        const invoiceNumber = c.req.param('invoiceNumber');
        const userId = c.get('userId');
        const invoice = await BillingService.getInvoiceByNumber(invoiceNumber, userId);

        if (!invoice) {
            return c.json({ error: 'Invoice not found' }, 404);
        }

        return c.json(invoice);
    });
