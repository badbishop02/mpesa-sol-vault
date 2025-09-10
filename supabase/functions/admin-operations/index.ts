import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://ccgowkctshnacrrgaloj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function verifyAdminToken(authHeader: string | null): any {
  if (!authHeader || !authHeader.startsWith("Bearer Admin ")) {
    return null;
  }
  
  try {
    const token = authHeader.replace("Bearer Admin ", "");
    const decoded = JSON.parse(atob(token));
    
    if (decoded.exp < Date.now()) {
      return null; // Token expired
    }
    
    return decoded;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const admin = verifyAdminToken(authHeader);
    
    if (!admin) {
      return new Response(JSON.stringify({ error: "Unauthorized admin access" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { action, userId, status, reason, notificationData } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    switch (action) {
      case "suspend_user":
        const { error: suspendErr } = await supabase
          .from("profiles")
          .update({ account_status: "suspended" })
          .eq("id", userId);

        if (suspendErr) {
          return new Response(JSON.stringify({ error: "Failed to suspend user" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        // Send notification
        await supabase
          .from("user_notifications")
          .insert({
            user_id: userId,
            title: "Account Suspended",
            message: `Your account has been suspended. Reason: ${reason || "Terms violation"}`,
            type: "warning",
            sent_by: admin.adminId
          });

        return new Response(JSON.stringify({ success: true, message: "User suspended" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });

      case "freeze_user":
        const { error: freezeErr } = await supabase
          .from("profiles")
          .update({ account_status: "frozen" })
          .eq("id", userId);

        if (freezeErr) {
          return new Response(JSON.stringify({ error: "Failed to freeze user" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        await supabase
          .from("user_notifications")
          .insert({
            user_id: userId,
            title: "Account Frozen",
            message: `Your account has been frozen for security reasons. Contact support for assistance.`,
            type: "error",
            sent_by: admin.adminId
          });

        return new Response(JSON.stringify({ success: true, message: "User frozen" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });

      case "reactivate_user":
        const { error: reactivateErr } = await supabase
          .from("profiles")
          .update({ account_status: "active" })
          .eq("id", userId);

        if (reactivateErr) {
          return new Response(JSON.stringify({ error: "Failed to reactivate user" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        await supabase
          .from("user_notifications")
          .insert({
            user_id: userId,
            title: "Account Reactivated",
            message: "Your account has been reactivated. Welcome back!",
            type: "info",
            sent_by: admin.adminId
          });

        return new Response(JSON.stringify({ success: true, message: "User reactivated" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });

      case "send_kyc_notification":
        await supabase
          .from("user_notifications")
          .insert({
            user_id: userId,
            title: "KYC Verification Required",
            message: "Please complete your KYC verification to continue using our services. Upload your ID document in the profile section.",
            type: "kyc",
            sent_by: admin.adminId
          });

        return new Response(JSON.stringify({ success: true, message: "KYC notification sent" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });

      case "approve_kyc":
        const { error: kycErr } = await supabase
          .from("profiles")
          .update({ kyc_status: "approved" })
          .eq("id", userId);

        if (kycErr) {
          return new Response(JSON.stringify({ error: "Failed to approve KYC" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        await supabase
          .from("user_notifications")
          .insert({
            user_id: userId,
            title: "KYC Approved",
            message: "Your KYC verification has been approved. You now have full access to all features.",
            type: "info",
            sent_by: admin.adminId
          });

        return new Response(JSON.stringify({ success: true, message: "KYC approved" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });

      case "process_pending_trades":
        // Get all pending trades
        const { data: pendingTrades, error: tradesErr } = await supabase
          .from("crypto_trades")
          .select("*")
          .eq("status", "pending")
          .limit(50);

        if (tradesErr) {
          return new Response(JSON.stringify({ error: "Failed to fetch pending trades" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        const processedTrades = [];
        for (const trade of pendingTrades || []) {
          // Simulate processing logic
          const processed = await supabase
            .from("crypto_trades")
            .update({ 
              status: "completed",
              updated_at: new Date().toISOString()
            })
            .eq("id", trade.id);

          if (!processed.error) {
            processedTrades.push(trade.id);
          }
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: `Processed ${processedTrades.length} trades`,
          processedTrades
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });

      case "get_user_stats":
        const { data: stats, error: statsErr } = await supabase
          .from("profiles")
          .select("account_status, kyc_status")
          .eq("id", userId)
          .single();

        if (statsErr) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        // Get trade history
        const { data: trades } = await supabase
          .from("crypto_trades")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10);

        return new Response(JSON.stringify({
          success: true,
          user: stats,
          recentTrades: trades || []
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }
  } catch (err: any) {
    console.error("admin-operations error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});