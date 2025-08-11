import { Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { Link } from "react-router-dom";

export const WalletHeader = () => {
  return (
    <header className="flex items-center justify-between p-6 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center space-x-4">
        <div className="crypto-gradient rounded-lg p-2">
          <span className="text-lg font-bold text-white">CW</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold">CryptoWallet</h1>
          <p className="text-sm text-muted-foreground">Secure • Fast • Reliable</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <NotificationsPopover />
        
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
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