
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Search, GitBranch, Sparkles, Loader2, AlertCircle, UserRound } from "lucide-react";
import type { StreamingPhase } from "@/lib/types";
import { PHASE_LABELS } from "@/lib/types";

const PHASE_ICONS: Record<StreamingPhase, React.ReactNode> = {
  analyzing: <Sparkles className="h-4 w-4" />,
  thinking: <Brain className="h-4 w-4" />,
  routing: <GitBranch className="h-4 w-4" />,
  fetching: <Search className="h-4 w-4" />,
  responding: <Loader2 className="h-4 w-4 animate-spin" />,
  escalating: <UserRound className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
  idle: null,
};

interface TypingIndicatorProps {
  phase: StreamingPhase;
}

export function TypingIndicator({ phase }: TypingIndicatorProps) {
  if (phase === "idle") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-4 flex items-start gap-3"
    >
      <motion.div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${phase === "error" ? "bg-destructive/10 text-destructive" : phase === "escalating" ? "bg-teal-500/10 text-teal-500" : "bg-muted text-muted-foreground"}`}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {PHASE_ICONS[phase] || <Loader2 className="h-4 w-4 animate-spin" />}
      </motion.div>
      <div className={`flex items-center gap-2 rounded-2xl backdrop-blur-sm border px-4 py-3 ${phase === "error" ? "bg-destructive/5 border-destructive/20" : phase === "escalating" ? "bg-teal-500/5 border-teal-500/20" : "bg-muted/70 border-border/50"}`}>
        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className={`text-sm font-medium ${phase === "error" ? "text-destructive" : phase === "escalating" ? "text-teal-500" : "text-muted-foreground"}`}
          >
            {PHASE_LABELS[phase]}
          </motion.span>
        </AnimatePresence>
        {phase !== "error" && phase !== "escalating" && (
          <span className="flex gap-1 ml-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary/60"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </span>
        )}
      </div>
    </motion.div>
  );
}
