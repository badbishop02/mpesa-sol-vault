import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  Keypair,
  sendAndConfirmTransaction
} from "https://esm.sh/@solana/web3.js@1.98.4";
import { decode } from "https://deno.land/std@0.168.0/encoding/base58.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FEE_WALLET = '8DvPHfxRLVA48DqySJqdiwpCUadRgECQoZ22EbyKRkQG9c';
const FEE_RATE = 0.025; // 2.5%

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

    const { recipient, amount, token_mint = 'SOL' } = await req.json();

    if (!recipient || !amount) {
      throw new Error('Recipient and amount are required');
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('solana_wallets')
      .select('wallet_address, encrypted_private_key, is_testnet')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      throw new Error('Wallet not found');
    }

    // Connect to Solana (testnet by default)
    const endpoint = wallet.is_testnet 
      ? 'https://api.devnet.solana.com' 
      : 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(endpoint, 'confirmed');

    // Decode private key
    const secretKey = decode(wallet.encrypted_private_key);
    const senderKeypair = Keypair.fromSecretKey(secretKey);

    // Calculate fee
    const transferAmount = parseFloat(amount);
    const feeAmount = transferAmount * FEE_RATE;
    const netAmount = transferAmount - feeAmount;

    if (netAmount <= 0) {
      throw new Error('Amount too small after fees');
    }

    // Create transaction
    const transaction = new Transaction();

    // Add transfer to recipient
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: new PublicKey(recipient),
        lamports: Math.floor(netAmount * LAMPORTS_PER_SOL),
      })
    );

    // Add fee to fee wallet
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: new PublicKey(FEE_WALLET),
        lamports: Math.floor(feeAmount * LAMPORTS_PER_SOL),
      })
    );

    // Simulate transaction first
    const { value: simulationResult } = await connection.simulateTransaction(transaction);
    
    if (simulationResult.err) {
      throw new Error(`Transaction simulation failed: ${JSON.stringify(simulationResult.err)}`);
    }

    // Send transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [senderKeypair],
      { commitment: 'confirmed' }
    );

    // Record execution
    await supabase
      .from('trade_executions')
      .insert({
        user_id: user.id,
        trade_type: 'send',
        token_mint: token_mint,
        amount: transferAmount,
        fee_amount: feeAmount,
        fee_wallet: FEE_WALLET,
        transaction_hash: signature,
        status: 'completed',
        source_type: 'manual'
      });

    console.log(`Transfer completed: ${signature}`);

    return new Response(
      JSON.stringify({ 
        signature,
        amount: netAmount,
        fee: feeAmount,
        recipient 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transfer error:', error);
    
    // Record failed execution
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const authHeader = req.headers.get('Authorization')!;
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await supabase
          .from('trade_executions')
          .insert({
            user_id: user.id,
            trade_type: 'send',
            token_mint: 'SOL',
            amount: 0,
            fee_amount: 0,
            status: 'failed',
            error_message: error.message,
            source_type: 'manual'
          });
      }
    } catch (e) {
      console.error('Failed to record error:', e);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});