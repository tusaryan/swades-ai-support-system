import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { db } from '../lib/db.js';
import { users, invoices } from '../db/schema.js';
import { billingTools } from '../tools/billing.tools.js';
import { eq } from 'drizzle-orm';

let demoUserId: string | null = null;

beforeAll(async () => {
  // Ensure we can find the seeded demo user
  const user = await db.query.users.findFirst({ where: eq(users.email, 'sayam@swades.ai') });
  if (user) demoUserId = (user.id as unknown) as string;
});

afterAll(async () => {
  // Close DB connection if needed (postgres client handles it)
});

describe('billingTools (DB + mock fallback)', () => {
  it('returns DB-backed invoice for seeded invoice', async () => {
    if (!demoUserId) throw new Error('Demo user not found');
    const tools = billingTools(demoUserId);
    const res = await tools.getInvoiceStatus.execute!({ invoiceNumber: 'INV-DB-TEST-001' }, { toolCallId: 'test', messages: [] });
    expect(res).toBeDefined();
    expect((res as any).invoiceNumber || (res as any).invoice_number).toBe('INV-DB-TEST-001');
  });

  it('processes refund via DB and updates invoice refundStatus', async () => {
    if (!demoUserId) throw new Error('Demo user not found');
    const tools = billingTools(demoUserId);
    const resp = await tools.requestRefund.execute!({ invoiceNumber: 'INV-DB-TEST-001' }, { toolCallId: 'test', messages: [] });
    expect(resp).toBeDefined();
    expect((resp as any).refundStatus).toBe('requested');

    // Verify DB updated
    const dbInv = await db.query.invoices.findFirst({ where: eq(invoices.invoiceNumber, 'INV-DB-TEST-001') });
    expect(dbInv).toBeDefined();
    // @ts-ignore
    expect(dbInv.refundStatus).toBe('requested');
  });

  it('falls back to mock invoice when DB missing', async () => {
    // Use a fake user id that won't match DB to force mock fallback
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    const tools = billingTools(fakeUserId);
    const res = await tools.getInvoiceStatus.execute!({ invoiceNumber: 'INV-2024-001' }, { toolCallId: 'test', messages: [] });
    expect(res).toBeDefined();
    expect((res as any).invoiceNumber).toBe('INV-2024-001');
  });

  it('processes refund for mock invoice and updates in-memory mock', async () => {
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    const tools = billingTools(fakeUserId);
    const resp = await tools.requestRefund.execute!({ invoiceNumber: 'INV-2024-001' }, { toolCallId: 'test', messages: [] });
    expect(resp).toBeDefined();
    expect((resp as any).refundStatus).toBe('requested');
  });
});
