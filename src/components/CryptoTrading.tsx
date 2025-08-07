import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Coins, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CryptoOption {
  symbol: string;
  name: string;
  price: number;
  change: number;
  icon: string;
}

export const CryptoTrading = () => {
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [kesAmount, setKesAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const cryptoOptions: CryptoOption[] = [
    {
      symbol: "SOL",
      name: "Solana",
      price: 18000, // KES
      change: 8.2,
      icon: "🔥"
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      price: 145, // KES
      change: 0.1,
      icon: "💵"
    },
    {
      symbol: "BTC",
      name: "Bitcoin",
      price: 5825000, // KES
      change: -2.1,
      icon: "₿"
    }
  ];

  const selectedCryptoData = cryptoOptions.find(crypto => crypto.symbol === selectedCrypto);
  const cryptoAmount = kesAmount && selectedCryptoData 
    ? (parseFloat(kesAmount) / selectedCryptoData.price).toFixed(6)
    : "0";

  const handleTrade = async (action: "buy" | "sell") => {
    if (!selectedCrypto || !kesAmount) {
      toast({
        title: "Error",
        description: "Please select cryptocurrency and enter amount",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: `${action === "buy" ? "Purchase" : "Sale"} Successful`,
        description: `${action === "buy" ? "Bought" : "Sold"} ${cryptoAmount} ${selectedCrypto} for KES ${kesAmount}`,
      });
      setKesAmount("");
      setSelectedCrypto("");
    }, 2000);
  };

  return (
    <Card className="crypto-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Coins className="h-5 w-5 text-primary" />
          <span>Crypto Trading</span>
        </CardTitle>
        <CardDescription>
          Buy and sell cryptocurrencies instantly
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy" className="text-success data-[state=active]:bg-success data-[state=active]:text-success-foreground">
              Buy Crypto
            </TabsTrigger>
            <TabsTrigger value="sell" className="text-danger data-[state=active]:bg-danger data-[state=active]:text-danger-foreground">
              Sell Crypto
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="buy" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Cryptocurrency</Label>
              <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                <SelectTrigger className="bg-secondary/50 border-border">
                  <SelectValue placeholder="Choose crypto to buy" />
                </SelectTrigger>
                <SelectContent>
                  {cryptoOptions.map((crypto) => (
                    <SelectItem key={crypto.symbol} value={crypto.symbol}>
                      <div className="flex items-center space-x-3">
                        <span>{crypto.icon}</span>
                        <div>
                          <span className="font-medium">{crypto.symbol}</span>
                          <span className="text-muted-foreground ml-2">{crypto.name}</span>
                        </div>
                        <span className="ml-auto text-sm">KES {crypto.price.toLocaleString()}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="kes-amount">Amount (KES)</Label>
              <Input
                id="kes-amount"
                type="number"
                placeholder="Enter KES amount"
                value={kesAmount}
                onChange={(e) => setKesAmount(e.target.value)}
                className="bg-secondary/50 border-border"
              />
            </div>
            
            {selectedCryptoData && kesAmount && (
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">You will receive:</span>
                  <span className="font-medium">{cryptoAmount} {selectedCrypto}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Current price:</span>
                  <span>KES {selectedCryptoData.price.toLocaleString()}</span>
                </div>
              </div>
            )}
            
            <Button
              onClick={() => handleTrade("buy")}
              disabled={isLoading || !selectedCrypto || !kesAmount}
              className="w-full success-gradient hover:opacity-90 transition-smooth"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Buy {selectedCrypto || "Crypto"}</span>
                </div>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="sell" className="space-y-4 mt-4">
            <div className="text-center p-8 text-muted-foreground">
              <ArrowUpRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Sell feature will be available once you have crypto holdings</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};