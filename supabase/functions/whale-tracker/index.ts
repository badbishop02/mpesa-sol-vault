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

    const url = new URL(req.url);
    const window = url.searchParams.get('window') || '7d';
    const minTrades = parseInt(url.searchParams.get('minTrades') || '10');
    const mockMode = url.searchParams.get('mock') === 'true';

    if (mockMode) {
      // Mock data for quick development
      const mockWhales = [
        {
          id: '1',
          wallet_address: 'DemoWh4l3Addr3ss1111111111111111111111111',
          score: 95.5,
          win_rate: 0.78,
          avg_hold_time: 48.5,
          realized_pnl: 125000,
          trade_count: 45,
          follower_count: 0
        },
        {
          id: '2', 
          wallet_address: 'DemoWh4l3Addr3ss2222222222222222222222222',
          score: 87.2,
          win_rate: 0.65,
          avg_hold_time: 72.1,
          realized_pnl: 89000,
          trade_count: 38,
          follower_count: 0
        },
        {
          id: '3',
          wallet_address: 'DemoWh4l3Addr3ss3333333333333333333333333', 
          score: 82.1,
          win_rate: 0.71,
          avg_hold_time: 36.8,
          realized_pnl: 67500,
          trade_count: 52,
          follower_count: 0
        }
      ];

      return new Response(
        JSON.stringify({ whales: mockWhales, mock: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Real implementation - get top whales from database
    const { data: whales, error } = await supabase
      .from('whales')
      .select('*')
      .gte('trade_count', minTrades)
      .order('score', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    // If no real data, create some sample whales
    if (!whales || whales.length === 0) {
      const sampleWhales = [
        {
          wallet_address: 'SampleWh4l3Addr3ss1111111111111111111111111',
          score: 88.5,
          win_rate: 0.72,
          avg_hold_time: 42.3,
          realized_pnl: 95000,
          trade_count: 35,
          follower_count: 0
        },
        {
          wallet_address: 'SampleWh4l3Addr3ss2222222222222222222222222',
          score: 76.8,
          win_rate: 0.61,
          avg_hold_time: 58.7,
          realized_pnl: 72000,
          trade_count: 28,
          follower_count: 0
        }
      ];

      // Insert sample data
      const { data: insertedWhales } = await supabase
        .from('whales')
        .insert(sampleWhales)
        .select();

      return new Response(
        JSON.stringify({ whales: insertedWhales || sampleWhales }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ whales }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Whale tracker error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});