
import { useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import type { Message, StreamingPhase } from "@/lib/types";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  streamingPhase: StreamingPhase;
  onQuickReply?: (text: string) => void;
}

export function MessageList({
  messages,
  isStreaming,
  streamingPhase,
  onQuickReply,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming, streamingPhase]);

  // Determine which message is the last assistant message (for showing quick-reply buttons)
  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return i;
    }
    return -1;
  })();

  return (
    <div
      ref={scrollRef}
      className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6"
    >
      <div className="mx-auto max-w-3xl">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id || `msg-${index}`}
              message={message}
              isLastAssistant={index === lastAssistantIndex}
              onQuickReply={onQuickReply}
              isStreaming={isStreaming}
            />
          ))}
        </AnimatePresence>
        <AnimatePresence>
          {isStreaming && streamingPhase !== "idle" && (
            <TypingIndicator phase={streamingPhase} />
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
