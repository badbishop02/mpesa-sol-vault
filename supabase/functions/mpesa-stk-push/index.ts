import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://ccgowkctshnacrrgaloj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjZ293a2N0c2huYWNycmdhbG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODU5NzYsImV4cCI6MjA3MDE2MTk3Nn0.CjreHLYSQZAS0ieaMz82EDYUyK0hBHhmD8YxKie0eUs";

const MPESA_CONSUMER_KEY = Deno.env.get("MPESA_CONSUMER_KEY") ?? "";
const MPESA_CONSUMER_SECRET = Deno.env.get("MPESA_CONSUMER_SECRET") ?? "";
const MPESA_PASSKEY = Deno.env.get("MPESA_PASSKEY") ?? "";
const MPESA_SHORTCODE = Deno.env.get("MPESA_SHORTCODE") ?? "400200"; // Paybill
const MPESA_ACCOUNT = Deno.env.get("MPESA_ACCOUNT") ?? "20758"; // Account number
const MPESA_ENV = (Deno.env.get("MPESA_ENV") ?? "production").toLowerCase();

const CALLBACK_URL = "https://ccgowkctshnacrrgaloj.functions.supabase.co/mpesa-c2b-confirmation";

function getBaseUrl() {
  return MPESA_ENV === "sandbox"
    ? "https://sandbox.safaricom.co.ke"
    : "https://api.safaricom.co.ke";
}

async function getAccessToken() {
  const url = `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;
  const basic = btoa(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`);
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to get access token: ${res.status} ${await res.text()}`);
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
    const { amount, phone, user_id } = await req.json();
    if (!amount || !phone || !user_id) {
      return new Response(JSON.stringify({ error: "amount, phone and user_id are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

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
      CallBackURL: CALLBACK_URL,
      AccountReference: MPESA_ACCOUNT,
      TransactionDesc: `Wallet deposit ${amount} KES`,
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
      return new Response(JSON.stringify({ error: stkData.errorMessage || "STK push failed" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Log pending payment
    await supabase.from("mpesa_payments").insert([
      {
        user_id,
        phone,
        amount,
        status: "pending",
        merchant_request_id: stkData.MerchantRequestID ?? null,
        checkout_request_id: stkData.CheckoutRequestID ?? null,
        raw: stkData,
      },
    ]);

    return new Response(
      JSON.stringify({
        message: "STK push sent. Check your phone to authorize the payment.",
        checkoutRequestID: stkData.CheckoutRequestID,
        merchantRequestID: stkData.MerchantRequestID,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("mpesa-stk-push error", err);
    return new Response(JSON.stringify({ error: err.message || "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
