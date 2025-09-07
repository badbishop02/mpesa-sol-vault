-- Create additional tables for the comprehensive crypto platform

-- Table for Solana wallets (encrypted private keys)
CREATE TABLE public.solana_wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text NOT NULL UNIQUE,
  encrypted_private_key text NOT NULL,
  is_testnet boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table for tracking whales and their performance
CREATE TABLE public.whales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address text NOT NULL UNIQUE,
  score numeric NOT NULL DEFAULT 0,
  win_rate numeric NOT NULL DEFAULT 0,
  avg_hold_time numeric NOT NULL DEFAULT 0,
  realized_pnl numeric NOT NULL DEFAULT 0,
  trade_count integer NOT NULL DEFAULT 0,
  follower_count integer NOT NULL DEFAULT 0,
  last_scored_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table for copy trading follows
CREATE TABLE public.copy_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  whale_id uuid NOT NULL REFERENCES public.whales(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  sizing_type text NOT NULL DEFAULT 'percent', -- 'percent' or 'fixed'
  sizing_value numeric NOT NULL DEFAULT 1.0,
  max_slippage numeric NOT NULL DEFAULT 0.05,
  max_notional numeric,
  stop_loss_pct numeric,
  take_profit_pct numeric,
  trailing_stop_pct numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, whale_id)
);

-- Table for Telegram groups/channels
CREATE TABLE public.telegram_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_link text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  auto_execute boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table for trade executions
CREATE TABLE public.trade_executions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_type text NOT NULL, -- 'buy', 'sell', 'send', 'receive'
  token_mint text NOT NULL,
  amount numeric NOT NULL,
  price_per_token numeric,
  fee_amount numeric NOT NULL DEFAULT 0,
  fee_wallet text NOT NULL DEFAULT '8DvPHfxRLVA48DqySJqdiwpCUadRgECQoZ22EbyKRkQG9c',
  transaction_hash text,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  source_type text NOT NULL DEFAULT 'manual', -- 'manual', 'copy_trade', 'telegram'
  source_id uuid,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table for portfolio holdings
CREATE TABLE public.portfolio_holdings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_mint text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  avg_buy_price numeric NOT NULL DEFAULT 0,
  total_invested numeric NOT NULL DEFAULT 0,
  unrealized_pnl numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, token_mint)
);

-- Table for user settings
CREATE TABLE public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_execute_enabled boolean NOT NULL DEFAULT false,
  default_slippage numeric NOT NULL DEFAULT 0.01,
  risk_tolerance text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
  max_daily_loss numeric,
  two_fa_enabled boolean NOT NULL DEFAULT false,
  two_fa_secret text,
  email_notifications boolean NOT NULL DEFAULT true,
  telegram_notifications boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.solana_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for solana_wallets
CREATE POLICY "Users can view their own wallet" ON public.solana_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" ON public.solana_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON public.solana_wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for whales (publicly readable for discovery)
CREATE POLICY "Whales are publicly viewable" ON public.whales
  FOR SELECT USING (true);

-- RLS Policies for copy_follows
CREATE POLICY "Users can view their own follows" ON public.copy_follows
  FOR SELECT USING (auth.uid() = follower_id);

CREATE POLICY "Users can insert their own follows" ON public.copy_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can update their own follows" ON public.copy_follows
  FOR UPDATE USING (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON public.copy_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for telegram_sources
CREATE POLICY "Users can view their own telegram sources" ON public.telegram_sources
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own telegram sources" ON public.telegram_sources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own telegram sources" ON public.telegram_sources
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own telegram sources" ON public.telegram_sources
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for trade_executions
CREATE POLICY "Users can view their own trade executions" ON public.trade_executions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trade executions" ON public.trade_executions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for portfolio_holdings
CREATE POLICY "Users can view their own portfolio holdings" ON public.portfolio_holdings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio holdings" ON public.portfolio_holdings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio holdings" ON public.portfolio_holdings
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_settings
CREATE POLICY "Users can view their own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Add wallet_address to profiles for easy access
ALTER TABLE public.profiles ADD COLUMN wallet_address text;

-- Create indexes for performance
CREATE INDEX idx_solana_wallets_user_id ON public.solana_wallets(user_id);
CREATE INDEX idx_copy_follows_follower_id ON public.copy_follows(follower_id);
CREATE INDEX idx_copy_follows_whale_id ON public.copy_follows(whale_id);
CREATE INDEX idx_trade_executions_user_id ON public.trade_executions(user_id);
CREATE INDEX idx_trade_executions_status ON public.trade_executions(status);
CREATE INDEX idx_portfolio_holdings_user_id ON public.portfolio_holdings(user_id);
CREATE INDEX idx_whales_score ON public.whales(score DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_solana_wallets_updated_at BEFORE UPDATE ON public.solana_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_whales_updated_at BEFORE UPDATE ON public.whales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_copy_follows_updated_at BEFORE UPDATE ON public.copy_follows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_telegram_sources_updated_at BEFORE UPDATE ON public.telegram_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trade_executions_updated_at BEFORE UPDATE ON public.trade_executions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();