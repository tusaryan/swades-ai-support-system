import { db } from '../src/lib/db.js';
import {
  users,
  orders,
  invoices,
  supportArticles,
  conversations,
  messages,
  refreshTokens,
} from '../src/db/schema.js';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clean existing data
    console.log('🗑️  Cleaning existing data...');
    await db.delete(messages);
    await db.delete(conversations);
    await db.delete(orders);
    await db.delete(invoices);
    await db.delete(refreshTokens);
    await db.delete(supportArticles);
    await db.delete(users);

    // Seed Users
    console.log('👤 Creating users...');
    const passwordHash = await bcrypt.hash('Swades@123!', 10);

    const [demoUser, johnDoe, alice] = await db
      .insert(users)
      .values([
        {
          email: 'sayam@swades.ai',
          name: 'Sayam',
          passwordHash,
          phoneNumber: '+1234567890',
          role: 'admin',
        },
        {
          email: 'john.doe@example.com',
          name: 'John Doe',
          passwordHash,
          phoneNumber: '+1987654321',
          role: 'user',
        },
        {
          email: 'alice@example.com',
          name: 'Alice Example',
          passwordHash,
          phoneNumber: '+15551234567',
          role: 'user',
        },
      ])
      .returning();

    console.log(`✅ Created users`);

    // Seed Orders (realistic e-commerce data)
    console.log('📦 Creating orders...');
    const orderData = [
      // Demo User Orders
      {
        userId: demoUser.id,
        orderNumber: 'ORD-2025-001',
        status: 'delivered' as const,
        totalAmount: '149.99',
        items: [{ name: 'Wireless Headphones', quantity: 1, price: 149.99 }],
        deliveryStatus: 'Delivered on Jan 15, 2025',
        trackingNumber: 'TRK1234567890',
        createdAt: new Date('2025-01-10'),
      },
      {
        userId: demoUser.id,
        orderNumber: 'ORD-2025-002',
        status: 'shipped' as const,
        totalAmount: '89.99',
        items: [
          { name: 'USB-C Cable', quantity: 2, price: 19.99 },
          { name: 'Phone Case', quantity: 1, price: 49.99 },
        ],
        deliveryStatus: 'In transit - Expected delivery Feb 12, 2025',
        trackingNumber: 'TRK9876543210',
        createdAt: new Date('2025-02-08'),
      },
      {
        userId: demoUser.id,
        orderNumber: 'ORD-2025-003',
        status: 'processing' as const,
        totalAmount: '299.99',
        items: [{ name: 'Mechanical Keyboard', quantity: 1, price: 299.99 }],
        deliveryStatus: 'Order is being prepared',
        trackingNumber: null,
        createdAt: new Date('2025-02-09'),
      },
      {
        userId: demoUser.id,
        orderNumber: 'ORD-2025-004',
        status: 'pending' as const,
        totalAmount: '1299.00',
        items: [{ name: 'Gaming Laptop', quantity: 1, price: 1299.00 }],
        deliveryStatus: 'Order received',
        trackingNumber: null,
        createdAt: new Date(), // Just now
      },
    ];

    await db.insert(orders).values(orderData);
    console.log(`✅ Created ${orderData.length} orders`);

    // Seed Invoices (realistic billing data)
    console.log('💳 Creating invoices...');
    const invoiceData = [
      {
        userId: demoUser.id,
        invoiceNumber: 'INV-2025-001',
        amount: '149.99',
        status: 'paid' as const,
        paymentMethod: 'Credit Card (•••• 4242)',
        refundStatus: 'none' as const,
        createdAt: new Date('2025-01-10'),
        dueDate: new Date('2025-01-17'),
      },
      {
        userId: demoUser.id,
        invoiceNumber: 'INV-2025-002',
        amount: '89.99',
        status: 'paid' as const,
        paymentMethod: 'PayPal',
        refundStatus: 'none' as const,
        createdAt: new Date('2025-02-08'),
        dueDate: new Date('2025-02-15'),
      },
      {
        userId: demoUser.id,
        invoiceNumber: 'INV-2025-003',
        amount: '299.99',
        status: 'paid' as const, // Paid but recent, eligible for refund testing
        paymentMethod: 'Credit Card (•••• 4242)',
        refundStatus: 'none' as const,
        createdAt: new Date('2025-02-09'),
        dueDate: new Date('2025-02-16'),
      },
      {
        userId: demoUser.id,
        invoiceNumber: 'INV-2025-004',
        amount: '1299.00',
        status: 'pending' as const,
        paymentMethod: 'Credit Card (•••• 4242)',
        refundStatus: 'none' as const,
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
      },
      // Add a fresh paid invoice to allow refund testing against DB
      {
        userId: demoUser.id,
        invoiceNumber: 'INV-DB-TEST-001',
        amount: '19.99',
        status: 'paid' as const,
        paymentMethod: 'Credit Card (•••• 4242)',
        refundStatus: 'none' as const,
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ];

    await db.insert(invoices).values(invoiceData);
    console.log(`✅ Created ${invoiceData.length} invoices`);

    // Seed Support Articles (FAQ knowledge base)
    console.log('📚 Creating support articles...');
    const supportData = [
      {
        title: 'How to Track Your Order',
        content: `To track your order:
1. Log in to your account
2. Go to "My Orders"
3. Click on the order you want to track
4. View the tracking number and delivery status

You can also use the tracking number on our carrier's website for real-time updates.`,
        category: 'Orders',
        tags: ['tracking', 'shipping', 'delivery'],
      },
      {
        title: 'Return & Refund Policy',
        content: `We offer a 30-day return policy for most items. To initiate a return:
1. Contact support within 30 days of delivery
2. Provide your order number and reason for return
3. We'll send you a return label via email
4. Ship the item back using our prepaid label
5. Refunds are processed within 5-7 business days after we receive the item

Items must be in original condition with tags attached.`,
        category: 'Billing',
        tags: ['refund', 'return', 'policy'],
      },
      {
        title: 'How to Cancel an Order',
        content: `You can cancel an order only if it hasn't been shipped yet (status is "pending" or "processing").

To cancel:
1. Go to "My Orders"
2. Select the order
3. Click "Cancel Order" if available
4. Confirm cancellation

If the order has already shipped, you will need to wait for delivery and then initiate a return.`,
        category: 'Orders',
        tags: ['cancel', 'cancellation', 'stop order'],
      },
      {
        title: 'Payment Methods Accepted',
        content: `We accept the following payment methods:
- All major credit cards (Visa, Mastercard, Amex, Discover)
- Debit cards
- PayPal
- Apple Pay
- Google Pay

All payments are processed securely through our encrypted payment gateway.`,
        category: 'Billing',
        tags: ['payment', 'billing', 'methods'],
      },
      {
        title: 'How to Reset Your Password',
        content: `To reset your password:
1. Go to the login page
2. Click "Forgot Password?"
3. Enter your email address
4. Check your email for a reset link
5. Click the link and create a new password

Password requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number`,
        category: 'Account',
        tags: ['password', 'security', 'account'],
      },
      {
        title: 'My Access to Features is Restricted',
        content: `If you are experiencing restricted access to features, it may be due to:
- Rate limiting: You may have exceeded the request limit. Please wait a moment.
- Account status: Ensure your account is active and verified.
- Technical issue: Try clearing your cache or contact support if the issue persists.`,
        category: 'Troubleshooting',
        tags: ['access', 'error', 'restricted'],
      },
      {
        title: 'How does the multi-agent routing work?',
        content: `When you send a message, our Router Agent analyzes the intent and classifies it into one of three categories: Order, Billing, or Support. It then delegates to the appropriate specialist agent with the relevant tools to provide accurate answers. The routing uses a combination of LLM classification and keyword-based fallback for reliability.`,
        category: 'General',
        tags: ['routing', 'agents', 'how-it-works'],
      },
      {
        title: 'Is my conversation data secure?',
        content: `Yes. All communications are encrypted, authentication uses JWT tokens with refresh rotation, and we apply rate limiting and CORS protection. Your conversation history is persisted securely in PostgreSQL. We follow industry-standard security practices including bcrypt password hashing and httpOnly cookie-based refresh tokens.`,
        category: 'Security',
        tags: ['security', 'privacy', 'data'],
      },
      {
        title: 'Can the AI access my real order and billing data?',
        content: `Yes! Unlike generic chatbots, our agents have access to real database tools. The Order Agent can look up your actual orders, tracking info, and delivery status. The Billing Agent can check your real invoices and refund statuses. All data access is authenticated and scoped to your user account.`,
        category: 'General',
        tags: ['data', 'real-time', 'tools'],
      },
      {
        title: 'What happens if the AI cannot help me?',
        content: `If the AI determines that your query needs human intervention (e.g., complex refund disputes or technical issues beyond its scope), it will flag the conversation for human escalation and provide clear next steps. You can also explicitly request to speak with a human agent at any time.`,
        category: 'Support',
        tags: ['escalation', 'human', 'help'],
      },
    ];

    await db.insert(supportArticles).values(supportData);
    console.log(`✅ Created ${supportData.length} support articles`);

    // Seed Conversations + Messages for demo users (persistence testing)
    console.log('💬 Creating sample conversations and messages...');

    const [conv1] = await db
      .insert(conversations)
      .values({ userId: demoUser.id, title: 'Order help: recent orders' })
      .returning();

    await db.insert(messages).values([
      { conversationId: conv1.id, role: 'user', content: 'Where is my latest order?' },
      { conversationId: conv1.id, role: 'assistant', content: 'Let me check the status for your latest order.', agentType: 'order' },
    ]);

    const [conv2] = await db
      .insert(conversations)
      .values({ userId: johnDoe.id, title: 'Billing question' })
      .returning();

    await db.insert(messages).values([
      { conversationId: conv2.id, role: 'user', content: 'I want a refund for my last invoice.' },
      { conversationId: conv2.id, role: 'assistant', content: 'Please provide the invoice number so I can check.', agentType: 'billing' },
    ]);

    const [conv3] = await db
      .insert(conversations)
      .values({ userId: alice.id, title: 'Account help' })
      .returning();

    await db.insert(messages).values([
      { conversationId: conv3.id, role: 'user', content: 'I forgot my password, how do I reset it?' },
      { conversationId: conv3.id, role: 'assistant', content: 'You can reset your password via the Forgot Password link.', agentType: 'support' },
    ]);

    console.log('✅ Created sample conversations and messages');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n🔑 Test Credentials:');
    console.log('  Email: sayam@swades.ai');
    console.log('  Password: Swades@123!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log('\n✅ Seeding process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding process failed:', error);
    process.exit(1);
  });
