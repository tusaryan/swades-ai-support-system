import { Hono } from 'hono';
import { ChatController } from '../controllers/chat.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const controller = new ChatController();

export const chatRouter = new Hono()
  .use('*', authMiddleware)
  .post('/messages', (c) => controller.sendMessage(c))
  .get('/conversations', (c) => controller.getConversations(c))
  .get('/conversations/:id', (c) => controller.getConversation(c))
  .delete('/conversations/:id', (c) => controller.deleteConversation(c));

