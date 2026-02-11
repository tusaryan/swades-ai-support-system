// @ts-nocheck
import { tool } from 'ai';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { orders } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

// --- Zod Schemas ---
const getOrderByIdSchema = z.object({
  orderNumber: z.string().describe('The order number to look up'),
});

const getDeliveryStatusSchema = z.object({
  orderNumber: z.string().describe('The order number'),
});

const cancelOrderSchema = z.object({
  orderNumber: z.string().describe('The order number to cancel'),
});

const getOrderByProductNameSchema = z.object({
  productName: z.string().describe('The product name to search for'),
});

const getOrdersByUserSchema = z.object({});
const getLatestOrderSchema = z.object({});

export const orderTools = (userId: string) => ({
  getOrderById: tool({
    description: 'Get details of a specific order by its order number (e.g. ORD-2024-8891)',
    parameters: getOrderByIdSchema,
    execute: async (args: any) => {
      const { orderNumber } = args;
      const order = await db.query.orders.findFirst({
        where: eq(orders.orderNumber, orderNumber),
      });
      if (!order || order.userId !== userId) {
        return { error: `Order ${orderNumber} not found. Please check the order number and try again.` };
      }
      return order;
    },
  }),

  getOrdersByUser: tool({
    description: 'Get all orders for the current user. Returns a list of orders sorted by most recent first.',
    parameters: getOrdersByUserSchema,
    execute: async () => {
      const userOrders = await db.query.orders.findMany({
        where: eq(orders.userId, userId),
        orderBy: desc(orders.createdAt),
      });
      if (userOrders.length === 0) {
        return { message: 'No orders found for your account.' };
      }
      return userOrders;
    },
  }),

  getLatestOrder: tool({
    description: 'Get the most recent order for the current user. Use this when the user asks about "my order" or "latest order" without specifying an order number.',
    parameters: getLatestOrderSchema,
    execute: async () => {
      const order = await db.query.orders.findFirst({
        where: eq(orders.userId, userId),
        orderBy: desc(orders.createdAt),
      });
      if (!order) {
        return { message: 'No orders found for your account.' };
      }
      return order;
    },
  }),

  getDeliveryStatus: tool({
    description: 'Get the delivery/shipping status and tracking info for a specific order',
    parameters: getDeliveryStatusSchema,
    execute: async (args: any) => {
      const { orderNumber } = args;
      const order = await db.query.orders.findFirst({
        where: eq(orders.orderNumber, orderNumber),
      });
      if (!order || order.userId !== userId) {
        return { error: `Order ${orderNumber} not found.` };
      }
      return {
        orderNumber: order.orderNumber,
        status: order.status,
        deliveryStatus: order.deliveryStatus || 'Not available',
        trackingNumber: order.trackingNumber || 'Not available',
      };
    },
  }),

  cancelOrder: tool({
    description: 'Cancel an order. Only orders with status "pending" or "processing" can be cancelled. Orders that are already shipped, delivered, or cancelled cannot be cancelled.',
    parameters: cancelOrderSchema,
    execute: async (args: any) => {
      const { orderNumber } = args;
      const order = await db.query.orders.findFirst({
        where: eq(orders.orderNumber, orderNumber),
      });
      if (!order || order.userId !== userId) {
        return { error: `Order ${orderNumber} not found.` };
      }
      if (order.status === 'cancelled') {
        return { message: `Order ${orderNumber} has already been cancelled.` };
      }
      if (order.status === 'shipped' || order.status === 'delivered') {
        return {
          error: `Order ${orderNumber} has status "${order.status}" and cannot be cancelled. A human agent may need to assist with this. Please contact support for further assistance with returns/refunds.`,
          needsHumanAssistance: true,
        };
      }
      // Cancel the order
      await db
        .update(orders)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(orders.id, order.id));

      return {
        message: `Order ${orderNumber} has been successfully cancelled.`,
        orderNumber: order.orderNumber,
        previousStatus: order.status,
        newStatus: 'cancelled',
        items: order.items,
        totalAmount: order.totalAmount,
      };
    },
  }),

  getOrderByProductName: tool({
    description: 'Search for orders containing a specific product name. Use this when the user mentions a product name instead of an order number.',
    parameters: getOrderByProductNameSchema,
    execute: async (args: any) => {
      const { productName } = args;
      const userOrders = await db.query.orders.findMany({
        where: eq(orders.userId, userId),
        orderBy: desc(orders.createdAt),
      });

      const matching = userOrders.filter((order) => {
        const items = order.items as Array<{ name: string }>;
        return items?.some((item) =>
          item.name?.toLowerCase().includes(productName.toLowerCase()),
        );
      });

      if (matching.length === 0) {
        return { message: `No orders found containing "${productName}".` };
      }
      return matching;
    },
  }),
});
