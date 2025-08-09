-- Enable required extension for UUIDs
create extension if not exists pgcrypto;

-- Wallets table: stores KES balance per (future) user
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  balance_kes numeric(18,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Holdings table: crypto balances per user and symbol
create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  symbol text not null,
  amount numeric(20,8) not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, symbol)
);

-- Transactions table: records deposits and trades
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  type text not null check (type in ('deposit','buy','sell','swap')),
  amount_kes numeric(18,2) not null,
  crypto_symbol text,
  crypto_amount numeric(20,8),
  status text not null default 'completed' check (status in ('pending','completed','failed')),
  created_at timestamptz not null default now()
);

-- Trigger function to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;$$ language plpgsql;

-- Attach triggers
create trigger trg_wallets_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

create trigger trg_holdings_updated_at
before update on public.holdings
for each row execute function public.set_updated_at();

-- Enable RLS (policies are permissive for now; add auth later)
alter table public.wallets enable row level security;
alter table public.holdings enable row level security;
alter table public.transactions enable row level security;

-- Policies: Demo-friendly (allow all). Replace with auth-based later.
create policy "Public read wallets" on public.wallets for select using (true);
create policy "Public upsert wallets" on public.wallets for insert with check (true);
create policy "Public update wallets" on public.wallets for update using (true);

create policy "Public read holdings" on public.holdings for select using (true);
create policy "Public upsert holdings" on public.holdings for insert with check (true);
create policy "Public update holdings" on public.holdings for update using (true);

create policy "Public read transactions" on public.transactions for select using (true);
create policy "Public insert transactions" on public.transactions for insert with check (true);