import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus, MessageCircle, Settings, Zap } from "lucide-react";

interface TelegramSource {
  id: string;
  telegram_link: string;
  is_active: boolean;
  auto_execute: boolean;
  created_at: string;
}

const TelegramBot = () => {
  const { toast } = useToast();
  const [sources, setSources] = useState<TelegramSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLink, setNewLink] = useState("");
  const [autoExecute, setAutoExecute] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    document.title = "Telegram Bot | WalletOS";
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const { data, error } = await supabase
        .from('telegram_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSources(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading Telegram sources",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addSource = async () => {
    if (!newLink.trim()) {
      toast({
        title: "Invalid link",
        description: "Please enter a valid Telegram link",
        variant: "destructive"
      });
      return;
    }

    setAdding(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('telegram_sources')
        .insert({
          user_id: userData.user.id,
          telegram_link: newLink.trim(),
          is_active: true,
          auto_execute: autoExecute
        });

      if (error) throw error;

      setNewLink("");
      setAutoExecute(false);
      toast({
        title: "Telegram source added",
        description: "Successfully added Telegram channel/group"
      });
      
      fetchSources();
    } catch (error: any) {
      toast({
        title: "Failed to add source",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAdding(false);
    }
  };

  const updateSource = async (id: string, updates: Partial<TelegramSource>) => {
    try {
      const { error } = await supabase
        .from('telegram_sources')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setSources(sources.map(source => 
        source.id === id ? { ...source, ...updates } : source
      ));

      toast({
        title: "Source updated",
        description: "Telegram source settings have been updated"
      });
    } catch (error: any) {
      toast({
        title: "Failed to update source",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteSource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('telegram_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSources(sources.filter(source => source.id !== id));
      
      toast({
        title: "Source deleted",
        description: "Telegram source has been removed"
      });
    } catch (error: any) {
      toast({
        title: "Failed to delete source",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const testWebhook = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('telegram-ingest', {
        body: {
          message: "🟢 BUY SOL - Test signal from WalletOS",
          telegram_link: "https://t.me/test_channel",
          user_id: "test"
        }
      });

      if (error) throw error;

      toast({
        title: "Test signal sent",
        description: `Signal detected: ${data.signal?.type} ${data.signal?.token_mint}`,
      });
    } catch (error: any) {
      toast({
        title: "Test failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading Telegram settings...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold crypto-gradient bg-clip-text text-transparent">
              Telegram Bot
            </h1>
            <p className="text-muted-foreground">
              Connect Telegram channels for automated trade signal execution
            </p>
          </div>

          {/* Info Alert */}
          <Alert>
            <MessageCircle className="h-4 w-4" />
            <AlertDescription>
              Add Telegram channels or groups that share trading signals. Our bot will parse messages for trade signals 
              and automatically execute them if auto-execute is enabled. Supported patterns: "BUY/SELL [TOKEN]", "🟢/🔴 [TOKEN]"
            </AlertDescription>
          </Alert>

          {/* Add New Source */}
          <Card className="crypto-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Telegram Source
              </CardTitle>
              <CardDescription>
                Add a Telegram channel or group link to monitor for trade signals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="telegram-link">Telegram Link</Label>
                <Input
                  id="telegram-link"
                  type="url"
                  placeholder="https://t.me/your_channel_or_group"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-execute"
                  checked={autoExecute}
                  onCheckedChange={setAutoExecute}
                />
                <Label htmlFor="auto-execute" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Enable auto-execute for this source
                </Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={addSource} disabled={adding} className="flex-1">
                  {adding ? "Adding..." : "Add Source"}
                </Button>
                <Button variant="outline" onClick={testWebhook}>
                  Test Webhook
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Sources */}
          <div className="space-y-4">
            {sources.length === 0 ? (
              <Card className="crypto-card border-0">
                <CardContent className="p-6 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No Telegram sources configured.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add your first Telegram channel or group above to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              sources.map((source) => (
                <Card key={source.id} className="crypto-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold truncate max-w-md">
                            {source.telegram_link}
                          </h3>
                          <div className="flex gap-2">
                            <Badge variant={source.is_active ? "default" : "secondary"}>
                              {source.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {source.auto_execute && (
                              <Badge variant="outline" className="text-accent">
                                <Zap className="w-3 h-3 mr-1" />
                                Auto-execute
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Added on {new Date(source.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateSource(source.id, { is_active: !source.is_active })}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateSource(source.id, { auto_execute: !source.auto_execute })}
                          className={source.auto_execute ? "bg-accent/10" : ""}
                        >
                          <Zap className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteSource(source.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TelegramBot;
