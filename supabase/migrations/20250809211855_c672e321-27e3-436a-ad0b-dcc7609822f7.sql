-- Create table to log Mpesa payments
CREATE TABLE IF NOT EXISTS public.mpesa_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  phone TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  merchant_request_id TEXT,
  checkout_request_id TEXT,
  result_code TEXT,
  result_desc TEXT,
  mpesa_receipt_number TEXT,
  transaction_date TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mpesa_payments ENABLE ROW LEVEL SECURITY;

-- Simple public policies (demo purposes)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mpesa_payments' AND policyname = 'Public read mpesa_payments'
  ) THEN
    CREATE POLICY "Public read mpesa_payments" ON public.mpesa_payments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mpesa_payments' AND policyname = 'Public insert mpesa_payments'
  ) THEN
    CREATE POLICY "Public insert mpesa_payments" ON public.mpesa_payments FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mpesa_payments' AND policyname = 'Public update mpesa_payments'
  ) THEN
    CREATE POLICY "Public update mpesa_payments" ON public.mpesa_payments FOR UPDATE USING (true);
  END IF;
END $$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mpesa_payments_updated_at ON public.mpesa_payments;
CREATE TRIGGER update_mpesa_payments_updated_at
BEFORE UPDATE ON public.mpesa_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_checkout ON public.mpesa_payments (checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_merchant ON public.mpesa_payments (merchant_request_id);
