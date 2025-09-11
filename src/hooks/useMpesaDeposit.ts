import { useState } from "react";
import { initiateMpesaDeposit } from "@/services/mpesa";
import { useToast } from "@/hooks/use-toast";

export function normalizePhone(phoneRaw: string): string {
  // Remove all non-digits
  const digits = phoneRaw.replace(/\D/g, "");
  
  // Handle different Kenyan phone formats
  if (/^0?7\d{8}$/.test(digits)) {
    // Convert 0712345678 or 712345678 to 254712345678
    return digits.replace(/^0?/, "254");
  }
  
  if (/^2547\d{8}$/.test(digits)) {
    // Already in correct format
    return digits;
  }
  
  if (phoneRaw.startsWith("+2547") && /^\+2547\d{8}$/.test(phoneRaw)) {
    // Remove + prefix
    return digits;
  }
  
  throw new Error("Enter a valid Kenyan phone number (e.g., 0712345678)");
}

export function validateAmount(amount: number, min = 10, max = 150000): void {
  if (Number.isNaN(amount) || !isFinite(amount)) {
    throw new Error("Invalid amount");
  }
  if (amount < min) {
    throw new Error(`Minimum deposit is KES ${min}`);
  }
  if (amount > max) {
    throw new Error(`Maximum deposit is KES ${max.toLocaleString()}`);
  }
}

export function calculateFee(amount: number): number {
  // M-Pesa transaction fees (simplified)
  if (amount <= 100) return 0;
  if (amount <= 500) return 7;
  if (amount <= 1000) return 13;
  if (amount <= 1500) return 23;
  if (amount <= 2500) return 33;
  if (amount <= 3500) return 53;
  if (amount <= 5000) return 75;
  if (amount <= 7500) return 105;
  if (amount <= 10000) return 120;
  if (amount <= 15000) return 165;
  if (amount <= 20000) return 185;
  if (amount <= 35000) return 200;
  if (amount <= 50000) return 220;
  return 250; // Above 50k
}

export function useMpesaDeposit() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function submit(phoneRaw: string, amountRaw: string) {
    setLoading(true);
    try {
      const phone = normalizePhone(phoneRaw);
      const amount = parseFloat(amountRaw);
      validateAmount(amount);
      
      const fee = calculateFee(amount);
      const netDeposit = amount - fee;
      
      const response = await initiateMpesaDeposit(phone, amount);
      
      toast({ 
        title: "STK Push Sent", 
        description: "Check your phone and enter your M-Pesa PIN to complete the transaction"
      });
      
      return { 
        success: true, 
        fee, 
        netDeposit, 
        checkoutRequestId: response.CheckoutRequestID 
      };
    } catch (err) {
      const message = (err as any)?.message || "Failed to initiate deposit";
      toast({ 
        title: "Deposit Failed", 
        description: message, 
        variant: "destructive" 
      });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }

  return { submit, loading } as const;
}