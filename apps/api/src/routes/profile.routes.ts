import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { PasswordService } from '../services/auth/password.service.js';

type Variables = {
    userId: string;
    userEmail?: string;
};

const passwordService = new PasswordService();

const updateProfileSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    phoneNumber: z.string().max(20).optional(),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z
        .string()
        .min(8)
        .regex(/[A-Z]/, 'Must contain uppercase letter')
        .regex(/[a-z]/, 'Must contain lowercase letter')
        .regex(/[0-9]/, 'Must contain number')
        .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
    confirmPassword: z.string().min(1),
});

export const profileRouter = new Hono<{ Variables: Variables }>()
    .use('*', authMiddleware)

    // GET /api/profile — current user data
    .get('/', async (c) => {
        const userId = c.get('userId');
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        if (!user) return c.json({ error: 'User not found' }, 404);

        return c.json({
            id: user.id,
            email: user.email,
            name: user.name,
            phoneNumber: user.phoneNumber,
            role: user.role,
            createdAt: user.createdAt,
        });
    })

    // PUT /api/profile — update name, phone
    .put('/', async (c) => {
        const userId = c.get('userId');
        const body = await c.req.json();
        const parsed = updateProfileSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
        }

        const updateData: Record<string, any> = { updatedAt: new Date() };
        if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
        if (parsed.data.phoneNumber !== undefined) updateData.phoneNumber = parsed.data.phoneNumber;

        const [updated] = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, userId))
            .returning();

        return c.json({
            id: updated.id,
            email: updated.email,
            name: updated.name,
            phoneNumber: updated.phoneNumber,
            role: updated.role,
        });
    })

    // PUT /api/profile/password — change password
    .put('/password', async (c) => {
        const userId = c.get('userId');
        const body = await c.req.json();
        const parsed = changePasswordSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
        }

        if (parsed.data.newPassword !== parsed.data.confirmPassword) {
            return c.json({ error: 'Passwords do not match' }, 400);
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        if (!user) return c.json({ error: 'User not found' }, 404);

        const isValid = await passwordService.comparePassword(
            parsed.data.currentPassword,
            user.passwordHash,
        );
        if (!isValid) {
            return c.json({ error: 'Current password is incorrect' }, 401);
        }

        const newHash = await passwordService.hashPassword(parsed.data.newPassword);
        await db
            .update(users)
            .set({ passwordHash: newHash, updatedAt: new Date() })
            .where(eq(users.id, userId));

        return c.json({ message: 'Password updated successfully' });
    });
