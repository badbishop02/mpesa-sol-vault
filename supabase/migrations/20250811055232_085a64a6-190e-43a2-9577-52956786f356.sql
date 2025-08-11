-- Secure RLS, profiles, and realtime setup

-- Ensure replica identity for full row data in realtime
ALTER TABLE public.wallets REPLICA IDENTITY FULL;
ALTER TABLE public.holdings REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.mpesa_payments REPLICA IDENTITY FULL;

-- Drop overly permissive policies if they exist
DROP POLICY IF EXISTS "Public read wallets" ON public.wallets;
DROP POLICY IF EXISTS "Public update wallets" ON public.wallets;
DROP POLICY IF EXISTS "Public upsert wallets" ON public.wallets;

DROP POLICY IF EXISTS "Public read holdings" ON public.holdings;
DROP POLICY IF EXISTS "Public update holdings" ON public.holdings;
DROP POLICY IF EXISTS "Public upsert holdings" ON public.holdings;

DROP POLICY IF EXISTS "Public read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Public insert transactions" ON public.transactions;

DROP POLICY IF EXISTS "Public read mpesa_payments" ON public.mpesa_payments;
DROP POLICY IF EXISTS "Public insert mpesa_payments" ON public.mpesa_payments;
DROP POLICY IF EXISTS "Public update mpesa_payments" ON public.mpesa_payments;

-- Re-create strict per-user policies (idempotent)
-- wallets
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wallets' AND policyname='Users can read their wallets'
  ) THEN
    CREATE POLICY "Users can read their wallets"
    ON public.wallets
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wallets' AND policyname='Users can insert their wallets'
  ) THEN
    CREATE POLICY "Users can insert their wallets"
    ON public.wallets
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wallets' AND policyname='Users can update their wallets'
  ) THEN
    CREATE POLICY "Users can update their wallets"
    ON public.wallets
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- holdings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='holdings' AND policyname='Users can read their holdings'
  ) THEN
    CREATE POLICY "Users can read their holdings"
    ON public.holdings
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='holdings' AND policyname='Users can insert their holdings'
  ) THEN
    CREATE POLICY "Users can insert their holdings"
    ON public.holdings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='holdings' AND policyname='Users can update their holdings'
  ) THEN
    CREATE POLICY "Users can update their holdings"
    ON public.holdings
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- transactions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transactions' AND policyname='Users can read their transactions'
  ) THEN
    CREATE POLICY "Users can read their transactions"
    ON public.transactions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transactions' AND policyname='Users can insert their transactions'
  ) THEN
    CREATE POLICY "Users can insert their transactions"
    ON public.transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- mpesa_payments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mpesa_payments' AND policyname='Users can read their mpesa_payments'
  ) THEN
    CREATE POLICY "Users can read their mpesa_payments"
    ON public.mpesa_payments
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mpesa_payments' AND policyname='Users can insert their mpesa_payments'
  ) THEN
    CREATE POLICY "Users can insert their mpesa_payments"
    ON public.mpesa_payments
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mpesa_payments' AND policyname='Users can update their mpesa_payments'
  ) THEN
    CREATE POLICY "Users can update their mpesa_payments"
    ON public.mpesa_payments
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON public.holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_created_at ON public.transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_checkout ON public.mpesa_payments(checkout_request_id);

-- Ensure timestamp update triggers exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_wallets_updated_at') THEN
    CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_holdings_updated_at') THEN
    CREATE TRIGGER update_holdings_updated_at
    BEFORE UPDATE ON public.holdings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_mpesa_payments_updated_at') THEN
    CREATE TRIGGER update_mpesa_payments_updated_at
    BEFORE UPDATE ON public.mpesa_payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Profiles table for user info
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS: users manage only their own profile
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);
  END IF;
END $$;

-- Trigger to auto-update updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create signup trigger to auto-create profile rows
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END $$;