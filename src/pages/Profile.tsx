import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Profile | CryptoWallet";
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      const { data } = await supabase.from("profiles").select("display_name, avatar_url, phone").eq("id", userId).maybeSingle();
      setDisplayName(data?.display_name ?? "");
      setAvatarUrl(data?.avatar_url ?? "");
      setPhone(data?.phone ?? "");
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;
    const { error } = await supabase.from("profiles").upsert({ id: userId, display_name: displayName, avatar_url: avatarUrl }, { onConflict: "id" });
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Profile saved" });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto crypto-card border-0">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Manage your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm mb-1 block">Display name</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Jane Doe" />
            </div>
            <div>
              <label className="text-sm mb-1 block">Avatar URL</label>
              <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm mb-1 block">Mobile number (read-only)</label>
              <Input value={phone} disabled placeholder="2547XXXXXXXX" />
            </div>
            <div className="flex gap-3">
              <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
              <Button variant="outline" onClick={signOut}>Sign out</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
