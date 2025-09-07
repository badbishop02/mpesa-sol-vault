import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get portfolio holdings
    const { data: holdings, error: holdingsError } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('user_id', user.id);

    if (holdingsError) throw holdingsError;

    // Get recent trade executions
    const { data: executions, error: executionsError } = await supabase
      .from('trade_executions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (executionsError) throw executionsError;

    // Calculate portfolio metrics
    const totalInvested = holdings?.reduce((sum, holding) => sum + Number(holding.total_invested), 0) || 0;
    const totalUnrealizedPnl = holdings?.reduce((sum, holding) => sum + Number(holding.unrealized_pnl), 0) || 0;
    const totalValue = totalInvested + totalUnrealizedPnl;

    // Get allocations
    const allocations = holdings?.map(holding => ({
      token_mint: holding.token_mint,
      amount: Number(holding.amount),
      value: Number(holding.total_invested) + Number(holding.unrealized_pnl),
      percentage: totalValue > 0 ? ((Number(holding.total_invested) + Number(holding.unrealized_pnl)) / totalValue) * 100 : 0
    })) || [];

    // Calculate performance metrics
    const completedTrades = executions?.filter(ex => ex.status === 'completed').length || 0;
    const failedTrades = executions?.filter(ex => ex.status === 'failed').length || 0;
    const successRate = completedTrades > 0 ? (completedTrades / (completedTrades + failedTrades)) * 100 : 0;

    const portfolio = {
      total_value: totalValue,
      total_invested: totalInvested,
      unrealized_pnl: totalUnrealizedPnl,
      pnl_percentage: totalInvested > 0 ? (totalUnrealizedPnl / totalInvested) * 100 : 0,
      holdings: holdings || [],
      allocations,
      recent_executions: executions || [],
      metrics: {
        total_trades: completedTrades + failedTrades,
        completed_trades: completedTrades,
        failed_trades: failedTrades,
        success_rate: successRate
      }
    };

    return new Response(
      JSON.stringify({ portfolio }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Portfolio tracker error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});