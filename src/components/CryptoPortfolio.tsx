import { TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/user";

interface CryptoAsset {
  symbol: "SOL" | "USDT" | "BTC";
  name: string;
  balance: number;
  value: number;
  change: number;
  icon: string;
}

const PRICE_MAP: Record<string, number> = {
  SOL: 18000, // KES
  USDT: 145,
  BTC: 5825000,
};

const ICON_MAP: Record<string, string> = { SOL: "🔥", USDT: "💵", BTC: "₿" };
const NAME_MAP: Record<string, string> = { SOL: "Solana", USDT: "Tether USD", BTC: "Bitcoin" };

export const CryptoPortfolio = () => {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);

  useEffect(() => {
    const userId = getUserId();
    const fetchHoldings = async () => {
      const { data, error } = await supabase
        .from("holdings")
        .select("*")
        .eq("user_id", userId);
      if (!error) {
        const mapped = (data || []).map((h: any) => {
          const price = PRICE_MAP[h.symbol] ?? 0;
          return {
            symbol: h.symbol,
            name: NAME_MAP[h.symbol] ?? h.symbol,
            balance: Number(h.amount) || 0,
            value: (Number(h.amount) || 0) * price,
            change: h.symbol === "SOL" ? 8.2 : h.symbol === "USDT" ? 0.1 : -2.1,
            icon: ICON_MAP[h.symbol] ?? "💠",
          } as CryptoAsset;
        });
        setAssets(mapped);
      }
    };

    fetchHoldings();

    const channel = supabase
      .channel("holdings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "holdings", filter: `user_id=eq.${userId}` },
        fetchHoldings
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  return (
    <div className="crypto-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">My Portfolio</h3>
        <span className="text-sm text-muted-foreground">3 assets</span>
      </div>
      
      <div className="space-y-3">
        {assets.map((asset, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-smooth cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-lg">
                {asset.icon}
              </div>
              <div>
                <div className="font-medium">{asset.symbol}</div>
                <div className="text-sm text-muted-foreground">{asset.name}</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-medium">KES {asset.value.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{asset.balance} {asset.symbol}</div>
            </div>
            
            <div className={`flex items-center space-x-1 text-sm ${
              asset.change >= 0 ? 'text-success' : 'text-danger'
            }`}>
              {asset.change >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(asset.change)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};