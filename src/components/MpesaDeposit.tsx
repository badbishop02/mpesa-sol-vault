import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, ArrowRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/user";

export const MpesaDeposit = () => {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      const userId = getUserId();

      // Record transaction
      const { error: txError } = await supabase.from("transactions").insert([
        {
          user_id: userId,
          type: "deposit",
          amount_kes: amountNumber,
          status: "completed",
        },
      ]);
      if (txError) throw txError;

      // Upsert wallet balance
      const { data: existing, error: fetchErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (fetchErr) throw fetchErr;

      if (!existing) {
        const { error: insertErr } = await supabase.from("wallets").insert([
          { user_id: userId, balance_kes: amountNumber },
        ]);
        if (insertErr) throw insertErr;
      } else {
        const { error: updateErr } = await supabase
          .from("wallets")
          .update({ balance_kes: (Number(existing.balance_kes) || 0) + amountNumber })
          .eq("id", existing.id);
        if (updateErr) throw updateErr;
      }

      toast({
        title: "Deposit Successful",
        description: `KES ${amountNumber.toLocaleString()} added to your wallet.`,
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
          Add money to your wallet instantly via M-Pesa
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleDeposit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="254712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="bg-secondary/50 border-border"
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