import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Shield, Zap, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

export default function AuthPage() {
    const [mode, setMode] = useState<"login" | "register">("login");
    const navigate = useNavigate();
    const { login, register, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/chat");
        }
    }, [isAuthenticated, navigate]);

    const handleLogin = async (email: string, password: string) => {
        await login(email, password);
        navigate("/chat");
    };

    const handleRegister = async (email: string, password: string, name: string) => {
        await register(email, password, name);
        navigate("/chat");
    };

    return (
        <div className="flex min-h-screen">
            {/* Left side - Branding */}
            <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 lg:flex">
                <div className="flex items-center gap-3">
                    <img src="/logo.jpg" alt="Swades.ai Logo" className="h-10 w-10 rounded-lg object-cover" />
                    <span className="text-lg font-bold text-primary-foreground">
                        Swades AI
                    </span>
                </div>

                <div>
                    <h2 className="mb-6 text-3xl font-bold text-primary-foreground text-balance leading-tight">
                        Intelligent customer support, powered by AI agents
                    </h2>
                    <div className="flex flex-col gap-4">
                        {[
                            {
                                icon: MessageSquare,
                                title: "Multi-Agent Routing",
                                description:
                                    "Queries are automatically routed to specialized agents",
                            },
                            {
                                icon: Zap,
                                title: "Real-Time Streaming",
                                description:
                                    "Watch AI responses stream in with live status updates",
                            },
                            {
                                icon: Shield,
                                title: "Secure & Production-Ready",
                                description:
                                    "JWT authentication with refresh tokens and rate limiting",
                            },
                        ].map((feature) => (
                            <div
                                key={feature.title}
                                className="flex items-start gap-3 rounded-lg bg-primary-foreground/10 p-4"
                            >
                                <feature.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary-foreground" />
                                <div>
                                    <div className="text-sm font-semibold text-primary-foreground">
                                        {feature.title}
                                    </div>
                                    <div className="text-sm text-primary-foreground/80">
                                        {feature.description}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-sm text-primary-foreground/60">
                    Built for the Swades - Full Stack Engineer Assessment
                </p>
            </div>

            {/* Right side - Auth form */}
            <div className="flex w-full flex-col items-center justify-center bg-background p-6 lg:w-1/2">
                {/* Mobile logo */}
                <div className="mb-8 flex items-center gap-2 lg:hidden">
                    <img src="/logo.jpg" alt="Swades.ai Logo" className="h-10 w-10 rounded-lg object-cover" />
                    <span className="text-lg font-bold text-foreground">Swades AI</span>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-md"
                    >
                        {mode === "login" ? (
                            <LoginForm
                                onLogin={handleLogin}
                                onSwitchToRegister={() => setMode("register")}
                            />
                        ) : (
                            <RegisterForm
                                onRegister={handleRegister}
                                onSwitchToLogin={() => setMode("login")}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
