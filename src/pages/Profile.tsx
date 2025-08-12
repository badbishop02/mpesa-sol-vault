import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WalletHeader } from "@/components/WalletHeader";
import { useWallet } from "@solana/wallet-adapter-react";

const Profile = () => {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otp, setOtp] = useState("");
  const { publicKey } = useWallet();

  useEffect(() => {
    document.title = "Profile | WalletOS";
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

  const sendPhoneOtp = async () => {
    if (!phone) return toast({ title: "No phone number on file", description: "Contact support to update.", variant: "destructive" });
    setSendingOtp(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setSendingOtp(false);
    if (error) return toast({ title: "OTP send failed", description: error.message, variant: "destructive" });
    toast({ title: "OTP sent", description: `Code sent to ${phone}` });
  };

  const verifyPhoneOtp = async () => {
    if (!otp || !phone) return;
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({ type: "sms", token: otp, phone });
    setVerifying(false);
    if (error) return toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    toast({ title: "Phone verified" });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-background">
      <WalletHeader />
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
              <div className="flex gap-2 mt-2">
                <Button variant="secondary" onClick={sendPhoneOtp} disabled={!phone || sendingOtp}>
                  {sendingOtp ? "Sending..." : "Send OTP"}
                </Button>
                <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" />
                <Button onClick={verifyPhoneOtp} disabled={!otp || verifying}>{verifying ? "Verifying..." : "Verify"}</Button>
              </div>
            </div>
            <div>
              <label className="text-sm mb-1 block">Connected Wallet</label>
              <Input value={publicKey ? publicKey.toBase58() : "No wallet connected"} disabled />
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
