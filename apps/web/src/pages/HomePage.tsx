import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowRight,
    MessageSquare,
    Zap,
    Shield,
    Package,
    CreditCard,
    HelpCircle,
    Plus,
    Minus,
    Menu,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuthStore } from "@/lib/auth-store";
import { AnimatePresence } from "framer-motion";

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-[#d4a574]/20 rounded-xl bg-white/80 dark:bg-[#1a1410]/80 overflow-hidden backdrop-blur-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between p-5 text-left font-medium transition-colors hover:bg-[#f5e6d3]/50 dark:hover:bg-[#2a1f15]/50"
            >
                {question}
                {isOpen ? <Minus className="h-4 w-4 shrink-0 text-[#8B4513]" /> : <Plus className="h-4 w-4 shrink-0 text-[#8B4513]" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const NAV_SECTIONS = ["features", "agents", "faq"] as const;
type SectionId = typeof NAV_SECTIONS[number];

export default function HomePage() {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<SectionId | null>(null);
    const [articles, setArticles] = useState<{ id: string; title: string; content: string; category: string; tags?: string[] }[]>([]);
    const [articlesLoading, setArticlesLoading] = useState(true);
    const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
        features: null,
        agents: null,
        faq: null,
    });

    // Scroll-spy via Intersection Observer
    useEffect(() => {
        const observers: IntersectionObserver[] = [];
        const visibleSections = new Map<SectionId, number>();

        NAV_SECTIONS.forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                sectionRefs.current[id] = el;
                const observer = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting) {
                                visibleSections.set(id, entry.intersectionRatio);
                            } else {
                                visibleSections.delete(id);
                            }
                            // Pick the section with the highest ratio
                            let best: SectionId | null = null;
                            let bestRatio = 0;
                            visibleSections.forEach((ratio, sId) => {
                                if (ratio > bestRatio) {
                                    bestRatio = ratio;
                                    best = sId;
                                }
                            });
                            setActiveSection(best);
                        });
                    },
                    { threshold: [0, 0.25, 0.5, 0.75], rootMargin: "-80px 0px -30% 0px" }
                );
                observer.observe(el);
                observers.push(observer);
            }
        });

        return () => observers.forEach((o) => o.disconnect());
    }, [mounted]);

    // Fetch support articles for FAQ
    useEffect(() => {
        const API_BASE = import.meta.env.VITE_API_URL || "";
        fetch(`${API_BASE}/api/articles`)
            .then((res) => res.ok ? res.json() : [])
            .then((data) => setArticles(data))
            .catch(() => setArticles([]))
            .finally(() => setArticlesLoading(false));
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    // No longer auto-redirect — let logged-in users see the homepage

    if (!mounted) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#FFF8F0] dark:bg-[#0d0a07]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8B4513] border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFF8F0] dark:bg-[#0d0a07] text-foreground">
            {/* Floating Navbar */}
            <nav className="sticky top-0 z-50 px-4 pt-3 sm:px-6">
                <div className="mx-auto max-w-6xl rounded-2xl border border-[#d4a574]/30 bg-white/70 dark:bg-[#1a1410]/70 backdrop-blur-xl shadow-sm px-4 sm:px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <img src="/logo.jpg" alt="Swades.ai Logo" className="h-9 w-9 rounded-lg object-cover" />
                            <span className="text-lg font-bold text-[#8B4513] dark:text-[#d4a574]">
                                swades.ai
                            </span>
                        </div>

                        {/* Desktop nav links with scroll-spy */}
                        <div className="hidden md:flex items-center gap-1 text-sm font-medium text-foreground/70">
                            {NAV_SECTIONS.map((id) => (
                                <a
                                    key={id}
                                    href={`#${id}`}
                                    className="relative px-4 py-1.5 rounded-full transition-colors duration-200"
                                    style={{ color: activeSection === id ? '#8B4513' : undefined }}
                                >
                                    {activeSection === id && (
                                        <motion.span
                                            layoutId="nav-pill"
                                            className="absolute inset-0 rounded-full bg-[#f5e6d3] dark:bg-[#2a1f15]"
                                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 capitalize">{id}</span>
                                </a>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <ThemeToggle />
                            {isAuthenticated ? (
                                <>
                                    <Button
                                        onClick={() => navigate("/dashboard")}
                                        variant="ghost"
                                        size="sm"
                                        className="hidden sm:inline-flex text-foreground/70 hover:text-[#8B4513]"
                                    >
                                        Dashboard
                                    </Button>
                                    <Button
                                        onClick={() => navigate("/chat")}
                                        size="sm"
                                        className="bg-[#8B4513] hover:bg-[#6d350f] text-white rounded-full px-5"
                                    >
                                        Open Chat
                                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        onClick={() => navigate("/auth")}
                                        variant="ghost"
                                        size="sm"
                                        className="hidden sm:inline-flex text-foreground/70 hover:text-[#8B4513]"
                                    >
                                        Sign in
                                    </Button>
                                    <Button
                                        onClick={() => navigate("/auth")}
                                        size="sm"
                                        className="bg-[#8B4513] hover:bg-[#6d350f] text-white rounded-full px-5"
                                    >
                                        Get Started
                                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                    </Button>
                                </>
                            )}

                            {/* Mobile menu toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden h-8 w-8"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Mobile menu */}
                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="md:hidden overflow-hidden"
                            >
                                <div className="flex flex-col gap-2 pt-3 pb-1 border-t border-[#d4a574]/20 mt-3">
                                    <a href="#features" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#f5e6d3]/50 dark:hover:bg-[#2a1f15]/50 transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</a>
                                    <a href="#agents" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#f5e6d3]/50 dark:hover:bg-[#2a1f15]/50 transition-colors" onClick={() => setMobileMenuOpen(false)}>Agents</a>
                                    <a href="#faq" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#f5e6d3]/50 dark:hover:bg-[#2a1f15]/50 transition-colors" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                                    <button className="px-3 py-2 rounded-lg text-sm font-medium text-left hover:bg-[#f5e6d3]/50 dark:hover:bg-[#2a1f15]/50 sm:hidden transition-colors" onClick={() => { setMobileMenuOpen(false); navigate("/auth"); }}>Sign in</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </nav>

            {/* Hero Section — Warm gradient background */}
            <section className="px-4 sm:px-6 pt-8 pb-4">
                <div className="mx-auto max-w-6xl">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#A0522D] via-[#C4703F] to-[#D4925C] px-6 py-16 sm:px-12 sm:py-24 md:py-32 text-center">
                        {/* Subtle pattern overlay */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.15) 0%, transparent 50%)" }} />
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="relative z-10 flex flex-col items-center"
                        >
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-white/90">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                                Multi-Agent AI System
                            </div>
                            <h1 className="mb-4 max-w-3xl text-4xl font-bold tracking-tight text-white text-balance sm:text-5xl md:text-6xl lg:text-7xl" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
                                AI-Powered Customer Support
                            </h1>
                            <p className="mb-8 max-w-xl text-base sm:text-lg text-white/80 leading-relaxed text-balance">
                                Intelligent routing, real-time streaming, and specialized agents for
                                orders, billing, and support.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <Button
                                    onClick={() => navigate("/auth")}
                                    size="lg"
                                    className="bg-white text-[#8B4513] hover:bg-white/90 rounded-full px-8 font-semibold shadow-lg"
                                >
                                    Launch Chat
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => navigate("/auth")}
                                    className="bg-[#1a1410] border-[#1a1410] text-white hover:bg-[#2a1f15] rounded-full px-8 font-semibold"
                                >
                                    View Demo
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="features" className="px-4 sm:px-6 py-16 sm:py-20">
                <div className="mx-auto max-w-6xl">
                    <h2 className="mb-3 text-center text-2xl sm:text-3xl font-bold text-foreground">
                        How it works
                    </h2>
                    <p className="mx-auto mb-12 max-w-md text-center text-sm text-muted-foreground">
                        Your message is analyzed, routed to a specialist agent, and answered
                        with real data from our tools.
                    </p>
                    <div className="grid gap-6 md:grid-cols-3">
                        {[
                            {
                                icon: MessageSquare,
                                title: "Router Agent",
                                description:
                                    "Classifies your query and determines which specialist should handle it.",
                            },
                            {
                                icon: Zap,
                                title: "Specialist Agents",
                                description:
                                    "Order, Billing, and Support agents use tools to query real data.",
                            },
                            {
                                icon: Shield,
                                title: "Tool-Based Access",
                                description:
                                    "Agents never hallucinate - they only respond with verified database results.",
                            },
                        ].map((feature) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4 }}
                                className="flex flex-col rounded-2xl border border-[#d4a574]/20 bg-white/80 dark:bg-[#1a1410]/80 backdrop-blur-sm p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5e6d3] dark:bg-[#2a1f15] text-[#8B4513]">
                                    <feature.icon className="h-5 w-5" />
                                </div>
                                <h3 className="mb-2 text-base font-semibold text-foreground">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Specialized Agents */}
            <section id="agents" className="px-4 sm:px-6 py-16 sm:py-20">
                <div className="mx-auto max-w-6xl">
                    <h2 className="mb-3 text-center text-2xl sm:text-3xl font-bold text-foreground">
                        Specialized Agents
                    </h2>
                    <p className="mx-auto mb-12 max-w-md text-center text-sm text-muted-foreground">
                        Each agent is an expert in its domain with dedicated tools for
                        accurate responses.
                    </p>
                    <div className="grid gap-5 md:grid-cols-3">
                        {[
                            {
                                icon: Package,
                                title: "Order Agent",
                                description:
                                    "Track orders, delivery status, shipping info, and tracking numbers",
                                tools: [
                                    "getOrderById",
                                    "getDeliveryStatus",
                                    "getOrdersByUser",
                                ],
                                accentColor: "from-orange-500/20 to-amber-500/20",
                                iconBg: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
                            },
                            {
                                icon: CreditCard,
                                title: "Billing Agent",
                                description:
                                    "Invoice lookup, payment history, refund requests, and billing inquiries",
                                tools: [
                                    "getInvoice",
                                    "getPaymentHistory",
                                    "getRefundStatus",
                                ],
                                accentColor: "from-emerald-500/20 to-teal-500/20",
                                iconBg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
                            },
                            {
                                icon: HelpCircle,
                                title: "Support Agent",
                                description:
                                    "FAQ answers, help articles, account management, and general support",
                                tools: ["searchArticles", "getArticleById"],
                                accentColor: "from-violet-500/20 to-purple-500/20",
                                iconBg: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
                            },
                        ].map((agent) => (
                            <motion.div
                                key={agent.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4 }}
                                className="flex flex-col rounded-2xl border border-[#d4a574]/20 bg-white/80 dark:bg-[#1a1410]/80 backdrop-blur-sm p-6 hover:shadow-md transition-shadow"
                            >
                                <div
                                    className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${agent.iconBg}`}
                                >
                                    <agent.icon className="h-5 w-5" />
                                </div>
                                <h3 className="mb-1 text-base font-semibold text-foreground">
                                    {agent.title}
                                </h3>
                                <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                                    {agent.description}
                                </p>
                                <div className="mt-auto flex flex-wrap gap-1.5">
                                    {agent.tools.map((tool) => (
                                        <span
                                            key={tool}
                                            className="rounded-lg bg-[#f5e6d3] dark:bg-[#2a1f15] px-2.5 py-1 font-mono text-[10px] text-[#8B4513] dark:text-[#d4a574]"
                                        >
                                            {tool}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="px-4 sm:px-6 py-16 sm:py-20">
                <div className="mx-auto max-w-3xl">
                    <h2 className="mb-3 text-center text-2xl sm:text-3xl font-bold text-foreground">
                        Frequently Asked Questions
                    </h2>
                    <p className="mx-auto mb-10 max-w-md text-center text-sm text-muted-foreground">
                        Common questions about our AI support system.
                    </p>
                    <div className="space-y-3">
                        {articlesLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="border border-[#d4a574]/20 rounded-xl bg-white/80 dark:bg-[#1a1410]/80 p-5 animate-pulse">
                                        <div className="h-5 w-3/4 bg-[#d4a574]/20 rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : articles.length > 0 ? (
                            articles.map((article) => (
                                <FAQItem
                                    key={article.id}
                                    question={article.title}
                                    answer={article.content}
                                />
                            ))
                        ) : (
                            /* Fallback if no articles returned */
                            <>
                                <FAQItem
                                    question="How does the multi-agent routing work?"
                                    answer="When you send a message, our Router Agent analyzes the intent and classifies it into one of three categories: Order, Billing, or Support. It then delegates to the appropriate specialist agent."
                                />
                                <FAQItem
                                    question="Is my conversation data secure?"
                                    answer="Yes. All communications are encrypted with JWT and refresh token rotation, rate limiting, and CORS protection."
                                />
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer — Warm toned */}
            <footer className="px-4 sm:px-6 pb-6">
                <div className="mx-auto max-w-6xl">
                    <div className="rounded-2xl bg-gradient-to-br from-[#A0522D] via-[#B5623A] to-[#C4703F] px-8 py-10 sm:px-12 sm:py-12">
                        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
                            {/* Brand */}
                            <div className="sm:col-span-2 md:col-span-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <img src="/logo.jpg" alt="Swades.ai Logo" className="h-8 w-8 rounded-lg object-cover" />
                                    <span className="text-lg font-bold text-white">swades.ai</span>
                                </div>
                                <p className="text-sm text-white/70 leading-relaxed">
                                    AI from India,<br />
                                    Solutions for All.
                                </p>
                            </div>

                            {/* Quick Links */}
                            <div>
                                <h4 className="mb-3 text-sm font-semibold text-white">Quick Links</h4>
                                <div className="flex flex-col gap-2 text-sm text-white/60">
                                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                                    <a href="#agents" className="hover:text-white transition-colors">Agents</a>
                                    <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
                                </div>
                            </div>

                            {/* Product */}
                            <div>
                                <h4 className="mb-3 text-sm font-semibold text-white">Product</h4>
                                <div className="flex flex-col gap-2 text-sm text-white/60">
                                    <button onClick={() => navigate("/auth")} className="text-left hover:text-white transition-colors">Launch Chat</button>
                                    <button onClick={() => navigate("/auth")} className="text-left hover:text-white transition-colors">Sign Up</button>
                                    <button onClick={() => navigate("/auth")} className="text-left hover:text-white transition-colors">Sign In</button>
                                </div>
                            </div>

                            {/* Legal / CTA */}
                            <div>
                                <h4 className="mb-3 text-sm font-semibold text-white">Get Started</h4>
                                <Button
                                    onClick={() => navigate("/auth")}
                                    size="sm"
                                    className="bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-full px-5 mb-4"
                                >
                                    Explore our innovations
                                </Button>
                                <p className="text-xs text-white/40">
                                    Built for Swades AI Assessment
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <p className="text-xs text-white/40 text-center sm:text-left">
                                © 2025 Swades AI. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
