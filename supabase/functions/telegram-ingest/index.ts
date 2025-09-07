import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TradeSignal {
  type: 'buy' | 'sell';
  token_mint: string;
  amount?: number;
  confidence: number;
}

function parseTradeSignal(message: string): TradeSignal | null {
  // Simple regex patterns to detect trade signals
  const buyPatterns = [
    /(?:buy|long|enter)\s+(\w+)/i,
    /(\w+)\s+(?:buy|long|enter)/i,
    /🟢.*?(\w+)/i
  ];
  
  const sellPatterns = [
    /(?:sell|short|exit)\s+(\w+)/i,
    /(\w+)\s+(?:sell|short|exit)/i,
    /🔴.*?(\w+)/i
  ];

  // Check for buy signals
  for (const pattern of buyPatterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        type: 'buy',
        token_mint: match[1].toUpperCase(),
        confidence: 0.7
      };
    }
  }

  // Check for sell signals
  for (const pattern of sellPatterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        type: 'sell',
        token_mint: match[1].toUpperCase(),
        confidence: 0.7
      };
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { message, telegram_link, user_id } = await req.json();

    if (!message || !telegram_link) {
      throw new Error('Message and telegram_link are required');
    }

    // Parse the message for trade signals
    const signal = parseTradeSignal(message);
    
    if (!signal) {
      return new Response(
        JSON.stringify({ message: 'No trade signal detected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find users who are subscribed to this telegram source with auto-execute enabled
    const { data: subscribers, error: subsError } = await supabase
      .from('telegram_sources')
      .select(`
        user_id,
        auto_execute,
        user_settings!inner(
          auto_execute_enabled,
          default_slippage
        )
      `)
      .eq('telegram_link', telegram_link)
      .eq('is_active', true)
      .eq('auto_execute', true);

    if (subsError) {
      console.error('Error fetching subscribers:', subsError);
    }

    const executionPromises = [];

    if (subscribers && subscribers.length > 0) {
      for (const subscriber of subscribers) {
        if (subscriber.user_settings?.auto_execute_enabled) {
          // Create a trade execution record
          const executionPromise = supabase
            .from('trade_executions')
            .insert({
              user_id: subscriber.user_id,
              trade_type: signal.type,
              token_mint: signal.token_mint,
              amount: signal.amount || 100, // Default amount
              status: 'pending',
              source_type: 'telegram',
              source_id: telegram_link
            });

          executionPromises.push(executionPromise);
        }
      }
    }

    // Execute all trade insertions
    if (executionPromises.length > 0) {
      await Promise.allSettled(executionPromises);
    }

    console.log(`Processed signal: ${signal.type} ${signal.token_mint} for ${executionPromises.length} users`);

    return new Response(
      JSON.stringify({ 
        signal,
        subscribers_notified: executionPromises.length,
        message: 'Trade signal processed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Telegram ingest error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});