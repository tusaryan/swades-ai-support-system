import type { Context } from 'hono';
import { z } from 'zod';
import { AuthService } from '../services/auth/auth.service.js';

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  phoneNumber: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthServiceError extends Error { }

export class AuthController {
  private authService = new AuthService();

  async register(c: Context) {
    try {
      const body = await c.req.json();
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
      }

      const { user, accessToken, refreshToken } = await this.authService.register(parsed.data);

      // Set refresh token as httpOnly cookie
      c.header(
        'Set-Cookie',
        `refreshToken=${refreshToken}; HttpOnly; Path=/; SameSite=Lax; Secure=${c.req.url.startsWith('https') ? 'true' : 'false'
        }`,
      );

      return c.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
      });
    } catch (error) {
      console.error('Error in register:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async login(c: Context) {
    try {
      const body = await c.req.json();
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
      }

      const result = await this.authService.login(parsed.data);

      c.header(
        'Set-Cookie',
        `refreshToken=${result.refreshToken}; HttpOnly; Path=/; SameSite=Lax; Secure=${c.req.url.startsWith('https') ? 'true' : 'false'
        }`,
      );

      return c.json({
        user: { id: result.user.id, email: result.user.email, name: result.user.name, role: result.user.role },
        accessToken: result.accessToken,
      });
    } catch (error) {
      console.error('Error in login:', error);
      return c.json({ error: 'Invalid credentials' }, 401);
    }
  }

  async refresh(c: Context) {
    try {
      const cookieHeader = c.req.header('Cookie') || '';
      const match = cookieHeader.match(/refreshToken=([^;]+)/);
      const token = match?.[1];

      if (!token) {
        return c.json({ error: 'Refresh token missing' }, 401);
      }

      const result = await this.authService.refresh(token);

      c.header(
        'Set-Cookie',
        `refreshToken=${result.refreshToken}; HttpOnly; Path=/; SameSite=Lax; Secure=${c.req.url.startsWith('https') ? 'true' : 'false'
        }`,
      );

      return c.json({ accessToken: result.accessToken });
    } catch (error) {
      console.error('Error in refresh:', error);
      return c.json({ error: 'Invalid refresh token' }, 401);
    }
  }

  async logout(c: Context) {
    try {
      const cookieHeader = c.req.header('Cookie') || '';
      const match = cookieHeader.match(/refreshToken=([^;]+)/);
      const token = match?.[1];

      if (token) {
        await this.authService.logout(token);
      }

      // Clear cookie
      c.header(
        'Set-Cookie',
        'refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure=false',
      );

      return c.json({ success: true });
    } catch (error) {
      console.error('Error in logout:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
}

