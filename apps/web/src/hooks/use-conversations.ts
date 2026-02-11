
import { useState, useCallback, useEffect } from "react";
import {
  apiGetConversations,
  apiGetConversation,
  apiDeleteConversation,
} from "@/lib/api";
import type { Conversation, Message, AgentType } from "@/lib/types";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiGetConversations();
      setConversations(
        data.conversations.map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status as "active" | "closed",
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch conversations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchConversationMessages = useCallback(
    async (id: string): Promise<Message[]> => {
      const data = await apiGetConversation(id);
      return data.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        agentType: m.agentType as AgentType | undefined,
        timestamp: new Date(m.createdAt),
      }));
    },
    []
  );

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await apiDeleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete conversation");
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    setConversations, // Exporting this so page can optimistic update/create
    isLoading,
    error,
    fetchConversations,
    fetchConversationMessages,
    deleteConversation,
  };
}
