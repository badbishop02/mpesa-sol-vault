import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { retry } from "./retry";

const SUPABASE_URL = "https://ccgowkctshnacrrgaloj.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjZ293a2N0c2huYWNycmdhbG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODU5NzYsImV4cCI6MjA3MDE2MTk3Nn0.CjreHLYSQZAS0ieaMz82EDYUyK0hBHhmD8YxKie0eUs";

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
  global: { headers: { "x-client-name": "crypto-vault" } }
});

export async function supabaseWithRetry<T>(op: (c: SupabaseClient) => Promise<T>, attempts = 3) {
  return retry(() => op(supabaseClient), attempts, 300);
}