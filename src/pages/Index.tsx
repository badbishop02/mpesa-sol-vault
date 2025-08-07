import { WalletHeader } from "@/components/WalletHeader";
import { BalanceCard } from "@/components/BalanceCard";
import { QuickActions } from "@/components/QuickActions";
import { CryptoPortfolio } from "@/components/CryptoPortfolio";
import { MpesaDeposit } from "@/components/MpesaDeposit";
import { CryptoTrading } from "@/components/CryptoTrading";
import { TransactionHistory } from "@/components/TransactionHistory";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <WalletHeader />
      
      <main className="container mx-auto p-6 space-y-6">
        {/* Hero Section with Balance */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BalanceCard />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
        
        {/* Portfolio and Actions */}
        <div className="grid lg:grid-cols-2 gap-6">
          <CryptoPortfolio />
          <div className="space-y-6">
            <MpesaDeposit />
          </div>
        </div>
        
        {/* Trading and History */}
        <div className="grid lg:grid-cols-2 gap-6">
          <CryptoTrading />
          <TransactionHistory />
        </div>
      </main>
    </div>
  );
};

export default Index;
