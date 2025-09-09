import { supabaseWithRetry } from "../lib/supabaseClient";
import type { IExecution, ICopyFollow } from "../types/index";
import { v4 as uuidv4 } from 'uuid';

const FEE_PCT = 0.025; // 2.5% fee
const FEE_WALLET = '8DvPHfxRLVA48DqySJqdiwpCUadRgECQoZ22EbyKRkQG9c';

export async function simulateCopyTrade(
  leaderExecution: IExecution, 
  followerBalanceUSD: number,
  copySettings: ICopyFollow
) {
  // Calculate position size based on copy settings
  let notional = 0;
  
  if (copySettings.sizing_type === 'percent') {
    notional = followerBalanceUSD * (copySettings.sizing_value / 100);
  } else {
    notional = copySettings.sizing_value; // fixed amount
  }

  // Apply max notional limit if set
  if (copySettings.max_notional && notional > copySettings.max_notional) {
    notional = copySettings.max_notional;
  }

  // Calculate fee
  const fee = notional * FEE_PCT;
  const executeNotional = notional - fee;

  // Validate minimum execution amount
  if (executeNotional < 1) {
    throw new Error('Execution amount too small after fees');
  }

  return { 
    notional, 
    fee, 
    executeNotional,
    slippage: copySettings.max_slippage,
    stopLoss: copySettings.stop_loss_pct,
    takeProfit: copySettings.take_profit_pct
  };
}

export async function executeCopyTrade(
  followerUserId: string, 
  leaderExecution: IExecution,
  copySettings: ICopyFollow
) {
  // Get follower balance
  const followerBalanceUSD = await getUserBalanceUSD(followerUserId);
  
  // Run simulation
  const sim = await simulateCopyTrade(leaderExecution, followerBalanceUSD, copySettings);
  
  // Create execution record
  const executionId = uuidv4();
  
  const execution = await supabaseWithRetry(async (supabase) => {
    const { data, error } = await supabase
      .from('trade_executions')
      .insert({
        id: executionId,
        user_id: followerUserId,
        token_mint: leaderExecution.token_mint,
        trade_type: leaderExecution.trade_type,
        amount: sim.executeNotional,
        fee_amount: sim.fee,
        fee_wallet: FEE_WALLET,
        status: 'pending',
        source_type: 'copy',
        source_id: copySettings.whale_id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  });

  // Trigger execution via edge function
  await supabaseWithRetry(async (supabase) => {
    const { error } = await supabase.functions.invoke('solana-transfer', {
      body: {
        execution_id: executionId,
        user_id: followerUserId,
        token_mint: leaderExecution.token_mint,
        trade_type: leaderExecution.trade_type,
        amount: sim.executeNotional,
        max_slippage: sim.slippage
      }
    });
    
    if (error) throw error;
  });

  return { executionId, sim, execution };
}

async function getUserBalanceUSD(userId: string): Promise<number> {
  const data = await supabaseWithRetry(async (supabase) => {
    const { data, error } = await supabase
      .from('wallets')
      .select('balance_kes')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  });

  // Convert KES to USD (approximate rate)
  const kesToUsd = 0.0077; // 1 KES ≈ $0.0077 USD
  return (data?.balance_kes || 0) * kesToUsd;
}

export async function checkCopySettings(followerId: string, whaleId: string): Promise<ICopyFollow | null> {
  const { data } = await supabaseWithRetry(async (supabase) => {
    const { data, error } = await supabase
      .from('copy_follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('whale_id', whaleId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  });

  return data;
}