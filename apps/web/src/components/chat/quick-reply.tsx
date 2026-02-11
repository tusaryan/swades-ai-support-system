import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuickReplyButtonsProps {
    options: string[];
    onSelect: (option: string) => void;
    disabled?: boolean;
    className?: string;
}

export function QuickReplyButtons({
    options,
    onSelect,
    disabled = false,
    className,
}: QuickReplyButtonsProps) {
    if (options.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={cn("flex flex-wrap gap-2 mt-3", className)}
        >
            {options.map((option, index) => (
                <motion.button
                    key={option}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.05 * index }}
                    onClick={() => onSelect(option)}
                    disabled={disabled}
                    className={cn(
                        "inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary",
                        "transition-all duration-200 hover:bg-primary/15 hover:border-primary/50 hover:shadow-sm",
                        "active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1",
                        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                >
                    {option}
                </motion.button>
            ))}
        </motion.div>
    );
}

interface EscalationBannerProps {
    message: string;
    className?: string;
}

export function EscalationBanner({ message, className }: EscalationBannerProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className={cn(
                "mt-3 rounded-xl border border-teal-500/30 bg-gradient-to-r from-teal-500/5 to-teal-600/10 p-4",
                className
            )}
        >
            <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/10">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-teal-500"
                    >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                </div>
                <div className="flex-1">
                    <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1">
                        Customer Support Agent
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{message}</p>
                </div>
            </div>
        </motion.div>
    );
}
