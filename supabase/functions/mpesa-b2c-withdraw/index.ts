import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://ccgowkctshnacrrgaloj.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const MPESA_ENV = (Deno.env.get("MPESA_ENV") ?? "production").toLowerCase();
const MPESA_B2C_SHORTCODE = Deno.env.get("MPESA_B2C_SHORTCODE") ?? Deno.env.get("MPESA_SHORTCODE") ?? "";
const MPESA_INITIATOR_NAME = Deno.env.get("MPESA_INITIATOR_NAME") ?? "";
const MPESA_SECURITY_CREDENTIAL = Deno.env.get("MPESA_SECURITY_CREDENTIAL") ?? "";

function getBaseUrl() {
  return MPESA_ENV === "sandbox"
    ? "https://sandbox.safaricom.co.ke"
    : "https://api.safaricom.co.ke";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });

    const { amount } = await req.json();
    if (!amount || amount <= 0) return new Response(JSON.stringify({ error: "Invalid amount" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });

    // Get phone from profile
    const { data: profile } = await supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle();
    const phone = profile?.phone;
    if (!phone) return new Response(JSON.stringify({ error: "No phone on profile" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });

    if (!MPESA_INITIATOR_NAME || !MPESA_SECURITY_CREDENTIAL || !MPESA_B2C_SHORTCODE) {
      return new Response(JSON.stringify({ error: "M-Pesa B2C not configured" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Deduct from wallet first (optimistic)
    const { data: wallet } = await supabase.from("wallets").select("id, balance_kes").eq("user_id", user.id).maybeSingle();
    const bal = Number(wallet?.balance_kes || 0);
    if (bal < amount) return new Response(JSON.stringify({ error: "Insufficient balance" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    await supabase.from("wallets").update({ balance_kes: bal - amount }).eq("id", wallet!.id);

    // Record transaction
    await supabase.from("transactions").insert([{ user_id: user.id, type: "withdrawal", amount_kes: amount, status: "pending" }]);

    // Call B2C API
    const res = await fetch(`${getBaseUrl()}/mpesa/b2c/v1/paymentrequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        InitiatorName: MPESA_INITIATOR_NAME,
        SecurityCredential: MPESA_SECURITY_CREDENTIAL,
        CommandID: "BusinessPayment",
        Amount: amount,
        PartyA: MPESA_B2C_SHORTCODE,
        PartyB: phone,
        Remarks: "Wallet withdrawal",
        QueueTimeOutURL: "https://example.com/timeout",
        ResultURL: "https://example.com/result",
        Occasion: "WalletOS",
      }),
    });

    const data = await res.json();
    if (!res.ok || data.errorCode) {
      // revert deduction
      await supabase.from("wallets").update({ balance_kes: bal }).eq("id", wallet!.id);
      return new Response(JSON.stringify({ error: data.errorMessage || "B2C failed" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    await supabase.from("transactions").update({ status: "completed" }).eq("user_id", user.id).eq("type", "withdrawal").order("created_at", { ascending: false }).limit(1);

    return new Response(JSON.stringify({ ok: true, data }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (e: any) {
    console.error("mpesa-b2c-withdraw error", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
