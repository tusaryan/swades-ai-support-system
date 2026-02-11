
import { Bot, Package, CreditCard, HelpCircle, ArrowRight } from "lucide-react";
import { AGENT_CAPABILITIES } from "@/lib/types";

const agentIcons = {
  support: HelpCircle,
  order: Package,
  billing: CreditCard,
  router: Bot,
};

const agentStyles = {
  support: "bg-[hsl(var(--agent-support)/.1)] text-[hsl(var(--agent-support))]",
  order: "bg-[hsl(var(--agent-order)/.1)] text-[hsl(var(--agent-order))]",
  billing: "bg-[hsl(var(--agent-billing)/.1)] text-[hsl(var(--agent-billing))]",
  router: "bg-muted text-muted-foreground",
};

interface WelcomeScreenProps {
  onSuggestionClick: (message: string) => void;
}

const suggestions = [
  { text: "Where is my order #ORD-2024-8891?", agent: "order" as const },
  { text: "I need a refund for my last invoice", agent: "billing" as const },
  { text: "How do I reset my password?", agent: "support" as const },
  { text: "Show me my recent orders", agent: "order" as const },
  { text: "What is your return policy?", agent: "support" as const },
  { text: "Check my payment history", agent: "billing" as const },
];

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-12">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Bot className="h-8 w-8 text-primary" />
      </div>

      <h2 className="mb-2 text-2xl font-bold text-foreground text-balance text-center">
        How can I help you today?
      </h2>
      <p className="mb-8 max-w-md text-center text-sm text-muted-foreground text-pretty">
        I am an AI-powered support system with specialized agents for orders,
        billing, and general support. Ask me anything!
      </p>

      {/* Agent capabilities */}
      <div className="mb-8 grid w-full max-w-2xl gap-3 md:grid-cols-3">
        {AGENT_CAPABILITIES.map((agent) => {
          const Icon = agentIcons[agent.type];
          const style = agentStyles[agent.type];

          return (
            <div
              key={agent.type}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
            >
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${style}`}>
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-card-foreground">{agent.name}</h3>
              <p className="text-xs text-muted-foreground">
                {agent.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick suggestions */}
      <div className="w-full max-w-2xl">
        <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Try asking
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {suggestions.map((s) => {
            const Icon = agentIcons[s.agent];
            const style = agentStyles[s.agent];

            return (
              <button
                key={s.text}
                onClick={() => onSuggestionClick(s.text)}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="flex-1 text-sm text-card-foreground">{s.text}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
