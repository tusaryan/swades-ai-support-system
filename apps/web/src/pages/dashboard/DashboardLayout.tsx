import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    ShoppingBag,
    Receipt,
    MessageSquare,
    User,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';

const SIDERBAR_ITEMS = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
    { label: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
    { label: 'Chat History', href: '/dashboard/history', icon: MessageSquare },
    { label: 'Profile', href: '/dashboard/profile', icon: User },
];

export default function DashboardLayout() {
    const { pathname } = useLocation();
    const { logout } = useAuth();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-card border-r">
            <div className="p-6 border-b">
                <Link to="/" className="flex items-center gap-2">
                    <img src="/logo.jpg" alt="Swades.ai Logo" className="h-8 w-8 rounded-lg object-cover" />
                    <span className="font-bold text-xl">Swades.ai</span>
                </Link>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {SIDERBAR_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => logout()}
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
            {/* Mobile Top Header */}
            <div className="sticky top-0 z-40 md:hidden flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur-sm">
                <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
                <Link to="/" className="flex items-center gap-2">
                    <img src="/logo.jpg" alt="Swades.ai Logo" className="h-7 w-7 rounded-md object-cover" />
                    <span className="font-semibold text-sm">Dashboard</span>
                </Link>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:block w-64 shrink-0">
                <div className="h-full fixed w-64">
                    <SidebarContent />
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="mx-auto max-w-6xl">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
