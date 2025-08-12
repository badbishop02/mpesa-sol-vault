import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WalletHeader } from "@/components/WalletHeader";
import { usePrices } from "@/hooks/use-prices";

const Transactions = () => {
  const { toast } = useToast();
  const { prices } = usePrices();
  const [sellSymbol, setSellSymbol] = useState("SOL");
  const [sellAmount, setSellAmount] = useState("");
  const [transferAddress, setTransferAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = "Transactions | WalletOS"; }, []);

  const sell = async () => {
    try {
      setLoading(true);
      const qty = parseFloat(sellAmount);
      if (!qty || qty <= 0) throw new Error("Enter a valid amount");

      const priceKes = prices[sellSymbol] ?? 0;
      const grossKes = qty * priceKes;
      const feeRate = 0.035; // 3.5%
      const fee = Math.round(grossKes * feeRate);
      const netKes = Math.round(grossKes - fee);

      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Not authenticated");

      // Deduct holdings
      const { data: holding } = await supabase.from("holdings").select("id, amount").eq("user_id", userId).eq("symbol", sellSymbol).maybeSingle();
      const current = Number(holding?.amount || 0);
      if (current < qty) throw new Error("Insufficient holdings");
      await supabase.from("holdings").upsert({ id: holding?.id, user_id: userId, symbol: sellSymbol, amount: current - qty });

      // Credit wallet
      const { data: wallet } = await supabase.from("wallets").select("id, balance_kes").eq("user_id", userId).maybeSingle();
      const newBal = (Number(wallet?.balance_kes || 0) + netKes);
      if (!wallet) {
        await supabase.from("wallets").insert([{ user_id: userId, balance_kes: newBal }]);
      } else {
        await supabase.from("wallets").update({ balance_kes: newBal }).eq("id", wallet.id);
      }

      await supabase.from("transactions").insert([{ user_id: userId, type: "sell", crypto_symbol: sellSymbol, crypto_amount: qty, amount_kes: netKes, status: "completed" }]);

      toast({ title: "Sold successfully", description: `KES ${netKes} credited (fee KES ${fee}).` });
      setSellAmount("");
    } catch (e: any) {
      toast({ title: "Sell failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const transfer = async () => {
    try {
      setLoading(true);
      if (!transferAddress || !transferAmount) throw new Error("Enter address and amount");
      // Simulation only – record in history
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Not authenticated");
      await supabase.from("transactions").insert([{ user_id: userId, type: "transfer", crypto_symbol: "SOL", crypto_amount: Number(transferAmount), amount_kes: 0, status: "completed" }]);
      toast({ title: "Transfer recorded", description: "On-chain transfer not executed in demo." });
      setTransferAmount("");
      setTransferAddress("");
    } catch (e: any) {
      toast({ title: "Transfer failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async () => {
    try {
      setLoading(true);
      const amount = parseFloat(withdrawAmount);
      if (!amount || amount <= 0) throw new Error("Enter a valid amount");
      const { error } = await supabase.functions.invoke("mpesa-b2c-withdraw", { body: { amount } });
      if (error) throw error;
      toast({ title: "Withdrawal requested", description: "Processing via M-Pesa." });
      setWithdrawAmount("");
    } catch (e: any) {
      toast({ title: "Withdraw failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <WalletHeader />
      <main className="container mx-auto p-6 grid lg:grid-cols-3 gap-6">
        <Card className="crypto-card border-0">
          <CardHeader>
            <CardTitle>Transfer Crypto</CardTitle>
            <CardDescription>Send to another address (simulation)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="to">Recipient Address</Label>
              <Input id="to" value={transferAddress} onChange={(e) => setTransferAddress(e.target.value)} placeholder="Enter address" />
            </div>
            <div>
              <Label htmlFor="amt">Amount (SOL)</Label>
              <Input id="amt" type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="0.00" />
            </div>
            <p className="text-xs text-muted-foreground">Disclaimer: Transactions are irreversible.</p>
            <Button onClick={transfer} disabled={loading}>Send</Button>
          </CardContent>
        </Card>

        <Card className="crypto-card border-0">
          <CardHeader>
            <CardTitle>Sell Assets</CardTitle>
            <CardDescription>Convert to KES at real-time price</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Asset</Label>
              <select className="w-full h-10 rounded-md border bg-background" value={sellSymbol} onChange={(e) => setSellSymbol(e.target.value)}>
                <option value="SOL">SOL</option>
                <option value="USDT">USDT</option>
                <option value="BTC">BTC</option>
              </select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" value={sellAmount} onChange={(e) => setSellAmount(e.target.value)} placeholder="0.00" />
            </div>
            <Button onClick={sell} disabled={loading}>Sell</Button>
          </CardContent>
        </Card>

        <Card className="crypto-card border-0">
          <CardHeader>
            <CardTitle>Withdraw to M-Pesa</CardTitle>
            <CardDescription>Withdraw local currency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Amount (KES)</Label>
              <Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0" />
            </div>
            <Button onClick={withdraw} disabled={loading}>Withdraw</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Transactions;
