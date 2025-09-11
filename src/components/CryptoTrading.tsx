import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Coins, ArrowUpRight, TrendingDown } from "lucide-react";
import { useTradeCrypto } from "@/hooks/useTradeCrypto";
import { getUserHoldings } from "@/services/trading";
import { usePrices } from "@/hooks/use-prices";
import { supabase } from "@/integrations/supabase/client";

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
  const [holdings, setHoldings] = useState<Record<string, number>>({});
  const [userId, setUserId] = useState<string | null>(null);

  const { prices, loading: pricesLoading } = usePrices();
  const { trade, loading: tradeLoading } = useTradeCrypto();

  const cryptoOptions: CryptoOption[] = [
    { symbol: "SOL", name: "Solana", price: prices.SOL ?? 0, change: 0, icon: "🔥" },
    { symbol: "USDT", name: "Tether USD", price: prices.USDT ?? 0, change: 0, icon: "💵" },
    { symbol: "BTC", name: "Bitcoin", price: prices.BTC ?? 0, change: 0, icon: "₿" },
  ];

  // Load user and holdings on mount
  useEffect(() => {
    const loadUserData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        setUserId(userData.user.id);
        try {
          const userHoldings = await getUserHoldings(userData.user.id);
          const holdingsMap = userHoldings.reduce((acc, holding) => {
            acc[holding.symbol] = Number(holding.amount);
            return acc;
          }, {} as Record<string, number>);
          setHoldings(holdingsMap);
        } catch (error) {
          console.error('Failed to load holdings:', error);
        }
      }
    };
    loadUserData();
  }, []);

  const selectedCryptoData = cryptoOptions.find((crypto) => crypto.symbol === selectedCrypto);
  const cryptoAmount = kesAmount && selectedCryptoData && selectedCryptoData.price > 0
    ? (parseFloat(kesAmount) / selectedCryptoData.price).toFixed(6)
    : "0";

  const maxSellAmount = selectedCrypto ? holdings[selectedCrypto] || 0 : 0;
  const canSell = maxSellAmount > 0;

  const handleTrade = async (action: "buy" | "sell") => {
    if (!selectedCrypto || !kesAmount) return;
    
    const amountKes = parseFloat(kesAmount);
    if (isNaN(amountKes) || amountKes <= 0) return;

    const price = selectedCryptoData?.price;
    if (!price || price <= 0) return;

    // For sell orders, validate against holdings
    if (action === "sell") {
      const cryptoAmountNeeded = amountKes / price;
      if (cryptoAmountNeeded > maxSellAmount) {
        return;
      }
    }

    const result = await trade({
      symbol: selectedCrypto,
      side: action,
      amountKes,
      price
    });

    if (result.success) {
      setKesAmount("");
      setSelectedCrypto("");
      // Refresh holdings
      if (userId) {
        try {
          const userHoldings = await getUserHoldings(userId);
          const holdingsMap = userHoldings.reduce((acc, holding) => {
            acc[holding.symbol] = Number(holding.amount);
            return acc;
          }, {} as Record<string, number>);
          setHoldings(holdingsMap);
        } catch (error) {
          console.error('Failed to refresh holdings:', error);
        }
      }
    }
  };

  return (
    <Card className="crypto-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Coins className="h-5 w-5 text-primary" />
          <span>Crypto Trading</span>
        </CardTitle>
        <CardDescription>Buy and sell cryptocurrencies instantly</CardDescription>
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
              disabled={pricesLoading || tradeLoading || !selectedCrypto || !kesAmount} 
              className="w-full success-gradient hover:opacity-90 transition-smooth"
            >
              {tradeLoading ? (
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
            {!canSell ? (
              <div className="text-center p-8 text-muted-foreground">
                <ArrowUpRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No crypto holdings available to sell</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Select Cryptocurrency to Sell</Label>
                  <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                    <SelectTrigger className="bg-secondary/50 border-border">
                      <SelectValue placeholder="Choose crypto to sell" />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptoOptions
                        .filter(crypto => holdings[crypto.symbol] > 0)
                        .map((crypto) => (
                          <SelectItem key={crypto.symbol} value={crypto.symbol}>
                            <div className="flex items-center space-x-3">
                              <span>{crypto.icon}</span>
                              <div>
                                <span className="font-medium">{crypto.symbol}</span>
                                <span className="text-muted-foreground ml-2">{crypto.name}</span>
                              </div>
                              <span className="ml-auto text-sm">
                                {holdings[crypto.symbol]?.toFixed(6)} available
                              </span>
                            </div>
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sell-amount">Amount (KES)</Label>
                  <Input
                    id="sell-amount"
                    type="number"
                    placeholder="Enter KES amount to sell"
                    value={kesAmount}
                    onChange={(e) => setKesAmount(e.target.value)}
                    className="bg-secondary/50 border-border"
                  />
                  {selectedCrypto && maxSellAmount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Maximum: {(maxSellAmount * (selectedCryptoData?.price || 0)).toLocaleString()} KES 
                      ({maxSellAmount.toFixed(6)} {selectedCrypto})
                    </p>
                  )}
                </div>

                {selectedCryptoData && kesAmount && (
                  <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">You will sell:</span>
                      <span className="font-medium">{cryptoAmount} {selectedCrypto}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Current price:</span>
                      <span>KES {selectedCryptoData.price.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => handleTrade("sell")} 
                  disabled={
                    pricesLoading || 
                    tradeLoading || 
                    !selectedCrypto || 
                    !kesAmount ||
                    (selectedCryptoData && kesAmount && parseFloat(kesAmount) / selectedCryptoData.price > maxSellAmount)
                  }
                  className="w-full danger-gradient hover:opacity-90 transition-smooth"
                >
                  {tradeLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4" />
                      <span>Sell {selectedCrypto || "Crypto"}</span>
                    </div>
                  )}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
