
import { cn } from "@/lib/utils";
import type { AgentType } from "@/lib/types";
import { HelpCircle, Package, CreditCard, Bot } from "lucide-react";

interface AgentBadgeProps {
  agentType: AgentType;
  className?: string;
}

const agentConfig: Record<
  AgentType,
  {
    icon: typeof Bot;
    label: string;
    className: string;
  }
> = {
  support: {
    icon: HelpCircle,
    label: "Support Specialist",
    className: "bg-[hsl(var(--agent-support)/.1)] text-[hsl(var(--agent-support))]",
  },
  order: {
    icon: Package,
    label: "Order Specialist",
    className: "bg-[hsl(var(--agent-order)/.1)] text-[hsl(var(--agent-order))]",
  },
  billing: {
    icon: CreditCard,
    label: "Billing Specialist",
    className: "bg-[hsl(var(--agent-billing)/.1)] text-[hsl(var(--agent-billing))]",
  },
  router: {
    icon: Bot,
    label: "AI Assistant",
    className: "bg-muted text-muted-foreground",
  },
};

export function AgentBadge({ agentType, className }: AgentBadgeProps) {
  const config = agentConfig[agentType] || agentConfig.router;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  );
}
