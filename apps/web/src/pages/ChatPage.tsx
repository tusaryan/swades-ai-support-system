import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/app-header";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import type { Conversation } from "@/lib/types";
import { useConversations } from "@/hooks/use-conversations";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuthStore();

    const {
        conversations,
        setConversations,
        isLoading: isConversationsLoading,
        fetchConversations,
        deleteConversation,
    } = useConversations();

    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    // Track whether the current temp conversation has received a message
    const [tempConvHasMessages, setTempConvHasMessages] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (isHydrated && !isAuthenticated) {
            navigate("/auth");
        }
    }, [isHydrated, isAuthenticated, navigate]);

    // Determine if there's an empty temp conversation (disable new chat button)
    const hasEmptyTempConversation = useMemo(() => {
        return conversations.some(
            (c) => c.id.startsWith("conv-")
        ) && !tempConvHasMessages;
    }, [conversations, tempConvHasMessages]);

    const handleLogout = useCallback(async () => {
        await logout();
        toast.success("Signed out successfully");
        navigate("/auth");
    }, [logout, navigate]);

    // Remove any empty (unsent) temp conversations from the list
    const cleanupEmptyTempConversations = useCallback(
        (exceptId?: string) => {
            setConversations((prev) =>
                prev.filter((c) => !c.id.startsWith("conv-") || c.id === exceptId)
            );
        },
        [setConversations]
    );

    const handleNewConversation = useCallback(() => {
        // Prevent creating multiple empty chats
        if (hasEmptyTempConversation) return;

        const newConv: Conversation = {
            id: `conv-${Date.now()}`,
            title: "New Conversation",
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        setTempConvHasMessages(false);
        setSidebarOpen(false);
    }, [hasEmptyTempConversation, setConversations]);

    const handleSelectConversation = useCallback(
        (id: string) => {
            // If switching away from an empty temp conversation, auto-remove it
            if (
                activeConversationId &&
                activeConversationId.startsWith("conv-") &&
                !tempConvHasMessages &&
                activeConversationId !== id
            ) {
                cleanupEmptyTempConversations(id);
            }
            setActiveConversationId(id);
            // Reset temp message tracking when switching
            setTempConvHasMessages(!id.startsWith("conv-"));
            setSidebarOpen(false);
        },
        [activeConversationId, tempConvHasMessages, cleanupEmptyTempConversations]
    );

    const handleDeleteConversation = useCallback(
        async (id: string) => {
            // If it's a temp conversation (not yet persisted), just remove it locally
            if (id.startsWith("conv-")) {
                setConversations((prev) => prev.filter((c) => c.id !== id));
                if (activeConversationId === id) {
                    setActiveConversationId(null);
                    setTempConvHasMessages(false);
                }
                toast.success("Conversation deleted");
                return;
            }
            await deleteConversation(id);
            if (activeConversationId === id) {
                setActiveConversationId(null);
            }
            toast.success("Conversation deleted");
        },
        [activeConversationId, deleteConversation, setConversations]
    );

    const handleConversationCreated = useCallback(
        (newId: string) => {
            // Replace the temp conv-xxx ID with the real backend ID
            setConversations((prev) =>
                prev.map((c) =>
                    c.id === activeConversationId
                        ? { ...c, id: newId, updatedAt: new Date() }
                        : c
                )
            );
            setActiveConversationId(newId);
            setTempConvHasMessages(true);
        },
        [activeConversationId, setConversations]
    );

    const handleConversationListRefresh = useCallback(() => {
        // Refresh conversation list from backend to get updated titles
        fetchConversations();
    }, [fetchConversations]);

    // Called by ChatInterface when a message is sent (enables new chat button)
    const handleMessageSent = useCallback(() => {
        setTempConvHasMessages(true);
    }, []);

    if (!isHydrated) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            <AppHeader
                user={user}
                onLogout={handleLogout}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />

            <div className="relative flex flex-1 overflow-hidden">
                {/* Mobile sidebar overlay */}
                {sidebarOpen && (
                    <div
                        className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm md:hidden"
                        onClick={() => setSidebarOpen(false)}
                        role="presentation"
                    />
                )}

                {/* Sidebar */}
                <div
                    className={cn(
                        "absolute inset-y-0 left-0 z-30 w-80 transition-transform duration-200 md:relative md:translate-x-0",
                        sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    <ConversationSidebar
                        conversations={conversations}
                        activeConversationId={activeConversationId}
                        onSelectConversation={handleSelectConversation}
                        onNewConversation={handleNewConversation}
                        onDeleteConversation={handleDeleteConversation}
                        newChatDisabled={hasEmptyTempConversation}
                    />
                </div>

                {/* Main chat area */}
                <main className="flex-1 overflow-hidden">
                    <ChatInterface
                        activeConversationId={activeConversationId}
                        onConversationCreated={handleConversationCreated}
                        onConversationListRefresh={handleConversationListRefresh}
                        onMessageSent={handleMessageSent}
                    />
                </main>
            </div>
        </div>
    );
}
