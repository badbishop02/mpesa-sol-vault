import { supabase } from "@/integrations/supabase/client";

export type TradeRequest = {
  symbol: string; // e.g., 'SOL'
  side: "buy" | "sell";
  amountKes: number; // KES amount
  price: number; // price per unit in KES
};

export async function executeTradeViaEdge(trade: TradeRequest) {
  const { data, error } = await supabase.functions.invoke('execute-trade', {
    body: trade
  });

  if (error) {
    throw new Error(error.message || 'Trade execution failed');
  }

  return data;
}

export async function getUserHoldings(userId: string) {
  const { data, error } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw new Error(mapSupabaseError(error));
  }

  return data || [];
}

export async function getUserWallet(userId: string) {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(mapSupabaseError(error));
  }

  return data;
}

export function mapSupabaseError(err: any): string {
  if (!err) return "An unknown error occurred";
  
  // Map common Supabase error codes to user-friendly messages
  if (err.code === 'PGRST116') return "No data found";
  if (err.code === '23505') return "Record already exists";
  if (err.code === '23503') return "Invalid reference";
  if (err.code === '42501') return "Permission denied";
  
  if (err.message) {
    // Map common error patterns
    if (err.message.includes('insufficient')) return "Insufficient funds";
    if (err.message.includes('balance')) return "Insufficient balance";
    if (err.message.includes('network')) return "Network error. Please try again";
    if (err.message.includes('timeout')) return "Request timed out. Please try again";
    
    return err.message;
  }
  
  if (typeof err === "string") return err;
  return "Operation failed. Please try again.";
}