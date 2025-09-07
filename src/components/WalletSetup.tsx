import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Key, Shield, Copy, CheckCircle } from "lucide-react";

export const WalletSetup = ({ onWalletCreated }: { onWalletCreated?: () => void }) => {
  const { toast } = useToast();
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    checkWalletStatus();
  }, []);

  const checkWalletStatus = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: wallet, error } = await supabase
        .from('solana_wallets')
        .select('wallet_address')
        .eq('user_id', userData.user.id)
        .single();

      setHasWallet(!!wallet && !error);
    } catch (error) {
      console.error('Error checking wallet status:', error);
      setHasWallet(false);
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('wallet-generator');

      if (error) throw error;

      setPrivateKey(data.private_key);
      setHasWallet(true);
      
      toast({
        title: "Wallet Created Successfully!",
        description: "Your Solana wallet has been created. Please save your private key securely."
      });
    } catch (error: any) {
      toast({
        title: "Failed to create wallet",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const copyPrivateKey = () => {
    if (privateKey) {
      navigator.clipboard.writeText(privateKey);
      toast({
        title: "Private key copied",
        description: "Private key has been copied to clipboard"
      });
    }
  };

  const confirmSaved = () => {
    setAcknowledged(true);
    setPrivateKey(null);
    onWalletCreated?.();
    toast({
      title: "Setup Complete",
      description: "Your wallet is ready for trading!"
    });
  };

  if (loading) {
    return (
      <Card className="crypto-card border-0">
        <CardContent className="p-6 text-center">
          <div className="text-lg">Checking wallet status...</div>
        </CardContent>
      </Card>
    );
  }

  if (hasWallet && !privateKey) {
    return null; // User already has a wallet
  }

  if (privateKey) {
    return (
      <Card className="crypto-card border-0 border-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-accent">
            <Key className="w-5 h-5" />
            Save Your Private Key
          </CardTitle>
          <CardDescription>
            This is your wallet's private key. Save it securely - it will only be shown once!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>IMPORTANT:</strong> This private key gives full access to your wallet. 
              Never share it with anyone and store it in a secure location.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Private Key:</span>
              <Button variant="outline" size="sm" onClick={copyPrivateKey}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
            <code className="text-xs break-all font-mono bg-background p-2 rounded block">
              {privateKey}
            </code>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="acknowledge"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="acknowledge" className="text-sm">
              I have securely saved my private key and understand it cannot be recovered if lost
            </label>
          </div>

          <Button 
            onClick={confirmSaved}
            disabled={!acknowledged}
            className="w-full"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            I have saved my private key
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="crypto-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Create Your Solana Wallet
        </CardTitle>
        <CardDescription>
          You need a Solana wallet to start trading. We'll create one for you on the testnet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your wallet will be created on Solana testnet for safe testing. 
            Private keys are encrypted and stored securely.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={createWallet}
          disabled={creating}
          className="w-full"
        >
          {creating ? "Creating Wallet..." : "Create Wallet"}
        </Button>
      </CardContent>
    </Card>
  );
};