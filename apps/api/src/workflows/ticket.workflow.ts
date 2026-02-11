import { sleep } from "workflow";
import { db } from "../lib/db.js"; // Adjust path if needed
import { sql } from "drizzle-orm";

// Mock email service for demonstration
async function sendEmail(to: string, subject: string, body: string) {
    "use step";
    console.log(`[EMAIL_SERVICE] Sending to ${to}: ${subject}`);
    // In real app, use Resend/SendGrid here
    await new Promise(resolve => setTimeout(resolve, 500));
    return { sent: true, messageId: `msg_${Date.now()}` };
}

async function validateTicket(ticketId: string) {
    "use step";
    console.log(`[TICKET_SERVICE] Validating ticket: ${ticketId}`);
    // In real app, check DB
    if (!ticketId) throw new Error("Invalid Ticket ID");
    return { valid: true };
}

async function assignAgent(reason: string) {
    "use step";
    console.log(`[AGENT_SERVICE] Assigning agent for reason: ${reason}`);
    const agents = ["Aryan", "Sayam", "SupportBot"];
    const assigned = agents[Math.floor(Math.random() * agents.length)];
    return { agent: assigned };
}

export async function escalateTicketWorkflow(ticketId: string, userEmail: string, reason: string) {
    "use workflow";

    // Step 1: Validate
    await validateTicket(ticketId);

    // Step 2: Notify User that we received it
    await sendEmail(userEmail, "Ticket Received", `We have received your escalation request for ticket ${ticketId}.`);

    // Step 3: Wait for a bit (simulating queue or business hours)
    console.log("Workflow sleeping for 10 seconds...");
    await sleep("10s");

    // Step 4: Assign Agent
    const { agent } = await assignAgent(reason);

    // Step 5: Notify User of assignment
    await sendEmail(userEmail, "Agent Assigned", `Your ticket ${ticketId} has been assigned to ${agent}. They will contact you shortly.`);

    return { status: "assigned", agent, ticketId };
}
