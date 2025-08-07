import { TrendingUp, TrendingDown } from "lucide-react";

interface CryptoAsset {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  change: number;
  icon: string;
}

export const CryptoPortfolio = () => {
  const assets: CryptoAsset[] = [
    {
      symbol: "SOL",
      name: "Solana",
      balance: 2.5,
      value: 45000,
      change: 8.2,
      icon: "🔥"
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      balance: 150.0,
      value: 21750,
      change: 0.1,
      icon: "💵"
    },
    {
      symbol: "BTC",
      name: "Bitcoin",
      balance: 0.01,
      value: 58250,
      change: -2.1,
      icon: "₿"
    }
  ];

  return (
    <div className="crypto-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">My Portfolio</h3>
        <span className="text-sm text-muted-foreground">3 assets</span>
      </div>
      
      <div className="space-y-3">
        {assets.map((asset, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-smooth cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-lg">
                {asset.icon}
              </div>
              <div>
                <div className="font-medium">{asset.symbol}</div>
                <div className="text-sm text-muted-foreground">{asset.name}</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-medium">KES {asset.value.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{asset.balance} {asset.symbol}</div>
            </div>
            
            <div className={`flex items-center space-x-1 text-sm ${
              asset.change >= 0 ? 'text-success' : 'text-danger'
            }`}>
              {asset.change >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(asset.change)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};