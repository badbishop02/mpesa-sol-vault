import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting and account lockout storage
const authAttempts = new Map<string, { 
  attempts: number; 
  lockoutUntil: number; 
  lastAttempt: number;
}>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of authAttempts.entries()) {
    if (now > data.lockoutUntil && (now - data.lastAttempt) > 300000) { // 5 minutes
      authAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

function checkAuthRateLimit(identifier: string): { allowed: boolean; lockoutUntil?: number } {
  const now = Date.now();
  const data = authAttempts.get(identifier);
  
  if (!data) {
    authAttempts.set(identifier, { attempts: 1, lockoutUntil: 0, lastAttempt: now });
    return { allowed: true };
  }
  
  // Check if still locked out
  if (data.lockoutUntil > now) {
    return { allowed: false, lockoutUntil: data.lockoutUntil };
  }
  
  // Reset if more than 15 minutes since last attempt
  if (now - data.lastAttempt > 15 * 60 * 1000) {
    data.attempts = 1;
    data.lockoutUntil = 0;
    data.lastAttempt = now;
    return { allowed: true };
  }
  
  data.attempts++;
  data.lastAttempt = now;
  
  // Lock out after 5 failed attempts for 15 minutes
  if (data.attempts >= 5) {
    data.lockoutUntil = now + (15 * 60 * 1000);
    return { allowed: false, lockoutUntil: data.lockoutUntil };
  }
  
  return { allowed: true };
}

function recordSuccessfulAuth(identifier: string) {
  authAttempts.delete(identifier);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, identifier, email, password } = await req.json();

    if (action === 'check_rate_limit') {
      const result = checkAuthRateLimit(identifier);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'authenticate') {
      const rateLimitCheck = checkAuthRateLimit(identifier);
      if (!rateLimitCheck.allowed) {
        return new Response(
          JSON.stringify({ 
            error: 'Account temporarily locked due to too many failed attempts',
            lockoutUntil: rateLimitCheck.lockoutUntil
          }),
          { status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Attempt authentication
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      recordSuccessfulAuth(identifier);
      return new Response(JSON.stringify({ success: true, user: data.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'record_success') {
      recordSuccessfulAuth(identifier);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auth rate limiter error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});