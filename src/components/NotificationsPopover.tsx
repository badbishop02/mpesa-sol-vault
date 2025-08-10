import { useEffect, useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/user";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  created_at: string;
  status?: string;
}

export const NotificationsPopover = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const userId = useMemo(() => getUserId(), []);

  useEffect(() => {
    const fetchInitial = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("id, created_at, type, amount_kes, status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      const mapped: NotificationItem[] = (data || []).map((t) => ({
        id: t.id as string,
        title: `${String(t.type).toUpperCase()} ${t.status === "completed" ? "successful" : t.status}`,
        description: `${t.type === "deposit" ? "Deposit" : t.type} of KES ${Number(t.amount_kes || 0).toLocaleString()}`,
        created_at: String(t.created_at),
        status: String(t.status),
      }));
      setItems(mapped);
      setUnread(mapped.length);
    };

    fetchInitial();

    const channel = supabase
      .channel("txn-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` },
        (payload) => {
          const t = payload.new as any;
          const newItem: NotificationItem = {
            id: t.id,
            title: `${String(t.type).toUpperCase()} ${t.status === "completed" ? "successful" : t.status}`,
            description: `${t.type === "deposit" ? "Deposit" : t.type} of KES ${Number(t.amount_kes || 0).toLocaleString()}`,
            created_at: String(t.created_at),
            status: String(t.status),
          };
          setItems((prev) => [newItem, ...prev].slice(0, 20));
          setUnread((c) => c + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setUnread(0);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute -top-1 -right-1 h-3 w-3 bg-danger rounded-full"></span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div className="font-medium">Notifications</div>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
        <ScrollArea className="h-80">
          <ul className="divide-y divide-border">
            {items.length === 0 ? (
              <li className="p-4 text-sm text-muted-foreground">No notifications yet.</li>
            ) : (
              items.map((n) => (
                <li key={n.id} className="p-4 hover:bg-secondary/30 transition-smooth">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
                  <div className="text-sm mt-1">{n.description}</div>
                </li>
              ))
            )}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
