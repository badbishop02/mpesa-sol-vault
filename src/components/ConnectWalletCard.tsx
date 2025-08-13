import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export const ConnectWalletCard = () => {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const connectPhantom = async () => {
    const anyWindow = window as any;
    if (!anyWindow?.solana || !anyWindow?.solana?.isPhantom) {
      toast({ title: "Phantom not found", description: "Install Phantom wallet to connect.", variant: "destructive" });
      return;
    }
    try {
      const resp = await anyWindow.solana.connect();
      setConnected(true);
      setAddress(resp.publicKey?.toString?.() ?? null);
      toast({ title: "Wallet connected" });
    } catch (e: any) {
      toast({ title: "Connection failed", description: e?.message ?? "Could not connect wallet", variant: "destructive" });
    }
  };

  const notAvailable = (name: string) => {
    toast({ title: `${name} not available`, description: "This wallet will be supported soon." });
  };

  return (
    <Card className="crypto-card border-0">
      <CardHeader>
        <CardTitle>Connect Wallet</CardTitle>
        <CardDescription>Link your crypto wallet for transfers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <Button onClick={connectPhantom} variant="secondary">Phantom</Button>
          <Button onClick={() => notAvailable("Magic Eden")} variant="secondary">Magic Eden</Button>
          <Button onClick={() => notAvailable("Exodus")} variant="secondary">Exodus</Button>
          <Button onClick={() => notAvailable("MetaMask")} variant="secondary">MetaMask</Button>
        </div>
        {connected && (
          <div className="text-sm text-muted-foreground">
            Connected: <span className="font-mono break-all">{address}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectWalletCard;
