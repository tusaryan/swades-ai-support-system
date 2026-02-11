import { client } from "./client";

// Token management
let accessToken: string | null = null;

export function getAccessToken() {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = localStorage.getItem("accessToken");
  }
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
  }
}

function getAuthHeaderObj(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body.error || body.message || `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }
  return response.json();
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// --- Auth API ---

export interface LoginResponse {
  user: { id: string; email: string; name: string };
  accessToken: string;
  refreshToken?: string;
}

export interface RegisterResponse {
  user: { id: string; email: string; name: string };
  accessToken: string;
  refreshToken?: string;
}

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await client.api.auth.login.$post({
    json: { email, password },
  }, {
    init: { credentials: "include" }
  });
  return handleResponse<LoginResponse>(res);
}

export async function apiRegister(
  email: string,
  password: string,
  name: string,
  phoneNumber?: string
): Promise<RegisterResponse> {
  const res = await client.api.auth.register.$post({
    json: { email, password, name, phoneNumber },
  }, {
    init: { credentials: "include" }
  });
  return handleResponse<RegisterResponse>(res);
}

export async function apiRefreshToken(): Promise<{ accessToken: string }> {
  const res = await client.api.auth.refresh.$post(
    undefined,
    {
      init: { credentials: "include", headers: getAuthHeaderObj() }
    }
  );
  return handleResponse<{ accessToken: string }>(res);
}

export async function apiLogout(): Promise<void> {
  await client.api.auth.logout.$post(
    undefined,
    {
      init: { credentials: "include", headers: getAuthHeaderObj() }
    }
  );
}

// --- Chat API ---

export interface ConversationResponse {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  agentType?: string;
  toolCalls?: unknown;
  createdAt: string;
  updatedAt?: string;
}

export async function apiGetConversations(): Promise<{ conversations: ConversationResponse[] }> {
  const res = await client.api.chat.conversations.$get(
    undefined,
    {
      init: { credentials: "include", headers: getAuthHeaderObj() }
    }
  );
  return handleResponse(res);
}

export async function apiGetConversation(
  id: string
): Promise<{ conversation: ConversationResponse; messages: MessageResponse[] }> {
  const res = await client.api.chat.conversations[":id"].$get(
    {
      param: { id },
    },
    {
      init: { credentials: "include", headers: getAuthHeaderObj() }
    }
  );
  return handleResponse(res);
}

export async function apiDeleteConversation(id: string): Promise<{ success: boolean }> {
  const res = await client.api.chat.conversations[":id"].$delete(
    {
      param: { id },
    },
    {
      init: { credentials: "include", headers: getAuthHeaderObj() }
    }
  );
  return handleResponse(res);
}

export async function apiSendMessage(
  message: string,
  conversationId?: string
): Promise<Response> {
  const res = await client.api.chat.messages.$post(
    {
      json: { message, conversationId },
    },
    {
      init: { credentials: "include", headers: getAuthHeaderObj() }
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError((body as any).error || "Failed to send message", res.status);
  }

  return res; // Return raw response for streaming
}

// --- Agents API ---

export interface AgentInfo {
  type: string;
  name: string;
  description: string;
  capabilities?: string[];
}

export async function apiGetAgents(): Promise<{ agents: AgentInfo[] }> {
  const res = await client.api.agents.$get(
    undefined,
    {
      init: { credentials: "include", headers: getAuthHeaderObj() }
    }
  );
  return handleResponse(res);
}

export async function apiGetAgentCapabilities(
  type: string
): Promise<AgentInfo> {
  const res = await client.api.agents[":type"].capabilities.$get(
    {
      param: { type },
    },
    {
      init: { credentials: "include", headers: getAuthHeaderObj() }
    }
  );
  return handleResponse(res);
}

// --- Health ---

export async function apiHealthCheck(): Promise<{ status: string }> {
  const res = await client.api.health.$get();
  return handleResponse(res);
}
