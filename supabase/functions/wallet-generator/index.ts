import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";
import { Keypair } from "https://esm.sh/@solana/web3.js@1.98.4";
import { encode } from "https://deno.land/std@0.168.0/encoding/base58.ts";

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

    // Check if user already has a wallet
    const { data: existingWallet } = await supabase
      .from('solana_wallets')
      .select('wallet_address')
      .eq('user_id', user.id)
      .single();

    if (existingWallet) {
      return new Response(
        JSON.stringify({ error: 'Wallet already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new Solana keypair
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const privateKeyArray = keypair.secretKey;

    // Simple encryption (in production, use proper KMS)
    const encryptedPrivateKey = encode(privateKeyArray);

    // Store wallet in database
    const { error: insertError } = await supabase
      .from('solana_wallets')
      .insert({
        user_id: user.id,
        wallet_address: publicKey,
        encrypted_private_key: encryptedPrivateKey,
        is_testnet: true
      });

    if (insertError) {
      throw insertError;
    }

    // Update profile with wallet address
    await supabase
      .from('profiles')
      .update({ wallet_address: publicKey })
      .eq('id', user.id);

    // Create default user settings
    await supabase
      .from('user_settings')
      .insert({
        user_id: user.id,
        auto_execute_enabled: false,
        default_slippage: 0.01,
        risk_tolerance: 'medium'
      });

    console.log(`Generated wallet for user ${user.id}: ${publicKey}`);

    return new Response(
      JSON.stringify({ 
        wallet_address: publicKey,
        private_key: encryptedPrivateKey,
        message: 'Save your private key securely - it will only be shown once!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Wallet generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});