import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WalletHeader } from "@/components/WalletHeader";
import { CryptoSend } from "@/components/CryptoSend";
import { CryptoReceive } from "@/components/CryptoReceive";
import { WalletSetup } from "@/components/WalletSetup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Shield } from "lucide-react";

const Transactions = () => {
  const { toast } = useToast();
  const [amountTransfer, setAmountTransfer] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amountSell, setAmountSell] = useState("");
  const [amountWithdraw, setAmountWithdraw] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    document.title = "Transactions | WalletOS";
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Check if user has a Solana wallet
        const { data: wallet } = await supabase
          .from('solana_wallets')
          .select('id')
          .eq('user_id', user.id)
          .single();
        setHasWallet(!!wallet);
        
        // Fetch KES balance from wallets table
        const { data } = await supabase.from("wallets").select("balance_kes").eq("user_id", user.id).maybeSingle();
        setWalletBalance(Number(data?.balance_kes ?? 0));
      }
    };
    
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleWalletCreated = () => {
    setHasWallet(true);
  };

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

  // Show wallet setup if user doesn't have a wallet
  if (hasWallet === false) {
    return (
      <main className="container mx-auto p-6 space-y-6">
        <div className="max-w-2xl mx-auto">
          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              You need to create a Solana wallet before you can send or receive crypto.
            </AlertDescription>
          </Alert>
          <WalletSetup onWalletCreated={handleWalletCreated} />
        </div>
      </main>
    );
  }

  if (hasWallet === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">Send, receive, and manage your crypto</p>
        </div>
      </div>

      {/* Withdraw Maintenance Notice */}
      <Alert className="border-accent/20 bg-accent/5">
        <AlertTriangle className="h-4 w-4 text-accent" />
        <AlertDescription>
          <strong>Notice:</strong> Withdraw feature is currently under maintenance. 
          Send/Receive functions are available on testnet with 2.5% fees.
        </AlertDescription>
      </Alert>

      {/* Main Transactions Interface */}
      <Tabs defaultValue="send" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="send">Send</TabsTrigger>
          <TabsTrigger value="receive">Receive</TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <CryptoSend />
        </TabsContent>

        <TabsContent value="receive">
          <CryptoReceive />
        </TabsContent>
      </Tabs>

      {/* Legacy functionality - keep for compatibility */}
      <div className="grid lg:grid-cols-3 gap-6">
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
      </div>
    </main>
  );
};

export default Transactions;
