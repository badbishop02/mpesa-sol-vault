import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, ArrowRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    
    // Simulate M-Pesa API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Deposit Initiated",
        description: `STK push sent to ${phoneNumber}. Please complete the payment on your phone.`,
      });
      setAmount("");
      setPhoneNumber("");
    }, 2000);
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