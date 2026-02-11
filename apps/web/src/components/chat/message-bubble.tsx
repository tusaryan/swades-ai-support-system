import { cn } from "@/lib/utils";
import type { Message, AgentType } from "@/lib/types";
import { AgentBadge } from "./agent-badge";
import { QuickReplyButtons, EscalationBanner } from "./quick-reply";
import { parseMessageMarkers } from "@/lib/parse-message";
import { useMemo } from "react";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isLastAssistant?: boolean;
  onQuickReply?: (text: string) => void;
  isStreaming?: boolean;
}

function formatContent(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 text-xs">$1</code>')
    .replace(/\n/g, "<br />");
}

export function MessageBubble({
  message,
  isLastAssistant = false,
  onQuickReply,
  isStreaming = false,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isError = message.isError;

  // Parse OPTIONS and ESCALATE markers from assistant messages
  const parsed = useMemo(() => {
    if (isUser || !message.content) return { content: message.content, options: [], escalationMessage: null };
    return parseMessageMarkers(message.content);
  }, [message.content, isUser]);

  const formattedContent = useMemo(
    () => formatContent(parsed.content),
    [parsed.content]
  );

  // Only show quick-reply options on the LAST assistant message and when not streming
  const showQuickReply = isLastAssistant && !isStreaming && parsed.options.length > 0;
  const showEscalation = !isUser && parsed.escalationMessage !== null;

  return (
    <div className={cn("mb-4 flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            isError
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          )}
        >
          AI
        </div>
      )}

      <div className={cn("max-w-[75%] flex flex-col", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : isError
                ? "bg-destructive/5 border border-destructive/20 text-foreground rounded-bl-md"
                : "bg-muted text-foreground rounded-bl-md"
          )}
        >
          {isError && (
            <div className="mb-2 flex items-center gap-1.5 text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Error</span>
            </div>
          )}
          <div
            className="prose prose-sm dark:prose-invert max-w-none [&>br:last-child]:hidden"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
        </div>

        {/* Quick-reply option buttons */}
        {showQuickReply && onQuickReply && (
          <QuickReplyButtons options={parsed.options} onSelect={onQuickReply} />
        )}

        {/* Human escalation banner */}
        {showEscalation && (
          <EscalationBanner message={parsed.escalationMessage!} />
        )}

        {/* Metadata: agent badge + timestamp */}
        <div className="mt-1 flex items-center gap-2 px-1">
          {!isUser && message.agentType && (
            <AgentBadge
              agentType={message.agentType}
              className="text-[10px] px-1.5 py-0.5"
            />
          )}
          <span className="text-[10px] text-muted-foreground">
            {(() => {
              try {
                const date = new Date(message.timestamp);
                return isNaN(date.getTime())
                  ? format(new Date(), "h:mm a")
                  : format(date, "h:mm a");
              } catch {
                return format(new Date(), "h:mm a");
              }
            })()}
          </span>
        </div>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
          U
        </div>
      )}
    </div>
  );
}
