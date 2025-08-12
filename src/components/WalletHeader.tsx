import { Settings, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { supabase } from "@/integrations/supabase/client";

export const WalletHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const NavLink = ({ to, label }: { to: string; label: string }) => (
    <Link to={to} className={`text-sm px-3 py-2 rounded-md hover:bg-accent ${location.pathname === to ? "font-semibold" : "text-muted-foreground"}`}>{label}</Link>
  );

  return (
    <header className="flex items-center justify-between p-6 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center space-x-4">
        <div className="crypto-gradient rounded-lg p-2">
          <span className="text-lg font-bold text-white">WO</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold">WalletOS</h1>
          <p className="text-sm text-muted-foreground">Secure • Fast • Reliable</p>
        </div>
        <nav className="hidden md:flex items-center space-x-1 ml-6">
          <NavLink to="/" label="Home" />
          <NavLink to="/profile" label="Profile" />
          <NavLink to="/transactions" label="Transactions" />
          <NavLink to="/support" label="Support" />
        </nav>
      </div>
      
      <div className="flex items-center space-x-3">
        <NotificationsPopover />
        <div className="hidden sm:block">
          <WalletMultiButton className="!bg-primary !text-primary-foreground !rounded-md !h-10" />
        </div>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="outline" onClick={signOut} className="hidden sm:flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
        <Link to="/profile" aria-label="Profile">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-user.jpg" alt="User avatar" />
            <AvatarFallback className="crypto-gradient text-white text-sm">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
};