
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { WelcomeScreen } from "./welcome-screen";
import { useChat } from "@/hooks/use-chat";
import { useConversations } from "@/hooks/use-conversations";
import type { Message } from "@/lib/types";
import { AlertCircle, RefreshCw, LogIn } from "lucide-react";

interface ChatInterfaceProps {
  activeConversationId: string | null;
  onConversationCreated?: (id: string) => void;
  onConversationListRefresh?: () => void;
  onMessageSent?: () => void;
}

export function ChatInterface({
  activeConversationId,
  onConversationCreated,
  onConversationListRefresh,
  onMessageSent,
}: ChatInterfaceProps) {
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const prevConversationIdRef = useRef<string | null>(null);

  const {
    messages,
    isStreaming,
    streamingPhase,
    error,
    sendMessage,
    loadMessages,
    clearMessages,
  } = useChat({
    conversationId: activeConversationId,
    onConversationCreated,
    onConversationListRefresh,
  });

  const { fetchConversationMessages } = useConversations();

  // Load conversation messages when active conversation changes
  useEffect(() => {
    // Skip if conversation hasn't actually changed
    if (prevConversationIdRef.current === activeConversationId) return;
    prevConversationIdRef.current = activeConversationId;

    if (activeConversationId) {
      // If it's a temporary ID (optimistic new chat), don't fetch from API
      if (activeConversationId.startsWith("conv-")) {
        clearMessages();
        return;
      }

      // If we are streaming, don't fetch history to avoid overwriting the live stream
      if (isStreaming) {
        return;
      }

      setIsLoadingHistory(true);
      fetchConversationMessages(activeConversationId)
        .then((msgs: Message[]) => {
          loadMessages(msgs);
        })
        .catch(() => {
          clearMessages();
        })
        .finally(() => {
          setIsLoadingHistory(false);
        });
    } else {
      clearMessages();
    }
  }, [activeConversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content);
      // Notify parent that a message was sent (enables new chat button)
      onMessageSent?.();
    },
    [sendMessage, onMessageSent]
  );

  const handleRetry = useCallback(() => {
    // Retry the last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      // Remove the error assistant message
      const filtered = messages.filter(
        (m) => !(m.role === "assistant" && m.isError)
      );
      loadMessages(filtered);
      sendMessage(lastUserMsg.content);
    }
  }, [messages, loadMessages, sendMessage]);

  const showWelcome = messages.length === 0 && !isStreaming && !isLoadingHistory;

  // Determine error action type for contextual UI
  const getErrorAction = () => {
    if (!error) return null;
    if (error.type === "unauthorized") {
      return (
        <button
          onClick={() => window.location.href = "/auth"}
          className="inline-flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
        >
          <LogIn className="h-3 w-3" />
          Log in again
        </button>
      );
    }
    if (["rate_limit", "network", "model_unavailable", "unknown", "timeout", "internal"].includes(error.type)) {
      return (
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      );
    }
    return null;
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {showWelcome ? (
        <WelcomeScreen onSuggestionClick={handleSend} />
      ) : (
        <MessageList
          messages={messages}
          isStreaming={isStreaming || isLoadingHistory}
          streamingPhase={isLoadingHistory ? "fetching" : streamingPhase}
          onQuickReply={handleSend}
        />
      )}

      {/* Error banner */}
      {error && !isStreaming && (
        <div className="border-t border-destructive/30 bg-destructive/5 px-4 py-3">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            <p className="flex-1 text-sm text-destructive">
              {error.message}
            </p>
            {getErrorAction()}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border p-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput onSend={handleSend} disabled={isStreaming} />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            AI agents may make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
