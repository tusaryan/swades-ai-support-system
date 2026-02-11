import { beforeAll, afterAll, describe, it, expect } from 'vitest';

// These tests require a live database with seeded data.
// Skip in CI where no real DATABASE_URL is configured.
const hasRealDb = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('ci@localhost');

describe.skipIf(!hasRealDb)('billingTools (DB + mock fallback)', async () => {
  // Dynamic imports so module resolution doesn't fail when DB is unavailable
  const { db } = await import('../lib/db.js');
  const { users, invoices } = await import('../db/schema.js');
  const { billingTools } = await import('../tools/billing.tools.js');
  const { eq } = await import('drizzle-orm');

  let demoUserId: string | null = null;

  beforeAll(async () => {
    const user = await db.query.users.findFirst({ where: eq(users.email, 'sayam@swades.ai') });
    if (user) demoUserId = (user.id as unknown) as string;
  });

  afterAll(async () => {
    // Close DB connection if needed (postgres client handles it)
  });

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
