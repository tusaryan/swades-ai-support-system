import { sleep } from "workflow";

/** Email notification service (simulated — swap with Resend/SendGrid in production) */
async function sendEmail(to: string, subject: string, body: string) {
    "use step";
    console.log(`[EMAIL_SERVICE] Sending to ${to}: ${subject}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { sent: true, messageId: `msg_${Date.now()}` };
}

/** Validate that the escalation ticket ID exists and is actionable */
async function validateTicket(ticketId: string) {
    "use step";
    console.log(`[TICKET_SERVICE] Validating ticket: ${ticketId}`);
    if (!ticketId) throw new Error("Invalid Ticket ID");
    return { valid: true };
}

/** Assign the next available human support agent based on escalation reason */
async function assignAgent(reason: string) {
    "use step";
    console.log(`[AGENT_SERVICE] Assigning agent for reason: ${reason}`);
    const agents = ["Aryan", "Sayam", "SupportBot"];
    const assigned = agents[Math.floor(Math.random() * agents.length)];
    return { agent: assigned };
}

/**
 * HITL Escalation Workflow
 *
 * Triggered when an AI agent cannot confidently handle a request.
 * Validates the ticket, notifies the user, queues the request,
 * assigns a human agent, and sends a final notification.
 */
export async function escalateTicketWorkflow(ticketId: string, userEmail: string, reason: string) {
    "use workflow";

    // Step 1: Validate ticket
    await validateTicket(ticketId);

    // Step 2: Acknowledge receipt to user
    await sendEmail(userEmail, "Ticket Received", `We have received your escalation request for ticket ${ticketId}.`);

    // Step 3: Simulate queue delay (business hours / agent availability)
    console.log("Workflow sleeping for 10 seconds...");
    await sleep("10s");

    // Step 4: Assign human agent
    const { agent } = await assignAgent(reason);

    // Step 5: Notify user of assignment
    await sendEmail(userEmail, "Agent Assigned", `Your ticket ${ticketId} has been assigned to ${agent}. They will contact you shortly.`);

    return { status: "assigned", agent, ticketId };
}
