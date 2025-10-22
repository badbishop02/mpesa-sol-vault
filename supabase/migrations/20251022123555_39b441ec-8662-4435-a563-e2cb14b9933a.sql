-- Add explicit DELETE policies for financial tables to prevent data deletion
-- This ensures audit trail integrity and prevents accidental or malicious record deletion

-- Wallets: Deny all DELETE operations
CREATE POLICY "Deny delete on wallets"
ON public.wallets
FOR DELETE
TO authenticated
USING (false);

-- Holdings: Deny all DELETE operations
CREATE POLICY "Deny delete on holdings"
ON public.holdings
FOR DELETE
TO authenticated
USING (false);

-- Transactions: Deny all DELETE operations
CREATE POLICY "Deny delete on transactions"
ON public.transactions
FOR DELETE
TO authenticated
USING (false);

-- M-Pesa Payments: Deny all DELETE operations
CREATE POLICY "Deny delete on mpesa_payments"
ON public.mpesa_payments
FOR DELETE
TO authenticated
USING (false);

-- Crypto Trades: Deny all DELETE operations
CREATE POLICY "Deny delete on crypto_trades"
ON public.crypto_trades
FOR DELETE
TO authenticated
USING (false);

-- Trade Executions: Deny all DELETE operations
CREATE POLICY "Deny delete on trade_executions"
ON public.trade_executions
FOR DELETE
TO authenticated
USING (false);

-- Update execute_crypto_buy function to add ownership validation
CREATE OR REPLACE FUNCTION public.execute_crypto_buy(
  p_user_id uuid, 
  p_wallet_id uuid, 
  p_symbol text, 
  p_amount_kes numeric, 
  p_crypto_amount numeric, 
  p_fee_amount numeric, 
  p_price numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Validate ownership: Ensure the wallet belongs to the authenticated user
    IF NOT EXISTS (
        SELECT 1 FROM public.wallets 
        WHERE id = p_wallet_id 
        AND user_id = p_user_id 
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Wallet does not belong to user';
    END IF;

    -- Start transaction
    BEGIN
        -- Update wallet balance
        UPDATE public.wallets 
        SET balance_kes = balance_kes - p_amount_kes,
            updated_at = now()
        WHERE id = p_wallet_id AND user_id = p_user_id;
        
        -- Check if update affected any rows
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Insufficient balance';
        END IF;
        
        -- Insert transaction record
        INSERT INTO public.transactions (
            user_id, type, amount_kes, crypto_symbol, crypto_amount, status
        ) VALUES (
            p_user_id, 'buy', p_amount_kes, p_symbol, p_crypto_amount, 'completed'
        );
        
        -- Upsert holdings
        INSERT INTO public.holdings (user_id, symbol, amount)
        VALUES (p_user_id, p_symbol, p_crypto_amount)
        ON CONFLICT (user_id, symbol) 
        DO UPDATE SET 
            amount = holdings.amount + p_crypto_amount,
            updated_at = now();
            
        -- Insert crypto trade record
        INSERT INTO public.crypto_trades (
            user_id, type, from_currency, to_currency, 
            amount_from, amount_to, fee_amount, status
        ) VALUES (
            p_user_id, 'buy', 'KES', p_symbol,
            p_amount_kes, p_crypto_amount, p_fee_amount, 'completed'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END;
END;
$function$;

-- Update execute_crypto_sell function to add ownership validation
CREATE OR REPLACE FUNCTION public.execute_crypto_sell(
  p_user_id uuid, 
  p_wallet_id uuid, 
  p_symbol text, 
  p_amount_kes numeric, 
  p_crypto_amount numeric, 
  p_fee_amount numeric, 
  p_price numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Validate ownership: Ensure the wallet belongs to the authenticated user
    IF NOT EXISTS (
        SELECT 1 FROM public.wallets 
        WHERE id = p_wallet_id 
        AND user_id = p_user_id 
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Wallet does not belong to user';
    END IF;

    -- Start transaction
    BEGIN
        -- Update holdings (subtract crypto)
        UPDATE public.holdings 
        SET amount = amount - p_crypto_amount,
            updated_at = now()
        WHERE user_id = p_user_id AND symbol = p_symbol AND amount >= p_crypto_amount;
        
        -- Check if update affected any rows
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Insufficient holdings';
        END IF;
        
        -- Update wallet balance (add KES after fees)
        UPDATE public.wallets 
        SET balance_kes = balance_kes + p_amount_kes,
            updated_at = now()
        WHERE id = p_wallet_id AND user_id = p_user_id;
        
        -- Insert transaction record
        INSERT INTO public.transactions (
            user_id, type, amount_kes, crypto_symbol, crypto_amount, status
        ) VALUES (
            p_user_id, 'sell', p_amount_kes, p_symbol, p_crypto_amount, 'completed'
        );
        
        -- Insert crypto trade record
        INSERT INTO public.crypto_trades (
            user_id, type, from_currency, to_currency, 
            amount_from, amount_to, fee_amount, status
        ) VALUES (
            p_user_id, 'sell', p_symbol, 'KES',
            p_crypto_amount, p_amount_kes, p_fee_amount, 'completed'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END;
END;
$function$;