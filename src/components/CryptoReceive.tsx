import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QrCode, Copy, Wallet } from "lucide-react";

export const CryptoReceive = () => {
  const { toast } = useToast();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletAddress();
  }, []);

  const fetchWalletAddress = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: wallet, error } = await supabase
        .from('solana_wallets')
        .select('wallet_address')
        .eq('user_id', userData.user.id)
        .single();

      if (error) {
        console.error('Error fetching wallet:', error);
        return;
      }

      setWalletAddress(wallet.wallet_address);
    } catch (error) {
      console.error('Error fetching wallet address:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: "Address Copied",
        description: "Wallet address has been copied to clipboard"
      });
    }
  };

  const generateQRCodeURL = (address: string) => {
    // Using QR Server API for QR code generation
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(address)}`;
  };

  if (loading) {
    return (
      <Card className="crypto-card border-0">
        <CardContent className="p-6 text-center">
          <div className="text-lg">Loading wallet address...</div>
        </CardContent>
      </Card>
    );
  }

  if (!walletAddress) {
    return (
      <Card className="crypto-card border-0">
        <CardContent className="p-6 text-center">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No wallet found.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please create a wallet first to receive funds.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="crypto-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Receive Solana (SOL)
        </CardTitle>
        <CardDescription>
          Share your wallet address or QR code to receive SOL
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg">
            <img
              src={generateQRCodeURL(walletAddress)}
              alt="Wallet QR Code"
              className="w-48 h-48"
            />
          </div>
        </div>

        {/* Wallet Address */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Wallet Address:</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted p-3 rounded-lg">
              <code className="text-sm break-all font-mono">
                {walletAddress}
              </code>
            </div>
            <Button variant="outline" size="sm" onClick={copyAddress}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h4 className="font-medium mb-2">How to receive SOL:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Share your wallet address with the sender</li>
            <li>• Or let them scan the QR code above</li>
            <li>• Only accept SOL on Solana network</li>
            <li>• Transactions are usually confirmed within seconds</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};