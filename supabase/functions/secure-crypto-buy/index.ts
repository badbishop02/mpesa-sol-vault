import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://ccgowkctshnacrrgaloj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const MPESA_CONSUMER_KEY = Deno.env.get("MPESA_CONSUMER_KEY") ?? "";
const MPESA_CONSUMER_SECRET = Deno.env.get("MPESA_CONSUMER_SECRET") ?? "";
const MPESA_PASSKEY = Deno.env.get("MPESA_PASSKEY") ?? "";
const MPESA_SHORTCODE = "400200"; // Paybill
const MPESA_ACCOUNT = "20758"; // Account number
const FEE_WALLET = "8DvPHfxRLVA48DqySJqdiwpCUadRgECQoZ22EbyKRkQG9c";

function getBaseUrl() {
  return "https://api.safaricom.co.ke"; // Production
}

async function getAccessToken() {
  const url = `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;
  const basic = btoa(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`);
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to get access token: ${res.status}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

function getTimestamp() {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${y}${m}${day}${h}${min}${s}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, phone, cryptoType, expectedCryptoAmount } = await req.json();
    
    if (!amount || !phone || !cryptoType || !expectedCryptoAmount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAnon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userRes, error: userErr } = await supabaseAnon.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userId = userRes.user.id;

    // Check user account status
    const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profile, error: profileErr } = await supabaseService
      .from("profiles")
      .select("account_status, kyc_status")
      .eq("id", userId)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (profile.account_status !== "active") {
      return new Response(JSON.stringify({ error: "Account suspended or frozen" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Calculate fees (2.5%)
    const feeAmount = amount * 0.025;
    const netAmount = amount - feeAmount;

    // Create trade record
    const { data: trade, error: tradeErr } = await supabaseService
      .from("crypto_trades")
      .insert({
        user_id: userId,
        type: "buy",
        from_currency: "KES",
        to_currency: cryptoType,
        amount_from: amount,
        amount_to: expectedCryptoAmount,
        fee_amount: feeAmount,
        status: "pending"
      })
      .select()
      .single();

    if (tradeErr) {
      return new Response(JSON.stringify({ error: "Failed to create trade record" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Initiate M-Pesa STK Push
    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = btoa(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`);

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: "https://ccgowkctshnacrrgaloj.functions.supabase.co/mpesa-crypto-callback",
      AccountReference: MPESA_ACCOUNT,
      TransactionDesc: `Buy ${cryptoType} - ${amount} KES`,
    };

    const stkRes = await fetch(`${getBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const stkData = await stkRes.json();
    if (!stkRes.ok || stkData.errorCode) {
      // Update trade status to failed
      await supabaseService
        .from("crypto_trades")
        .update({ status: "failed" })
        .eq("id", trade.id);

      return new Response(JSON.stringify({ error: stkData.errorMessage || "STK push failed" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Update trade with M-Pesa details
    await supabaseService
      .from("crypto_trades")
      .update({
        status: "processing",
        mpesa_receipt: stkData.CheckoutRequestID
      })
      .eq("id", trade.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "STK push sent. Please check your phone and enter your M-Pesa PIN to complete the purchase.",
        tradeId: trade.id,
        checkoutRequestID: stkData.CheckoutRequestID,
        details: {
          cryptoType,
          amount: netAmount,
          fee: feeAmount,
          expectedCrypto: expectedCryptoAmount
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("secure-crypto-buy error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});