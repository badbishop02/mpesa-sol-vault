import { Plus, ArrowUpRight, ArrowDownLeft, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { DepositModal } from "./DepositModal";
import { CryptoBuyModal } from "./CryptoBuyModal";
import { supabase } from "@/integrations/supabase/client";

export const QuickActions = () => {
  const { toast } = useToast();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showBuyCrypto, setShowBuyCrypto] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Get current user
  supabase.auth.getUser().then(({ data: { user } }) => {
    setUser(user);
  });

  const actions = [
    {
      icon: Plus,
      label: "Deposit",
      description: "Add money via M-Pesa",
      variant: "default" as const,
      className: "crypto-gradient hover:opacity-90",
      onClick: () => setShowDeposit(true)
    },
    {
      icon: ArrowUpRight,
      label: "Buy Crypto",
      description: "Purchase SOL or USDT",
      variant: "secondary" as const,
      className: "",
      onClick: () => setShowBuyCrypto(true)
    },
    {
      icon: ArrowDownLeft,
      label: "Sell",
      description: "Convert to KES",
      variant: "secondary" as const,
      className: "",
      onClick: () => toast({ title: "Coming Soon", description: "Sell functionality will be available soon!" })
    },
    {
      icon: Repeat,
      label: "Swap",
      description: "Exchange tokens",
      variant: "secondary" as const,
      className: "",
      onClick: () => toast({ title: "Coming Soon", description: "Swap functionality will be available soon!" })
    }
  ];

  return (
    <>
      <div className="crypto-card">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant}
                onClick={action.onClick}
                className={`flex flex-col items-center justify-center h-20 space-y-1 transition-smooth hover:scale-105 ${action.className}`}
              >
                <Icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium text-sm">{action.label}</div>
                  <div className="text-xs opacity-80">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {showDeposit && user && (
        <DepositModal
          isOpen={showDeposit}
          onClose={() => setShowDeposit(false)}
          userId={user.id}
        />
      )}

      {showBuyCrypto && user && (
        <CryptoBuyModal
          isOpen={showBuyCrypto}
          onClose={() => setShowBuyCrypto(false)}
          userId={user.id}
        />
      )}
    </>
  );
};