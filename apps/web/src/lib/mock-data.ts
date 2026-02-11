import type { Conversation, Message, AgentType } from "./types";

// Mock conversations
export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    title: "Order #ORD-2024-8891 Status",
    status: "active",
    lastMessage: "Your order is currently in transit and expected to arrive by Feb 13.",
    agentType: "order",
    createdAt: new Date("2026-02-11T09:00:00"),
    updatedAt: new Date("2026-02-11T09:05:00"),
  },
  {
    id: "conv-2",
    title: "Invoice Payment Issue",
    status: "active",
    lastMessage: "I've located your invoice INV-2026-0042. The payment was processed successfully.",
    agentType: "billing",
    createdAt: new Date("2026-02-10T14:30:00"),
    updatedAt: new Date("2026-02-10T14:35:00"),
  },
  {
    id: "conv-3",
    title: "Return Policy Question",
    status: "closed",
    lastMessage: "Our return policy allows returns within 30 days of delivery.",
    agentType: "support",
    createdAt: new Date("2026-02-09T11:00:00"),
    updatedAt: new Date("2026-02-09T11:10:00"),
  },
];

// Mock messages for a conversation
export const MOCK_MESSAGES: Message[] = [
  {
    id: "msg-1",
    role: "user",
    content: "Where is my order #ORD-2024-8891?",
    timestamp: new Date("2026-02-11T09:00:00"),
  },
  {
    id: "msg-2",
    role: "assistant",
    content:
      "I've located your order **#ORD-2024-8891**. Here are the details:\n\n- **Status**: In Transit\n- **Carrier**: FedEx\n- **Tracking Number**: FX-789456123\n- **Estimated Delivery**: February 13, 2026\n- **Items**: Wireless Headphones (x1), USB-C Hub (x1)\n- **Total**: $124.99\n\nYour package left the distribution center in Chicago yesterday and is currently en route to your delivery address. Would you like me to help with anything else regarding this order?",
    agentType: "order",
    timestamp: new Date("2026-02-11T09:00:05"),
  },
];

// Simulated AI responses for demo
interface SimulatedResponse {
  keywords: string[];
  agentType: AgentType;
  response: string;
}

const SIMULATED_RESPONSES: SimulatedResponse[] = [
  {
    keywords: ["order", "track", "delivery", "ship", "package", "where"],
    agentType: "order",
    response:
      "I've looked up your order information. Here's what I found:\n\n- **Order #ORD-2024-8891**\n- **Status**: In Transit\n- **Carrier**: FedEx\n- **Tracking**: FX-789456123\n- **ETA**: February 13, 2026\n\nThe package left our distribution center and is currently on its way to you. You should receive it within the next 2 business days. Would you like me to set up delivery notifications?",
  },
  {
    keywords: ["invoice", "bill", "payment", "charge", "receipt"],
    agentType: "billing",
    response:
      "I've pulled up your billing information:\n\n- **Invoice**: INV-2026-0042\n- **Amount**: $124.99\n- **Status**: Paid\n- **Payment Method**: Visa ending in 4242\n- **Date**: February 8, 2026\n\nThe payment was successfully processed and a receipt was sent to your email. Is there anything else about your billing you'd like to know?",
  },
  {
    keywords: ["refund", "return", "money back", "cancel"],
    agentType: "billing",
    response:
      "I can help you with a refund request. Here is our refund policy summary:\n\n- **Eligible Period**: Within 30 days of delivery\n- **Processing Time**: 5-7 business days\n- **Refund Method**: Original payment method\n\nTo initiate a refund, I'll need the order number. Could you please provide the order number you'd like to request a refund for?",
  },
  {
    keywords: ["help", "support", "how", "guide", "faq", "question"],
    agentType: "support",
    response:
      "I'd be happy to help! Here are some resources that might be useful:\n\n1. **Getting Started Guide** - Setting up your account and first order\n2. **Shipping FAQ** - Delivery times, carriers, and tracking\n3. **Account Management** - Profile settings, notifications, and preferences\n4. **Payment Methods** - Adding, updating, and managing payment options\n\nWhat specific topic would you like more information about?",
  },
  {
    keywords: ["account", "profile", "settings", "password", "email"],
    agentType: "support",
    response:
      "I can help with your account settings. Here's what you can manage:\n\n- **Profile**: Update your name, email, and phone number\n- **Password**: Change your password (requires current password)\n- **Notifications**: Email and push notification preferences\n- **Addresses**: Manage shipping and billing addresses\n\nWhat would you like to update?",
  },
];

export function getSimulatedResponse(query: string): {
  agentType: AgentType;
  response: string;
} {
  const lowerQuery = query.toLowerCase();

  for (const sim of SIMULATED_RESPONSES) {
    if (sim.keywords.some((kw) => lowerQuery.includes(kw))) {
      return { agentType: sim.agentType, response: sim.response };
    }
  }

  return {
    agentType: "support",
    response:
      "Thank you for your question. I've reviewed your inquiry and here's what I can tell you:\n\nOur team is ready to assist you with any concerns. For the most efficient help, could you provide more details about:\n\n- Your **order number** (if related to an order)\n- Your **invoice number** (if related to billing)\n- The specific **topic** you need help with\n\nThis will help me route you to the right specialist and provide the most accurate information.",
  };
}
