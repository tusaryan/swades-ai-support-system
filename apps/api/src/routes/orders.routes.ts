import { Hono } from 'hono';
import { OrderService } from '../services/order.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

type Variables = {
    userId: string;
    userEmail?: string;
};

export const ordersRouter = new Hono<{ Variables: Variables }>()
    .use('*', authMiddleware)
    .get('/', async (c) => {
        const userId = c.get('userId');
        const orders = await OrderService.getOrdersByUser(userId);
        return c.json(orders);
    })
    .get('/:orderNumber', async (c) => {
        const orderNumber = c.req.param('orderNumber');
        const userId = c.get('userId');
        const order = await OrderService.getOrderById(orderNumber, userId);

        if (!order) {
            return c.json({ error: 'Order not found' }, 404);
        }

        return c.json(order);
    });
