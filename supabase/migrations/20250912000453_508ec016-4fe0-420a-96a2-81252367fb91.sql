-- Create atomic trade execution functions
CREATE OR REPLACE FUNCTION public.execute_crypto_buy(
    p_user_id UUID,
    p_wallet_id UUID,
    p_symbol TEXT,
    p_amount_kes NUMERIC,
    p_crypto_amount NUMERIC,
    p_fee_amount NUMERIC,
    p_price NUMERIC
) RETURNS VOID AS $$
BEGIN
    -- Start transaction
    BEGIN
        -- Update wallet balance
        UPDATE public.wallets 
        SET balance_kes = balance_kes - p_amount_kes,
            updated_at = now()
        WHERE id = p_wallet_id AND user_id = p_user_id;
        
        -- Check if update affected any rows
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Wallet not found or insufficient balance';
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
            -- Rollback will happen automatically
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create sell function
CREATE OR REPLACE FUNCTION public.execute_crypto_sell(
    p_user_id UUID,
    p_wallet_id UUID,
    p_symbol TEXT,
    p_amount_kes NUMERIC,
    p_crypto_amount NUMERIC,
    p_fee_amount NUMERIC,
    p_price NUMERIC
) RETURNS VOID AS $$
BEGIN
    -- Start transaction
    BEGIN
        -- Update holdings (subtract crypto)
        UPDATE public.holdings 
        SET amount = amount - p_crypto_amount,
            updated_at = now()
        WHERE user_id = p_user_id AND symbol = p_symbol AND amount >= p_crypto_amount;
        
        -- Check if update affected any rows
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Insufficient crypto holdings';
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
            -- Rollback will happen automatically
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;