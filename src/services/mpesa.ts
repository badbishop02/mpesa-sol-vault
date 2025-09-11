import { supabase } from "@/integrations/supabase/client";

export type MpesaInitResponse = { 
  CheckoutRequestID: string; 
  MerchantRequestID?: string;
  ResponseCode: string;
  ResponseDescription: string;
};

export async function initiateMpesaDeposit(phone: string, amount: number): Promise<MpesaInitResponse> {
  const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
    body: { phone, amount }
  });

  if (error) {
    const message = error?.message || 'M-Pesa initiation failed';
    throw new Error(message);
  }

  return data;
}

export async function checkMpesaStatus(checkoutRequestId: string) {
  const { data, error } = await supabase.functions.invoke('mpesa-status-check', {
    body: { checkoutRequestId }
  });

  if (error) {
    throw new Error(error.message || 'Status check failed');
  }

  return data;
}