import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MPESA_CONSUMER_KEY = Deno.env.get("MPESA_CONSUMER_KEY") ?? "";
const MPESA_CONSUMER_SECRET = Deno.env.get("MPESA_CONSUMER_SECRET") ?? "";
const MPESA_SHORTCODE = Deno.env.get("MPESA_SHORTCODE") ?? "400200";
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = await getAccessToken();

    const payload = {
      ShortCode: MPESA_SHORTCODE,
      ResponseType: "Completed",
      ConfirmationURL: CALLBACK_URL,
      ValidationURL: CALLBACK_URL,
    };

    const res = await fetch(`${getBaseUrl()}/mpesa/c2b/v1/registerurl`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    const status = res.ok ? 200 : 400;

    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("mpesa-c2b-register error", err);
    return new Response(JSON.stringify({ error: err.message || "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
