import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://ccgowkctshnacrrgaloj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FEE_WALLET = "8DvPHfxRLVA48DqySJqdiwpCUadRgECQoZ22EbyKRkQG9c";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const callbackData = await req.json();
    console.log("M-Pesa callback received:", JSON.stringify(callbackData, null, 2));

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { Body } = callbackData;
    const { stkCallback } = Body;
    const { ResultCode, ResultDesc, CheckoutRequestID } = stkCallback;

    // Find the corresponding trade
    const { data: trade, error: tradeErr } = await supabase
      .from("crypto_trades")
      .select("*")
      .eq("mpesa_receipt", CheckoutRequestID)
      .eq("status", "processing")
      .single();

    if (tradeErr || !trade) {
      console.log("Trade not found for CheckoutRequestID:", CheckoutRequestID);
      return new Response(JSON.stringify({ error: "Trade not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (ResultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
      const mpesaReceiptNumber = callbackMetadata.find((item: any) => item.Name === "MpesaReceiptNumber")?.Value;
      const transactionDate = callbackMetadata.find((item: any) => item.Name === "TransactionDate")?.Value;
      const phoneNumber = callbackMetadata.find((item: any) => item.Name === "PhoneNumber")?.Value;

      // Update trade status to completed
      const { error: updateErr } = await supabase
        .from("crypto_trades")
        .update({
          status: "completed",
          mpesa_receipt: mpesaReceiptNumber,
          updated_at: new Date().toISOString()
        })
        .eq("id", trade.id);

      if (updateErr) {
        console.error("Failed to update trade:", updateErr);
      }

      // Update user wallet balance or holdings
      const { error: walletErr } = await supabase.rpc("update_user_crypto_balance", {
        p_user_id: trade.user_id,
        p_crypto_type: trade.to_currency,
        p_amount: trade.amount_to,
        p_fee_amount: trade.fee_amount,
        p_fee_wallet: FEE_WALLET
      });

      if (walletErr) {
        console.error("Failed to update wallet:", walletErr);
      }

      // Send notification to user
      await supabase
        .from("user_notifications")
        .insert({
          user_id: trade.user_id,
          title: "Crypto Purchase Successful",
          message: `Your purchase of ${trade.amount_to} ${trade.to_currency} has been completed. Receipt: ${mpesaReceiptNumber}`,
          type: "info"
        });

      console.log(`Trade ${trade.id} completed successfully`);
    } else {
      // Payment failed
      const { error: updateErr } = await supabase
        .from("crypto_trades")
        .update({
          status: "failed",
          updated_at: new Date().toISOString()
        })
        .eq("id", trade.id);

      if (updateErr) {
        console.error("Failed to update failed trade:", updateErr);
      }

      // Send notification to user
      await supabase
        .from("user_notifications")
        .insert({
          user_id: trade.user_id,
          title: "Crypto Purchase Failed",
          message: `Your crypto purchase failed. Reason: ${ResultDesc}`,
          type: "error"
        });

      console.log(`Trade ${trade.id} failed: ${ResultDesc}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("mpesa-crypto-callback error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});