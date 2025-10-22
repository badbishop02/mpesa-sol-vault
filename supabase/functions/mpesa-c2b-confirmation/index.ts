import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://ccgowkctshnacrrgaloj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const payload = await req.json();
    console.log("M-Pesa callback payload:", JSON.stringify(payload));

    const stk = payload?.Body?.stkCallback;
    if (!stk) {
      return new Response(JSON.stringify({ message: "No stkCallback in payload" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resultCode = String(stk.ResultCode);
    const resultDesc = String(stk.ResultDesc ?? "");
    const merchantRequestId = String(stk.MerchantRequestID ?? "");
    const checkoutRequestId = String(stk.CheckoutRequestID ?? "");

    const items: Array<{ Name: string; Value: any }> = stk.CallbackMetadata?.Item ?? [];
    const getVal = (name: string) => items.find((i) => i.Name === name)?.Value;

    const amount = Number(getVal("Amount") ?? 0);
    const mpesaReceiptNumber = String(getVal("MpesaReceiptNumber") ?? "");
    const phone = String(getVal("PhoneNumber") ?? "");
    const transactionDate = String(getVal("TransactionDate") ?? "");

    // Find the pending payment to link the user
    const { data: payRow } = await supabase
      .from("mpesa_payments")
      .select("id, user_id")
      .eq("checkout_request_id", checkoutRequestId)
      .maybeSingle();

    // Update payment log
    await supabase
      .from("mpesa_payments")
      .update({
        status: resultCode === "0" ? "success" : "failed",
        result_code: resultCode,
        result_desc: resultDesc,
        mpesa_receipt_number: mpesaReceiptNumber,
        transaction_date: transactionDate,
        phone,
        amount,
        raw: payload,
      })
      .eq("checkout_request_id", checkoutRequestId);

    if (resultCode === "0" && payRow?.user_id) {
      const userId = payRow.user_id as string;

      // Insert transaction
      await supabase.from("transactions").insert([
        {
          user_id: userId,
          type: "deposit",
          amount_kes: amount,
          status: "completed",
        },
      ]);

      // Upsert wallet balance
      const { data: existing } = await supabase
        .from("wallets")
        .select("id, balance_kes")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existing) {
        await supabase.from("wallets").insert([
          { user_id: userId, balance_kes: amount },
        ]);
      } else {
        const newBal = (Number(existing.balance_kes) || 0) + amount;
        await supabase
          .from("wallets")
          .update({ balance_kes: newBal })
          .eq("id", existing.id);
      }
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("mpesa-c2b-confirmation error", err);
    return new Response(JSON.stringify({ error: "Unable to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
