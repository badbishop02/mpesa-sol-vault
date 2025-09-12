import { useState } from "react";
import { executeTradeViaEdge, mapSupabaseError, type TradeRequest } from "@/services/trading";
import { useToast } from "@/hooks/use-toast";
import { getUserBucket } from "@/lib/rateLimiter";

export function useTradeCrypto() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function trade(tradeRequest: TradeRequest, userId?: string) {
    setLoading(true);
    try {
      // Client-side rate limiting check
      if (userId) {
        const bucket = getUserBucket(userId);
        if (!bucket.take()) {
          throw new Error("Too many requests. Please wait before trading again.");
        }
      }

      // Validate trade request
      if (!tradeRequest.symbol || !tradeRequest.amountKes || !tradeRequest.price) {
        throw new Error("Invalid trade parameters");
      }

      if (tradeRequest.amountKes <= 0) {
        throw new Error("Amount must be greater than zero");
      }

      if (tradeRequest.price <= 0) {
        throw new Error("Invalid price");
      }

      const result = await executeTradeViaEdge(tradeRequest);
      
      const cryptoAmount = (tradeRequest.amountKes / tradeRequest.price).toFixed(6);
      
      toast({ 
        title: "Trade Successful", 
        description: `${tradeRequest.side === 'buy' ? 'Bought' : 'Sold'} ${cryptoAmount} ${tradeRequest.symbol} for KES ${tradeRequest.amountKes.toLocaleString()}`
      });
      
      return { success: true, data: result };
    } catch (err) {
      const message = mapSupabaseError(err);
      toast({ 
        title: "Trade Failed", 
        description: message, 
        variant: "destructive" 
      });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }

  return { trade, loading } as const;
}