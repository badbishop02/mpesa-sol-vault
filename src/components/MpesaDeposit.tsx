import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { useMpesaDeposit, calculateFee, validateAmount, normalizePhone } from "@/hooks/useMpesaDeposit";

export const MpesaDeposit = () => {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fee, setFee] = useState(0);
  const [validationError, setValidationError] = useState("");
  
  const { submit, loading } = useMpesaDeposit();

  // Calculate fee dynamically when amount changes
  useEffect(() => {
    if (amount) {
      const amountNum = parseFloat(amount);
      if (!isNaN(amountNum) && amountNum > 0) {
        try {
          validateAmount(amountNum);
          setFee(calculateFee(amountNum));
          setValidationError("");
        } catch (error) {
          setValidationError((error as Error).message);
          setFee(0);
        }
      } else {
        setFee(0);
        setValidationError("");
      }
    } else {
      setFee(0);
      setValidationError("");
    }
  }, [amount]);

  // Validate phone number on change
  useEffect(() => {
    if (phoneNumber) {
      try {
        normalizePhone(phoneNumber);
        setValidationError("");
      } catch (error) {
        setValidationError((error as Error).message);
      }
    } else {
      setValidationError("");
    }
  }, [phoneNumber]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !phoneNumber) {
      setValidationError("Please fill in all fields");
      return;
    }

    if (validationError) {
      return;
    }

    const result = await submit(phoneNumber, amount);
    
    if (result.success) {
      setAmount("");
      setPhoneNumber("");
      setFee(0);
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
            <span className="text-sm text-muted-foreground">M-Pesa Fee</span>
            <span className="text-sm font-medium">KES {fee}</span>
          </div>
          
          {fee > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <span className="text-sm text-muted-foreground">You will receive</span>
              <span className="text-sm font-medium">KES {parseFloat(amount || "0") - fee}</span>
            </div>
          )}

          {validationError && (
            <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{validationError}</span>
            </div>
          )}
          
          <Button
            type="submit"
            disabled={loading || !!validationError || !amount || !phoneNumber}
            className="w-full crypto-gradient hover:opacity-90 transition-smooth"
          >
            {loading ? (
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
