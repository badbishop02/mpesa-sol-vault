-- Secure RLS and realtime setup

-- Ensure replica identity for full row data in realtime
ALTER TABLE public.wallets REPLICA IDENTITY FULL;
ALTER TABLE public.holdings REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.mpesa_payments REPLICA IDENTITY FULL;

-- Drop overly permissive policies
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

-- Create strict per-user policies
-- wallets
CREATE POLICY "Users can read their wallets"
ON public.wallets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their wallets"
ON public.wallets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their wallets"
ON public.wallets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- holdings
CREATE POLICY "Users can read their holdings"
ON public.holdings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their holdings"
ON public.holdings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their holdings"
ON public.holdings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- transactions
CREATE POLICY "Users can read their transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- mpesa_payments (webhook uses service role; users can see their own rows)
CREATE POLICY "Users can read their mpesa_payments"
ON public.mpesa_payments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their mpesa_payments"
ON public.mpesa_payments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their mpesa_payments"
ON public.mpesa_payments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON public.holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_created_at ON public.transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_checkout ON public.mpesa_payments(checkout_request_id);

-- Ensure updated_at triggers exist where applicable
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_wallets_updated_at'
  ) THEN
    CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_holdings_updated_at'
  ) THEN
    CREATE TRIGGER update_holdings_updated_at
    BEFORE UPDATE ON public.holdings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_mpesa_payments_updated_at'
  ) THEN
    CREATE TRIGGER update_mpesa_payments_updated_at
    BEFORE UPDATE ON public.mpesa_payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
