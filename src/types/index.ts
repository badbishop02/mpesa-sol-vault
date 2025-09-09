export interface IHoldings {
  id: string;
  token_mint: string;
  symbol: string;
  amount: number;
  value_usd: number;
  avg_price?: number;
  user_id: string;
  updated_at: string;
}

export interface IAllocation {
  token_mint: string;
  target_pct: number;
  current_pct: number;
}

export interface IExecution {
  id: string;
  user_id: string;
  token_mint: string;
  trade_type: 'buy' | 'sell';
  amount: number;
  price_per_token?: number;
  status: 'pending' | 'completed' | 'failed';
  transaction_hash?: string;
  fee_amount: number;
  fee_wallet: string;
  error_message?: string;
  source_type: 'manual' | 'copy' | 'telegram';
  source_id?: string;
  created_at: string;
  updated_at: string;
}

export interface IUser {
  id: string;
  email?: string;
  phone?: string;
  has_2fa?: boolean;
  wallet_address?: string;
  created_at: string;
}

export interface IWhale {
  id: string;
  wallet_address: string;
  score: number;
  win_rate: number;
  avg_hold_time: number;
  realized_pnl: number;
  trade_count: number;
  follower_count: number;
  last_scored_at: string;
}

export interface ICopyFollow {
  id: string;
  follower_id: string;
  whale_id: string;
  is_active: boolean;
  sizing_type: 'percent' | 'fixed';
  sizing_value: number;
  max_slippage: number;
  max_notional?: number;
  stop_loss_pct?: number;
  take_profit_pct?: number;
  trailing_stop_pct?: number;
  created_at: string;
  updated_at: string;
}

export interface ITelegramSource {
  id: string;
  user_id: string;
  telegram_link: string;
  is_active: boolean;
  auto_execute: boolean;
  created_at: string;
  updated_at: string;
}

export interface IUserSettings {
  id: string;
  user_id: string;
  auto_execute_enabled: boolean;
  default_slippage: number;
  max_daily_loss?: number;
  risk_tolerance: 'low' | 'medium' | 'high';
  two_fa_enabled: boolean;
  two_fa_secret?: string;
  email_notifications: boolean;
  telegram_notifications: boolean;
  created_at: string;
  updated_at: string;
}