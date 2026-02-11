import { Hono } from 'hono';
import { start } from 'workflow/api';
import { escalateTicketWorkflow } from '../workflows/ticket.workflow.js';

export const workflowRouter = new Hono()
    .post('/escalate', async (c) => {
        try {
            const body = await c.req.json();
            const { ticketId, userEmail, reason } = body;

            if (!ticketId || !userEmail || !reason) {
                return c.json({ error: "Missing required fields: ticketId, userEmail, reason" }, 400);
            }

            const runId = await start(escalateTicketWorkflow, [ticketId, userEmail, reason]);

            return c.json({
                success: true,
                message: "Workflow started successfully",
                runId
            });
        } catch (error: any) {
            console.error("Workflow trigger failed:", error);
            return c.json({ error: error.message || "Failed to start workflow" }, 500);
        }
    });
