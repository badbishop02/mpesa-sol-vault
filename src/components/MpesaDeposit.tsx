import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, ArrowRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const MpesaDeposit = () => {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Kenyan phone normalization: accepts 07XXXXXXXX, 7XXXXXXXX, 2547XXXXXXXX, +2547XXXXXXXX
  const normalizeKenyanPhone = (input: string) => {
    const digits = input.replace(/\D/g, "");
    let p = digits;
    if (p.startsWith("0")) p = "254" + p.slice(1);
    else if (p.startsWith("7")) p = "254" + p;
    else if (p.startsWith("254")) {
      // ok
    } else if (p.startsWith("2547") === false && p.startsWith("+2547")) {
      p = p.replace(/^\+/, "");
    }
    if (!/^2547\d{8}$/.test(p)) {
      throw new Error("Enter a valid Kenyan phone e.g. 2547XXXXXXXX");
    }
    return p;
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !phoneNumber) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const amountNumber = parseFloat(amount);
      if (isNaN(amountNumber) || amountNumber <= 0) {
        throw new Error("Enter a valid amount greater than 0");
      }

      const normalizedPhone = normalizeKenyanPhone(phoneNumber);

      const { error } = await supabase.functions.invoke("mpesa-stk-push", {
        body: {
          amount: amountNumber,
          phone: normalizedPhone,
        },
      });
      if (error) throw error;

      toast({
        title: "STK Push Sent",
        description:
          "Check your phone and enter M-Pesa PIN. Your wallet updates instantly after confirmation.",
      });
      setAmount("");
      setPhoneNumber("");
    } catch (err: any) {
      toast({
        title: "Deposit Failed",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="crypto-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5 text-primary" />
          <span>M-Pesa Deposit</span>
        </CardTitle>
        <CardDescription>
          Add money to your WalletOS instantly via M-Pesa
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleDeposit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="2547XXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="bg-secondary/50 border-border"
              aria-label="M-Pesa phone number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (KES)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-secondary/50 border-border"
              aria-label="Deposit amount in Kenyan Shillings"
              min={1}
              step={1}
              inputMode="numeric"
            />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <span className="text-sm text-muted-foreground">Transaction Fee</span>
            <span className="text-sm font-medium">KES 0</span>
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full crypto-gradient hover:opacity-90 transition-smooth"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <span>Deposit KES {amount || "0"}</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
        
        <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex items-center space-x-2 text-success text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Deposits reflect instantly in your wallet</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
