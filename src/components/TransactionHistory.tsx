import { ArrowUpRight, ArrowDownLeft, Plus, Repeat } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/user";


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
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const userId = getUserId();
    const fetchTx = async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (!error) {
        setTransactions(
          (data || []).map((d: any) => ({
            id: d.id,
            type: d.type,
            amount: Number(d.amount_kes),
            crypto: d.crypto_symbol ?? undefined,
            cryptoAmount: d.crypto_amount ?? undefined,
            status: d.status,
            timestamp: new Date(d.created_at).toLocaleString(),
          })) as Transaction[]
        );
      }
    };

    fetchTx();

    const channel = supabase
      .channel("transactions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` },
        () => fetchTx()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


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