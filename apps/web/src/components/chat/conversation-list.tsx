
import { cn } from "@/lib/utils";
import type { Conversation, AgentType } from "@/lib/types";
import {
  MessageSquare,
  Package,
  CreditCard,
  HelpCircle,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
}

const agentIcons: Record<AgentType, typeof MessageSquare> = {
  order: Package,
  billing: CreditCard,
  support: HelpCircle,
  router: MessageSquare,
};

const agentColors: Record<AgentType, string> = {
  order: "text-[hsl(var(--agent-order))]",
  billing: "text-[hsl(var(--agent-billing))]",
  support: "text-[hsl(var(--agent-support))]",
  router: "text-muted-foreground",
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ConversationList({
  conversations,
  activeId,
  isLoading,
  onSelect,
  onDelete,
  onNewChat,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button
          onClick={onNewChat}
          variant="outline"
          className="w-full justify-start gap-2 bg-transparent"
        >
          <Plus className="h-4 w-4" />
          New conversation
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 px-3 pb-3">
          {conversations.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No conversations yet.
              <br />
              Start a new chat to get help.
            </div>
          ) : (
            conversations.map((conv) => {
              const Icon = conv.agentType
                ? agentIcons[conv.agentType]
                : MessageSquare;
              const iconColor = conv.agentType
                ? agentColors[conv.agentType]
                : "text-muted-foreground";
              const isActive = activeId === conv.id;

              return (
                <div
                  key={conv.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(conv.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onSelect(conv.id);
                  }}
                  className={cn(
                    "group flex cursor-pointer items-start gap-3 rounded-lg p-3 text-left transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  )}
                >
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconColor)} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {conv.title}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(conv.updatedAt)}
                      </span>
                    </div>
                    {conv.lastMessage && (
                      <p className="truncate text-xs text-muted-foreground">
                        {conv.lastMessage}
                      </p>
                    )}
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                        aria-label={`Delete conversation: ${conv.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this conversation and all its messages. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(conv.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
