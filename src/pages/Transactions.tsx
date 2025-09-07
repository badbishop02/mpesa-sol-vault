import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WalletHeader } from "@/components/WalletHeader";
import { CryptoSend } from "@/components/CryptoSend";
import { CryptoReceive } from "@/components/CryptoReceive";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Transactions = () => {
  const { toast } = useToast();
  const [amountTransfer, setAmountTransfer] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amountSell, setAmountSell] = useState("");
  const [amountWithdraw, setAmountWithdraw] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  useEffect(() => {
    document.title = "Transactions | WalletOS";
    const fetchWallet = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      const { data } = await supabase.from("wallets").select("balance_kes").eq("user_id", userId).maybeSingle();
      setWalletBalance(Number(data?.balance_kes ?? 0));
    };
    fetchWallet();
  }, []);

  const sellFeeRate = 0.035; // 3.5%
  const transferFeeRate = 0.02; // 2%
  const sellFee = useMemo(() => (parseFloat(amountSell || "0") || 0) * sellFeeRate, [amountSell]);

  const insertTx = async (payload: any) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      toast({ title: "Please sign in", variant: "destructive" });
      return false;
    }
    const { error } = await supabase.from("transactions").insert([{ user_id: userId, status: "pending", ...payload }]);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  };

  const onTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const amt = parseFloat(amountTransfer);
      if (!amt || amt <= 0 || !recipient) throw new Error("Enter valid amount and recipient");
      const ok = await insertTx({ type: "transfer", crypto_symbol: "USDT", crypto_amount: amt, amount_kes: null });
      if (ok) toast({ title: "Transfer queued", description: "Transfers are irreversible. Fees apply automatically." });
      setAmountTransfer("");
      setRecipient("");
    } catch (err: any) {
      toast({ title: "Transfer failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const onSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const amt = parseFloat(amountSell);
      if (!amt || amt <= 0) throw new Error("Enter valid amount");
      const kes = amt - sellFee;
      const ok = await insertTx({ type: "sell", crypto_symbol: "USDT", crypto_amount: amt, amount_kes: kes });
      if (ok) toast({ title: "Sell queued", description: `Fee applied: ${sellFee.toFixed(2)} USDT` });
      setAmountSell("");
    } catch (err: any) {
      toast({ title: "Sell failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const onWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const amt = parseFloat(amountWithdraw);
      if (!amt || amt <= 0) throw new Error("Enter valid amount");
      if (amt > walletBalance) throw new Error("Insufficient local balance");
      if (!otp || otp.length < 4) throw new Error("Enter 2FA code to proceed");
      const ok = await insertTx({ type: "withdraw", amount_kes: amt });
      if (ok) toast({ title: "Withdrawal queued", description: "Processing via M-Pesa. You'll be notified." });
      setAmountWithdraw("");
      setOtp("");
    } catch (err: any) {
      toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 grid lg:grid-cols-3 gap-6">
        <Card className="crypto-card border-0 lg:col-span-1">
          <CardHeader>
            <CardTitle>Transfer Crypto</CardTitle>
            <CardDescription>Transfers are irreversible</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onTransfer} className="space-y-3">
              <div>
                <label className="text-sm mb-1 block">Amount (USDT)</label>
                <Input inputMode="decimal" value={amountTransfer} onChange={(e) => setAmountTransfer(e.target.value)} />
              </div>
              <div>
                <label className="text-sm mb-1 block">Recipient Address</label>
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Wallet address" />
              </div>
              <p className="text-xs text-muted-foreground">By proceeding, you accept that crypto transfers are irreversible. Fee {Math.round(transferFeeRate*100)}% applies.</p>
              <Button type="submit" disabled={busy} className="w-full">{busy ? 'Please wait' : 'Transfer'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="crypto-card border-0 lg:col-span-1">
          <CardHeader>
            <CardTitle>Sell Crypto</CardTitle>
            <CardDescription>Convert to local currency</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSell} className="space-y-3">
              <div>
                <label className="text-sm mb-1 block">Amount (USDT)</label>
                <Input inputMode="decimal" value={amountSell} onChange={(e) => setAmountSell(e.target.value)} />
              </div>
              <div className="text-xs text-muted-foreground">Fee {Math.round(sellFeeRate*100)}% ≈ {sellFee.toFixed(2)} USDT</div>
              <Button type="submit" disabled={busy} className="w-full">{busy ? 'Please wait' : 'Sell'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="crypto-card border-0 lg:col-span-1">
          <CardHeader>
            <CardTitle>Withdraw Funds</CardTitle>
            <CardDescription>M-Pesa withdrawal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm mb-3">Available balance: KES {walletBalance.toFixed(2)}</div>
            <form onSubmit={onWithdraw} className="space-y-3">
              <div>
                <label className="text-sm mb-1 block">Amount (KES)</label>
                <Input inputMode="decimal" value={amountWithdraw} onChange={(e) => setAmountWithdraw(e.target.value)} />
              </div>
              <div>
                <label className="text-sm mb-1 block">2FA Code</label>
                <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter authenticator code" />
              </div>
              <Button type="submit" disabled={busy} className="w-full">{busy ? 'Please wait' : 'Withdraw'}</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Transactions;
