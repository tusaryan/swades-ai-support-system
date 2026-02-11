import { Hono } from 'hono';
import { AgentsController } from '../controllers/agents.controller.js';

const controller = new AgentsController();

export const agentsRouter = new Hono()
  .get('/', (c) => controller.listAgents(c))
  .get('/:type/capabilities', (c) => controller.getCapabilities(c))
  .post('/classify', (c) => controller.classify(c));

