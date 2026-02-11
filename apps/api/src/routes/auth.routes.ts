import { Hono } from 'hono';
import { AuthController } from '../controllers/auth.controller.js';

const controller = new AuthController();

export const authRouter = new Hono()
  .post('/register', (c) => controller.register(c))
  .post('/login', (c) => controller.login(c))
  .post('/refresh', (c) => controller.refresh(c))
  .post('/logout', (c) => controller.logout(c));

