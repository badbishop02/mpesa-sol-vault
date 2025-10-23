import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Activity, DollarSign, Target, Clock, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

interface PortfolioData {
  total_value: number;
  total_invested: number;
  unrealized_pnl: number;
  pnl_percentage: number;
  holdings: any[];
  allocations: any[];
  recent_executions: any[];
  metrics: {
    total_trades: number;
    completed_trades: number;
    failed_trades: number;
    success_rate: number;
  };
}

const Portfolio = () => {
  const { toast } = useToast();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    document.title = "Portfolio | WalletOS";
    fetchPortfolio();

    // Set up real-time updates
    const channel = supabase
      .channel('portfolio-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'portfolio_holdings'
      }, () => {
        fetchPortfolio();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trade_executions'
      }, () => {
        fetchPortfolio();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPortfolio = async (showRefreshToast = false) => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase.functions.invoke('portfolio-tracker');

      if (error) throw error;
      setPortfolio(data.portfolio);
      
      if (showRefreshToast) {
        toast({
          title: "Refreshed",
          description: "Portfolio updated successfully"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error loading portfolio",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'failed': return 'bg-destructive';
      case 'pending': return 'bg-accent';
      default: return 'bg-muted';
    }
  };

  const formatTokenAmount = (amount: number, decimals = 6) => {
    return amount.toFixed(decimals);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Loading portfolio...</p>
          </div>
        </div>
      </>
    );
  }

  if (!portfolio) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background">
          <main className="container mx-auto p-6">
            <Card className="crypto-card border-0">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No portfolio data available.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start trading to see your portfolio here.
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold crypto-gradient bg-clip-text text-transparent">
                  Portfolio
                </h1>
                <p className="text-muted-foreground">
                  Track your investments and trading performance
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchPortfolio(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="crypto-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Total Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(portfolio.total_value)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="crypto-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-accent/10">
                    <Target className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Invested</p>
                    <p className="text-2xl font-bold">{formatCurrency(portfolio.total_invested)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="crypto-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${portfolio.unrealized_pnl >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    {portfolio.unrealized_pnl >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-success" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Unrealized P&L</p>
                    <p className={`text-2xl font-bold ${portfolio.unrealized_pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(portfolio.unrealized_pnl)}
                    </p>
                    <p className={`text-sm ${portfolio.unrealized_pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatPercentage(portfolio.pnl_percentage)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="crypto-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Success Rate</p>
                    <p className="text-2xl font-bold">{portfolio.metrics.success_rate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">
                      {portfolio.metrics.completed_trades}/{portfolio.metrics.total_trades} trades
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="holdings" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
              <TabsTrigger value="allocations">Allocations</TabsTrigger>
              <TabsTrigger value="executions">Recent Trades</TabsTrigger>
            </TabsList>

            <TabsContent value="holdings" className="space-y-4">
              {portfolio.holdings.length === 0 ? (
                <Card className="crypto-card border-0">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No holdings yet.</p>
                  </CardContent>
                </Card>
              ) : (
                portfolio.holdings.map((holding, index) => (
                  <Card key={index} className="crypto-card border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{holding.token_mint}</h3>
                          <p className="text-muted-foreground">Amount: {Number(holding.amount).toFixed(6)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(Number(holding.total_invested) + Number(holding.unrealized_pnl))}</p>
                          <p className={`text-sm ${Number(holding.unrealized_pnl) >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {formatCurrency(Number(holding.unrealized_pnl))}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="allocations" className="space-y-4">
              {portfolio.allocations.length === 0 ? (
                <Card className="crypto-card border-0">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No allocations yet.</p>
                  </CardContent>
                </Card>
              ) : (
                portfolio.allocations.map((allocation, index) => (
                  <Card key={index} className="crypto-card border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{allocation.token_mint}</h3>
                          <p className="text-muted-foreground">Amount: {allocation.amount.toFixed(6)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(allocation.value)}</p>
                          <p className="text-sm text-muted-foreground">{allocation.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="mt-3 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${Math.min(allocation.percentage, 100)}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="executions" className="space-y-4">
              {portfolio.recent_executions.length === 0 ? (
                <Card className="crypto-card border-0">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No recent trades.</p>
                  </CardContent>
                </Card>
              ) : (
                portfolio.recent_executions.map((execution) => (
                  <Card key={execution.id} className="crypto-card border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Badge className={getStatusColor(execution.status)}>
                            {execution.status}
                          </Badge>
                          <div>
                            <h3 className="font-semibold">
                              {execution.trade_type.toUpperCase()} {execution.token_mint}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Amount: {Number(execution.amount).toFixed(6)}
                            </p>
                            {execution.source_type !== 'manual' && (
                              <p className="text-xs text-muted-foreground">
                                Source: {execution.source_type}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {new Date(execution.created_at).toLocaleDateString()}
                          </div>
                          {execution.fee_amount > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Fee: {formatCurrency(Number(execution.fee_amount))}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
    </>
  );
};

export default Portfolio;