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

    const method = req.method;
    const url = new URL(req.url);

    if (method === 'GET') {
      // Get user's followed whales
      const { data: follows, error } = await supabase
        .from('copy_follows')
        .select(`
          *,
          whales (
            wallet_address,
            score,
            win_rate,
            realized_pnl,
            trade_count
          )
        `)
        .eq('follower_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      return new Response(
        JSON.stringify({ follows }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'POST') {
      const { whale_id, sizing_type, sizing_value, max_slippage, max_notional, stop_loss_pct, take_profit_pct, trailing_stop_pct } = await req.json();

      if (!whale_id) {
        throw new Error('whale_id is required');
      }

      // Follow a whale
      const { data, error } = await supabase
        .from('copy_follows')
        .upsert({
          follower_id: user.id,
          whale_id,
          is_active: true,
          sizing_type: sizing_type || 'percent',
          sizing_value: sizing_value || 1.0,
          max_slippage: max_slippage || 0.05,
          max_notional,
          stop_loss_pct,
          take_profit_pct,
          trailing_stop_pct
        })
        .select()
        .single();

      if (error) throw error;

      // Update follower count
      await supabase.rpc('increment_follower_count', { whale_id });

      return new Response(
        JSON.stringify({ follow: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'DELETE') {
      const whale_id = url.searchParams.get('whale_id');
      
      if (!whale_id) {
        throw new Error('whale_id is required');
      }

      // Unfollow a whale
      const { error } = await supabase
        .from('copy_follows')
        .update({ is_active: false })
        .eq('follower_id', user.id)
        .eq('whale_id', whale_id);

      if (error) throw error;

      // Decrement follower count
      await supabase.rpc('decrement_follower_count', { whale_id });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Method not allowed');

  } catch (error) {
    console.error('Copy trading error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});