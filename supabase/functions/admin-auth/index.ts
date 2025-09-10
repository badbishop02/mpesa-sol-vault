import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://ccgowkctshnacrrgaloj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ADMIN_SECRET_KEY = Deno.env.get("ADMIN_SECRET_KEY") ?? "default_admin_secret_2024";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + ADMIN_SECRET_KEY);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, password, role } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === "login") {
      const passwordHash = await hashPassword(password);
      
      const { data: admin, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", email)
        .eq("password_hash", passwordHash)
        .eq("is_active", true)
        .single();

      if (error || !admin) {
        return new Response(JSON.stringify({ error: "Invalid credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Generate JWT token for admin session
      const token = btoa(JSON.stringify({
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }));

      return new Response(JSON.stringify({
        success: true,
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action === "create") {
      // Only allow creating admin users with proper authorization
      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.includes("Admin")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const passwordHash = await hashPassword(password);
      
      const { data: newAdmin, error } = await supabase
        .from("admin_users")
        .insert({
          email,
          password_hash: passwordHash,
          role: role || "staff"
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: "Failed to create admin user" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        admin: {
          id: newAdmin.id,
          email: newAdmin.email,
          role: newAdmin.role
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("admin-auth error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});