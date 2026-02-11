import { useEffect } from "react";
import { useConversations } from "@/hooks/use-conversations";
import { format } from "date-fns";
import { MessageSquare, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function ChatHistoryPage() {
    const { conversations, isLoading, fetchConversations } = useConversations();

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading history...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Chat History</h2>
                <p className="text-muted-foreground">View your past conversations with Swades.ai support.</p>
            </div>

            <div className="grid gap-4">
                {conversations.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium">No conversations yet</h3>
                            <p className="text-muted-foreground mt-1 mb-4">Start a new chat to get help.</p>
                            <Button asChild>
                                <Link to="/chat">Start Chat</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    conversations.map((conv) => (
                        <Card key={conv.id} className="group hover:bg-muted/50 transition-colors">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-medium truncate max-w-[200px] sm:max-w-md">
                                        {conv.title || "New Conversation"}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {format(new Date(conv.updatedAt), "MMM d, yyyy • h:mm a")}
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link to={`/chat?id=${conv.id}`} className="gap-2">
                                        View Chat
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
