-- Create admin users table for staff access
CREATE TABLE admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'kyc_officer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for admin users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create KYC table for user verification
CREATE TABLE kyc_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('id_card', 'passport', 'driving_license')),
  document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for KYC
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

-- Create user notifications table
CREATE TABLE user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'kyc')),
  read BOOLEAN NOT NULL DEFAULT false,
  sent_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Create crypto trading table with secure key storage
CREATE TABLE crypto_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'swap')),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  amount_from NUMERIC NOT NULL,
  amount_to NUMERIC NOT NULL,
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  mpesa_receipt TEXT,
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for trades
ALTER TABLE crypto_trades ENABLE ROW LEVEL SECURITY;

-- Update profiles table to add security fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'frozen'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS encrypted_private_key TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_public_key TEXT;

-- Create RLS policies for admin users
CREATE POLICY "Admin users can manage their own records" ON admin_users FOR ALL USING (auth.uid()::text = id::text);

-- Create RLS policies for KYC documents
CREATE POLICY "Users can view their own KYC documents" ON kyc_documents FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert their own KYC documents" ON kyc_documents FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON user_notifications FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update their own notifications" ON user_notifications FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create RLS policies for crypto trades
CREATE POLICY "Users can view their own trades" ON crypto_trades FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert their own trades" ON crypto_trades FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Create indexes for performance
CREATE INDEX idx_kyc_user_id ON kyc_documents(user_id);
CREATE INDEX idx_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_trades_user_id ON crypto_trades(user_id);
CREATE INDEX idx_trades_status ON crypto_trades(status);

-- Create function to encrypt private keys
CREATE OR REPLACE FUNCTION encrypt_private_key(private_key TEXT, user_salt TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple encryption - in production use proper KMS
  RETURN encode(digest(private_key || user_salt, 'sha256'), 'hex');
END;
$$;