import { useEffect, useState } from "react";

// Fetch live KES prices from CoinGecko with graceful fallback
export function usePrices() {
  const [prices, setPrices] = useState<Record<string, number>>({ SOL: 0, USDT: 0, BTC: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin,tether&vs_currencies=kes",
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Price API error");
        const data = await res.json();
        setPrices({
          SOL: data.solana?.kes ?? 0,
          USDT: data.tether?.kes ?? 0,
          BTC: data.bitcoin?.kes ?? 0,
        });
      } catch {
        // Fallback to conservative defaults if API fails
        setPrices({ SOL: 23100, USDT: 129.5, BTC: 15330000 });
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, []);

  return { prices, loading };
}
