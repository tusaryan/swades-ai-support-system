
import { useNavigate } from "react-router-dom";
import { LogOut, PanelLeftClose, PanelLeft, User, ShoppingBag, Receipt, MessageSquare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User as UserType } from "@/lib/types";

interface AppHeaderProps {
  user: UserType | null;
  onLogout: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function AppHeader({
  user,
  onLogout,
  sidebarOpen,
  onToggleSidebar,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const initials = user?.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "U";

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </Button>
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/")}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate("/")}
        >
          <img src="/logo.jpg" alt="Swades.ai Logo" className="h-8 w-8 rounded-lg object-cover" />
          <div>
            <h1 className="text-sm font-semibold text-foreground leading-tight">
              Swades AI Support
            </h1>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Multi-Agent System
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-foreground md:inline">
                  {user.name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
                <Settings className="mr-2 h-4 w-4" />
                Profile & Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard/orders")}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                My Orders
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard/invoices")}>
                <Receipt className="mr-2 h-4 w-4" />
                Invoices
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard/history")}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat History
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
