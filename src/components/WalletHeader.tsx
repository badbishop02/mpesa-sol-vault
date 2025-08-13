import { Settings, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const WalletHeader = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const isActive = (path: string) =>
    pathname === path ? "text-primary" : "text-muted-foreground hover:text-foreground";

  return (
    <header className="flex items-center justify-between p-6 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center space-x-4">
        <Link to="/" className="crypto-gradient rounded-lg p-2" aria-label="WalletOS Home">
          <span className="text-lg font-bold text-white">WO</span>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">WalletOS</h1>
          <p className="text-sm text-muted-foreground">Secure • Fast • Reliable</p>
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <Link to="/" className={isActive("/")}>Home</Link>
        <Link to="/profile" className={isActive("/profile")}>Profile</Link>
        <Link to="/transactions" className={isActive("/transactions")}>Transactions</Link>
        <Link to="/support" className={isActive("/support")}>Support</Link>
      </nav>

      <div className="flex items-center space-x-3">
        <NotificationsPopover />
        <Button variant="ghost" size="icon" asChild>
          <Link to="/profile" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>
        <Link to="/profile" aria-label="Profile">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-user.jpg" alt="User avatar" />
            <AvatarFallback className="crypto-gradient text-white text-sm">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Link>
        <Button variant="outline" size="sm" onClick={signOut} className="inline-flex">
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </div>
    </header>
  );
};