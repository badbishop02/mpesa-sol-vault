import { ArrowUpRight, ArrowDownLeft, Plus, Repeat } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Transaction {
  id: string;
  type: "deposit" | "buy" | "sell" | "swap";
  amount: number;
  crypto?: string;
  cryptoAmount?: number;
  status: "completed" | "pending" | "failed";
  timestamp: string;
}

export const TransactionHistory = () => {
  const transactions: Transaction[] = [
    {
      id: "1",
      type: "deposit",
      amount: 50000,
      status: "completed",
      timestamp: "2 hours ago"
    },
    {
      id: "2",
      type: "buy",
      amount: 30000,
      crypto: "SOL",
      cryptoAmount: 1.67,
      status: "completed",
      timestamp: "3 hours ago"
    },
    {
      id: "3",
      type: "buy",
      amount: 15000,
      crypto: "USDT",
      cryptoAmount: 103.45,
      status: "pending",
      timestamp: "1 day ago"
    },
    {
      id: "4",
      type: "deposit",
      amount: 25000,
      status: "completed",
      timestamp: "2 days ago"
    }
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <Plus className="h-4 w-4 text-success" />;
      case "buy":
        return <ArrowUpRight className="h-4 w-4 text-primary" />;
      case "sell":
        return <ArrowDownLeft className="h-4 w-4 text-danger" />;
      case "swap":
        return <Repeat className="h-4 w-4 text-accent" />;
      default:
        return <Plus className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-success";
      case "pending":
        return "text-yellow-500";
      case "failed":
        return "text-danger";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className="crypto-card border-0">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Your latest wallet activity
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 crypto-scrollbar max-h-96 overflow-y-auto">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-smooth"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <div className="font-medium capitalize">
                    {transaction.type} 
                    {transaction.crypto && ` ${transaction.crypto}`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {transaction.timestamp}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-medium">
                  KES {transaction.amount.toLocaleString()}
                </div>
                {transaction.cryptoAmount && (
                  <div className="text-sm text-muted-foreground">
                    {transaction.cryptoAmount} {transaction.crypto}
                  </div>
                )}
                <div className={`text-xs capitalize ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};