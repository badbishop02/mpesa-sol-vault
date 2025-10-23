import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Users, Clock, RefreshCw, Filter } from "lucide-react";
import { Navbar } from "@/components/Navbar";

interface Whale {
  id: string;
  wallet_address: string;
  score: number;
  win_rate: number;
  avg_hold_time: number;
  realized_pnl: number;
  trade_count: number;
  follower_count: number;
}

interface Follow {
  id: string;
  whale_id: string;
  sizing_type: string;
  sizing_value: number;
  max_slippage: number;
  whales: Whale;
}

const Whales = () => {
  const { toast } = useToast();
  const [whales, setWhales] = useState<Whale[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<string[]>([]);

  // Copy trade settings
  const [sizingType, setSizingType] = useState("percent");
  const [sizingValue, setSizingValue] = useState("1.0");
  const [maxSlippage, setMaxSlippage] = useState("0.05");
  const [minScore, setMinScore] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    document.title = "Whales | WalletOS";
    fetchWhales();
    fetchFollows();
  }, []);

  const fetchWhales = async (showRefreshToast = false) => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase.functions.invoke('whale-tracker', {
        body: { mock: true } // Enable mock mode for development
      });

      if (error) throw error;
      setWhales(data.whales);
      
      if (showRefreshToast) {
        toast({
          title: "Refreshed",
          description: "Whale data updated successfully"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error loading whales",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchFollows = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('copy-trading');

      if (error) throw error;
      setFollows(data.follows || []);
      setFollowing(data.follows?.map((f: Follow) => f.whale_id) || []);
    } catch (error: any) {
      console.error('Error fetching follows:', error);
    }
  };

  const handleFollow = async (whaleId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('copy-trading', {
        body: {
          whale_id: whaleId,
          sizing_type: sizingType,
          sizing_value: parseFloat(sizingValue),
          max_slippage: parseFloat(maxSlippage)
        }
      });

      if (error) throw error;

      setFollowing([...following, whaleId]);
      toast({
        title: "Successfully following whale",
        description: "Copy trading enabled for this whale"
      });
      
      fetchFollows();
    } catch (error: any) {
      toast({
        title: "Failed to follow whale",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleUnfollow = async (whaleId: string) => {
    try {
      const { error } = await supabase.functions.invoke('copy-trading', {
        method: 'DELETE',
        body: { whale_id: whaleId }
      });

      if (error) throw error;

      setFollowing(following.filter(id => id !== whaleId));
      toast({
        title: "Unfollowed whale",
        description: "Copy trading disabled for this whale"
      });
      
      fetchFollows();
    } catch (error: any) {
      toast({
        title: "Failed to unfollow whale",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPnL = (pnl: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(pnl);
  };

  const filteredWhales = whales.filter(whale => {
    if (minScore && whale.score < parseFloat(minScore)) return false;
    return true;
  });

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background">
          <main className="container mx-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading whales...</div>
            </div>
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
                  Whale Tracker
                </h1>
                <p className="text-muted-foreground">
                  Follow top performing wallets and copy their trades automatically
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchWhales(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

          <Tabs defaultValue="discover" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="discover">Discover Whales</TabsTrigger>
              <TabsTrigger value="following">Following ({follows.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-6">
              {/* Filters */}
              <Card className="crypto-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label>Minimum Score</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={minScore}
                        onChange={(e) => setMinScore(e.target.value)}
                        placeholder="Filter by min score (e.g., 7.5)"
                      />
                    </div>
                    <Button variant="outline" onClick={() => setMinScore("")}>
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Copy Trade Settings */}
              <Card className="crypto-card border-0">
                <CardHeader>
                  <CardTitle>Copy Trade Settings</CardTitle>
                  <CardDescription>Configure how you want to copy trades</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Sizing Type</Label>
                    <select 
                      className="w-full mt-1 p-2 border rounded-md bg-background"
                      value={sizingType}
                      onChange={(e) => setSizingType(e.target.value)}
                    >
                      <option value="percent">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <Label>Sizing Value</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={sizingValue}
                      onChange={(e) => setSizingValue(e.target.value)}
                      placeholder="1.0"
                    />
                  </div>
                  <div>
                    <Label>Max Slippage (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={maxSlippage}
                      onChange={(e) => setMaxSlippage(e.target.value)}
                      placeholder="0.05"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Whales List */}
              <div className="grid gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredWhales.length} of {whales.length} whales
                </div>
                {filteredWhales.map((whale) => (
                  <Card key={whale.id} className="crypto-card border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div>
                              <h3 className="font-semibold">{formatAddress(whale.wallet_address)}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  Score: {whale.score.toFixed(1)}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  <Users className="w-3 h-3 mr-1" />
                                  {whale.follower_count} followers
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-success" />
                              <div>
                                <div className="text-muted-foreground">Win Rate</div>
                                <div className="font-semibold">{(whale.win_rate * 100).toFixed(1)}%</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-primary" />
                              <div>
                                <div className="text-muted-foreground">Avg Hold</div>
                                <div className="font-semibold">{whale.avg_hold_time.toFixed(1)}h</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingDown className="w-4 h-4 text-accent" />
                              <div>
                                <div className="text-muted-foreground">Realized PnL</div>
                                <div className="font-semibold">{formatPnL(whale.realized_pnl)}</div>
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Trades</div>
                              <div className="font-semibold">{whale.trade_count}</div>
                            </div>
                          </div>
                        </div>

                        <div className="ml-4">
                          {following.includes(whale.id) ? (
                            <Button
                              variant="outline"
                              onClick={() => handleUnfollow(whale.id)}
                              className="min-w-24"
                            >
                              Unfollow
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleFollow(whale.id)}
                              className="min-w-24"
                            >
                              Follow
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="following" className="space-y-4">
              {follows.length === 0 ? (
                <Card className="crypto-card border-0">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">You're not following any whales yet.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Go to the Discover tab to start following top performers.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                follows.map((follow) => (
                  <Card key={follow.id} className="crypto-card border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold mb-2">
                            {formatAddress(follow.whales.wallet_address)}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Sizing:</span>{' '}
                              {follow.sizing_value} {follow.sizing_type}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Max Slippage:</span>{' '}
                              {(follow.max_slippage * 100).toFixed(1)}%
                            </div>
                            <div>
                              <span className="text-muted-foreground">Score:</span>{' '}
                              {follow.whales.score.toFixed(1)}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleUnfollow(follow.whale_id)}
                        >
                          Unfollow
                        </Button>
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

export default Whales;