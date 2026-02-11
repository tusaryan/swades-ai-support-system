// Auth types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

// Chat types
export type AgentType = "support" | "order" | "billing" | "router";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentType?: AgentType;
  timestamp: Date;
  toolCalls?: ToolCall[];
  isError?: boolean;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface Conversation {
  id: string;
  title: string;
  status: "active" | "closed";
  lastMessage?: string;
  agentType?: AgentType;
  createdAt: Date;
  updatedAt: Date;
}

export type StreamingPhase =
  | "analyzing"
  | "thinking"
  | "routing"
  | "fetching"
  | "responding"
  | "escalating"
  | "error"
  | "idle";

export const PHASE_LABELS: Record<StreamingPhase, string> = {
  analyzing: "Analyzing your query...",
  thinking: "Thinking deeply...",
  routing: "Routing to specialist agent...",
  fetching: "Searching knowledge base...",
  responding: "Composing response...",
  escalating: "Redirecting to customer support...",
  error: "Something went wrong",
  idle: "",
};

// Agent capabilities
export interface AgentCapability {
  type: AgentType;
  name: string;
  description: string;
  tools: string[];
}

export const AGENT_CAPABILITIES: AgentCapability[] = [
  {
    type: "support",
    name: "Support Specialist",
    description: "Handles FAQ, help articles, and general inquiries",
    tools: ["searchArticles", "getArticleById"],
  },
  {
    type: "order",
    name: "Order Specialist",
    description: "Tracks orders, delivery status, and shipping info",
    tools: ["getOrderById", "getOrdersByUser", "getDeliveryStatus"],
  },
  {
    type: "billing",
    name: "Billing Specialist",
    description: "Manages invoices, payments, and refunds",
    tools: ["getInvoice", "getPaymentHistory", "getRefundStatus"],
  },
];
