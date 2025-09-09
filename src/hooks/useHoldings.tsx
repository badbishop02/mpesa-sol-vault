import { useEffect, useState } from "react";
import { supabaseWithRetry } from "../lib/supabaseClient";
import { useErrorHandler } from "./useErrorHandler";
import type { IHoldings } from "../types/index";

export function useHoldings(userId?: string) {
  const [items, setItems] = useState<IHoldings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const handleError = useErrorHandler();

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    supabaseWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data || [];
    })
    .then((data) => {
      if (mounted) {
        setItems(data);
        setLoading(false);
      }
    })
    .catch((err) => {
      if (mounted) {
        setError(err);
        setLoading(false);
        handleError(err, { scope: 'useHoldings', userId, action: 'fetch' });
      }
    });

    return () => { mounted = false; };
  }, [userId, handleError]);

  return { items, loading, error };
}