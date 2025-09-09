import { useEffect, useState } from "react";
import { supabaseWithRetry } from "../lib/supabaseClient";
import { useErrorHandler } from "./useErrorHandler";
import type { IHoldings } from "../types/index";

export function usePortfolio(userId?: string) {
  const [holdings, setHoldings] = useState<IHoldings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [totalValue, setTotalValue] = useState(0);
  const handleError = useErrorHandler();

  useEffect(() => {
    if (!userId) {
      setHoldings([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    supabaseWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('portfolio_holdings')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data || [];
    })
    .then((data) => {
      if (mounted) {
        setHoldings(data);
        const total = data.reduce((sum, holding) => sum + (holding.amount * (holding.avg_buy_price || 0)), 0);
        setTotalValue(total);
        setLoading(false);
      }
    })
    .catch((err) => {
      if (mounted) {
        setError(err);
        setLoading(false);
        handleError(err, { scope: 'usePortfolio', userId, action: 'fetch' });
      }
    });

    return () => { mounted = false; };
  }, [userId, handleError]);

  const refreshPortfolio = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const data = await supabaseWithRetry(async (supabase) => {
        const { data, error } = await supabase
          .from('portfolio_holdings')
          .select('*')
          .eq('user_id', userId);
        
        if (error) throw error;
        return data || [];
      });
      
      setHoldings(data);
      const total = data.reduce((sum, holding) => sum + (holding.amount * (holding.avg_buy_price || 0)), 0);
      setTotalValue(total);
    } catch (err) {
      handleError(err, { scope: 'usePortfolio', userId, action: 'refresh' });
    } finally {
      setLoading(false);
    }
  };

  return { holdings, loading, error, totalValue, refreshPortfolio };
}