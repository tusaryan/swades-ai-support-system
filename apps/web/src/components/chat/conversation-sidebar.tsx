
import { cn } from "@/lib/utils";
import type { Conversation, AgentType } from "@/lib/types";
import { AgentBadge } from "./agent-badge";
import { Plus, MessageSquare, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  newChatDisabled?: boolean;
  className?: string;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  newChatDisabled = false,
  className,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Sort by most recent activity and filter by search query
  const filtered = useMemo(() => {
    const searched = conversations.filter((c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return searched.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [conversations, searchQuery]);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Conversations
          </h2>
        </div>
        <div className="relative group/newchat">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewConversation}
            disabled={newChatDisabled}
            className={cn("h-8 w-8", newChatDisabled && "opacity-50 cursor-not-allowed")}
            aria-label="New conversation"
          >
            <Plus className="h-4 w-4" />
          </Button>
          {newChatDisabled && (
            <div className="absolute right-0 top-full mt-1 z-50 hidden group-hover/newchat:block whitespace-nowrap rounded-md bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md border border-border">
              Send a message first
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-border p-3">
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            aria-label="Search conversations"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filtered.map((conversation) => (
              <div
                key={conversation.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectConversation(conversation.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectConversation(conversation.id);
                  }
                }}
                className={cn(
                  "group relative mb-1 flex w-full flex-col items-start rounded-lg px-3 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  activeConversationId === conversation.id
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent/50"
                )}
              >
                <div className="mb-1 flex w-full items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {conversation.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conversation.id);
                    }}
                    className="hidden shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive group-hover:block"
                    aria-label={`Delete conversation: ${conversation.title}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                {conversation.lastMessage && (
                  <p className="mb-1.5 line-clamp-1 text-xs text-muted-foreground">
                    {conversation.lastMessage}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  {conversation.agentType && (
                    <AgentBadge agentType={conversation.agentType} className="text-[10px] px-1.5 py-0.5" />
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

