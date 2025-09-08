import { useEffect, useState } from "react";
import { WalletHeader } from "@/components/WalletHeader";
import { BalanceCard } from "@/components/BalanceCard";
import { QuickActions } from "@/components/QuickActions";
import { TransactionHistory } from "@/components/TransactionHistory";
import { CryptoTrading } from "@/components/CryptoTrading";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import ChatbotWidget from "@/components/ChatbotWidget";
import { WalletSetup } from "@/components/WalletSetup";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);

  useEffect(() => {
    document.title = "Dashboard | WalletOS";
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Check if user has a wallet
        const { data: wallet } = await supabase
          .from('solana_wallets')
          .select('id')
          .eq('user_id', user.id)
          .single();
        setHasWallet(!!wallet);
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

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Please sign in to continue</div>
      </div>
    );
  }

  // Show wallet setup if user doesn't have a wallet
  if (hasWallet === false) {
    return (
      <main className="container mx-auto p-6 space-y-6">
        <div className="max-w-2xl mx-auto">
          <Card className="crypto-card border-0 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                Welcome to WalletOS
              </CardTitle>
              <CardDescription>
                Your secure gateway to cryptocurrency trading and copy-trading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Notice:</strong> All trading happens on Solana testnet for safety. 
                  Your private keys are encrypted and stored securely.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          
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
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-6 space-y-6">
      <WalletHeader />
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BalanceCard />
          <QuickActions />
          <TransactionHistory />
        </div>
        
        <div className="space-y-6">
          <CryptoTrading />
          <NotificationsPopover />
        </div>
      </div>
      
      <ChatbotWidget />
    </main>
  );
};

export default Index;