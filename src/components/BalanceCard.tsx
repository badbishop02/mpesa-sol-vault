import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";


export const BalanceCard = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const changePercent = 12.5;

  useEffect(() => {
    const fetchBalance = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from("wallets")
        .select("balance_kes")
        .eq("user_id", userId)
        .maybeSingle();
      if (!error) {
        setTotalBalance(Number(data?.balance_kes ?? 0));
      }

      const channel = supabase
        .channel("wallets-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${userId}` },
          (payload) => {
            const newRow: any = (payload as any).new;
            if (newRow?.balance_kes !== undefined) {
              setTotalBalance(Number(newRow.balance_kes));
            } else {
              fetchBalance();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchBalance();
  }, []);

  return (
    <div className="crypto-card relative overflow-hidden">
      <div className="absolute inset-0 crypto-gradient opacity-10"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Total Balance</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowBalance(!showBalance)}
            className="h-8 w-8"
          >
            {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="text-3xl font-bold">
            {showBalance ? `KES ${totalBalance.toLocaleString()}` : "••••••••"}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-success text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>+{changePercent}%</span>
            </div>
            <span className="text-muted-foreground text-sm">24h change</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-lg font-semibold">
              {showBalance ? `KES ${(totalBalance * 0.8).toLocaleString()}` : "••••••"}
            </p>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Invested</p>
            <p className="text-lg font-semibold">
              {showBalance ? `KES ${(totalBalance * 0.2).toLocaleString()}` : "••••••"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};