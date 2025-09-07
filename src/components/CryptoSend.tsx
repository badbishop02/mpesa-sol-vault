import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, AlertTriangle, DollarSign } from "lucide-react";

export const CryptoSend = () => {
  const { toast } = useToast();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient || !amount) {
      toast({
        title: "Missing information",
        description: "Please enter both recipient address and amount",
        variant: "destructive"
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('solana-transfer', {
        body: {
          recipient,
          amount: amountNum,
          token_mint: 'SOL'
        }
      });

      if (error) throw error;

      toast({
        title: "Transfer Successful!",
        description: `Sent ${data.amount} SOL to ${recipient.slice(0, 8)}...${recipient.slice(-4)}. Fee: ${data.fee} SOL`
      });

      setRecipient("");
      setAmount("");
    } catch (error: any) {
      toast({
        title: "Transfer Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const calculateFee = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return 0;
    return (amountNum * 0.025).toFixed(6); // 2.5% fee
  };

  const calculateNetAmount = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return 0;
    return (amountNum * 0.975).toFixed(6); // Amount after 2.5% fee
  };

  return (
    <Card className="crypto-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Send Solana (SOL)
        </CardTitle>
        <CardDescription>
          Send SOL to another wallet address with automatic fee deduction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSend} className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> All transfers are final and cannot be undone. 
              A 2.5% fee is automatically deducted and sent to the fee wallet.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              type="text"
              placeholder="Enter Solana wallet address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="amount">Amount (SOL)</Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {amount && !isNaN(parseFloat(amount)) && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Amount to send:</span>
                <span>{amount} SOL</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Fee (2.5%):</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {calculateFee()} SOL
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t pt-2">
                <span>Recipient receives:</span>
                <span>{calculateNetAmount()} SOL</span>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={sending || !recipient || !amount}
            className="w-full"
          >
            {sending ? "Sending..." : "Send SOL"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};