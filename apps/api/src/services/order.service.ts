import { db } from '../lib/db.js';
import { orders } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export class OrderService {
    static async getOrderById(orderNumber: string, userId: string) {
        const order = await db.query.orders.findFirst({
            where: eq(orders.orderNumber, orderNumber),
        });

        if (!order || order.userId !== userId) {
            return null;
        }

        return order;
    }

    static async getOrdersByUser(userId: string) {
        return await db.query.orders.findMany({
            where: eq(orders.userId, userId),
            orderBy: desc(orders.createdAt),
        });
    }

    static async getLatestOrder(userId: string) {
        return await db.query.orders.findFirst({
            where: eq(orders.userId, userId),
            orderBy: desc(orders.createdAt),
        });
    }
}
