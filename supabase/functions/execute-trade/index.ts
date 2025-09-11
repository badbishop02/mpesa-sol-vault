import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TradeRequest {
  symbol: string;
  side: 'buy' | 'sell';
  amountKes: number;
  price: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: TradeRequest = await req.json();
    const { symbol, side, amountKes, price } = body;

    // Validate request
    if (!symbol || !side || !amountKes || !price) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (amountKes <= 0 || price <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amounts' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate crypto amount
    const cryptoAmount = amountKes / price;
    const feePercent = 0.025; // 2.5% fee
    const feeAmount = amountKes * feePercent;
    const netAmount = amountKes - feeAmount;

    // Start transaction
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletError) {
      return new Response(
        JSON.stringify({ error: 'Wallet not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (side === 'buy') {
      // Check sufficient balance for buy
      if (wallet.balance_kes < amountKes) {
        return new Response(
          JSON.stringify({ error: 'Insufficient KES balance' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Execute buy transaction atomically
      const { error: updateError } = await supabase.rpc('execute_crypto_buy', {
        p_user_id: user.id,
        p_wallet_id: wallet.id,
        p_symbol: symbol,
        p_amount_kes: amountKes,
        p_crypto_amount: cryptoAmount,
        p_fee_amount: feeAmount,
        p_price: price
      });

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Transaction failed: ' + updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Handle sell - check holdings first
      const { data: holding, error: holdingError } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', symbol)
        .single();

      if (holdingError || !holding || holding.amount < cryptoAmount) {
        return new Response(
          JSON.stringify({ error: 'Insufficient crypto holdings' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Execute sell transaction atomically
      const { error: sellError } = await supabase.rpc('execute_crypto_sell', {
        p_user_id: user.id,
        p_wallet_id: wallet.id,
        p_symbol: symbol,
        p_amount_kes: netAmount, // Net amount after fees
        p_crypto_amount: cryptoAmount,
        p_fee_amount: feeAmount,
        p_price: price
      });

      if (sellError) {
        return new Response(
          JSON.stringify({ error: 'Sell transaction failed: ' + sellError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        side,
        symbol,
        amountKes,
        cryptoAmount,
        feeAmount,
        netAmount: side === 'buy' ? cryptoAmount : netAmount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Trade execution error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});