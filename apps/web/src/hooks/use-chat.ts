
import { useState, useCallback, useRef } from "react";
import { apiSendMessage } from "@/lib/api";
import { getSimulatedResponse } from "@/lib/mock-data";
import type { Message, StreamingPhase, AgentType } from "@/lib/types";

const USE_MOCK = !import.meta.env.VITE_API_URL;

interface UseChatOptions {
  conversationId?: string | null;
  onConversationCreated?: (id: string) => void;
  onConversationListRefresh?: () => void;
}

interface ChatError {
  type: string;
  message: string;
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingPhase, setStreamingPhase] = useState<StreamingPhase>("idle");
  const [error, setError] = useState<ChatError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadMessages = useCallback((msgs: Message[]) => {
    setMessages(msgs);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      setError(null);

      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Prepare assistant message placeholder
      const assistantId = crypto.randomUUID();
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setIsStreaming(true);
      setStreamingPhase("analyzing");

      try {
        if (USE_MOCK) {
          // Use mock data for demo / when no backend is connected
          setMessages((prev) => [...prev, assistantMessage]);

          await new Promise((r) => setTimeout(r, 400));
          setStreamingPhase("routing");
          await new Promise((r) => setTimeout(r, 500));
          setStreamingPhase("fetching");
          await new Promise((r) => setTimeout(r, 400));
          setStreamingPhase("responding");

          const { agentType, response } = getSimulatedResponse(content);

          // Simulate streaming character by character
          for (let i = 0; i < response.length; i++) {
            await new Promise((r) => setTimeout(r, 8));
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: response.slice(0, i + 1), agentType }
                  : msg
              )
            );
          }
        } else {
          // Real backend streaming
          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingPhase("thinking");

          const response = await apiSendMessage(
            content,
            options.conversationId && !options.conversationId.startsWith("conv-")
              ? options.conversationId
              : undefined
          );

          // Extract metadata from response headers
          const agentTypeHeader = response.headers.get("X-Agent-Type");
          const conversationIdHeader = response.headers.get("X-Conversation-Id");

          if (agentTypeHeader) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, agentType: agentTypeHeader as AgentType }
                  : msg
              )
            );
          }

          if (conversationIdHeader && options.onConversationCreated) {
            options.onConversationCreated(conversationIdHeader);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error("No response body");
          }

          let fullContent = "";
          let conversationCreated = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            // Parse phase markers and error markers from the stream
            const parts = chunk.split(/(\n__PHASE:\w+__\n|\n__ERROR:.*?__\n)/);

            for (const part of parts) {
              // Phase marker
              const phaseMatch = part.match(/\n__PHASE:(\w+)__\n/);
              if (phaseMatch) {
                const phase = phaseMatch[1] as StreamingPhase;
                if (["analyzing", "thinking", "routing", "fetching", "responding", "escalating", "error"].includes(phase)) {
                  setStreamingPhase(phase);
                }
                continue;
              }

              // Error marker
              const errorMatch = part.match(/\n__ERROR:(.*?)__\n/);
              if (errorMatch) {
                try {
                  const errData = JSON.parse(errorMatch[1]);
                  setError({ type: errData.errorType, message: errData.message });
                  setStreamingPhase("error");

                  // Mark assistant message as error
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? {
                          ...msg,
                          content: errData.message,
                          isError: true,
                        }
                        : msg
                    )
                  );
                } catch {
                  // Ignore parse errors in error markers
                }
                continue;
              }

              // Regular content
              if (part.trim()) {
                fullContent += part;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: fullContent }
                      : msg
                  )
                );
              }
            }

            // Trigger conversation list refresh after first content chunk
            if (!conversationCreated && fullContent.length > 0 && conversationIdHeader) {
              conversationCreated = true;
              options.onConversationListRefresh?.();
            }
          }
        }
      } catch (err) {
        // Classify the error for specific display
        const chatError = classifyFrontendError(err);
        setError(chatError);

        // Update assistant message to show error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                ...msg,
                content: chatError.message,
                isError: true,
              }
              : msg
          )
        );
      } finally {
        setIsStreaming(false);
        setStreamingPhase("idle");
      }
    },
    [isStreaming, options]
  );

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setIsStreaming(false);
    setStreamingPhase("idle");
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    streamingPhase,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
    loadMessages,
  };
}

/**
 * Classify API/network errors into user-friendly messages.
 */
function classifyFrontendError(err: unknown): ChatError {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();

    // Rate limiting
    if (msg.includes("429") || msg.includes("rate limit") || msg.includes("too many")) {
      return {
        type: "rate_limit",
        message: "You're sending messages too quickly. Please wait a moment and try again.",
      };
    }

    // Auth errors
    if (msg.includes("401") || msg.includes("unauthorized")) {
      return {
        type: "unauthorized",
        message: "Your session has expired. Please log in again.",
      };
    }

    // API key / server config
    if (msg.includes("api key") || msg.includes("authentication failed") || msg.includes("502")) {
      return {
        type: "api_key_invalid",
        message: "AI service configuration error. Please contact support.",
      };
    }

    // Model / service unavailable
    if (msg.includes("503") || msg.includes("model") || msg.includes("unavailable")) {
      return {
        type: "model_unavailable",
        message: "The AI model is temporarily unavailable. Please try again in a few seconds.",
      };
    }

    // Internal server error
    if (msg.includes("500") || msg.includes("internal server error")) {
      return {
        type: "internal",
        message: "Server error occurred. Our team has been notified. Please try again shortly.",
      };
    }

    // Timeout
    if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("aborted")) {
      return {
        type: "timeout",
        message: "Request timed out. The server may be busy — please try again.",
      };
    }

    // Network / connection
    if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch") || msg.includes("cors") || msg.includes("econnrefused")) {
      return {
        type: "network",
        message: "Network error. Please check your connection and try again.",
      };
    }
  }

  return {
    type: "unknown",
    message: "An unexpected error occurred. Please try again.",
  };
}
