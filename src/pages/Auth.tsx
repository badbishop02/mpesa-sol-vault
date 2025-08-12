import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [fullName, setFullName] = useState("");
const [username, setUsername] = useState("");
const [phone, setPhone] = useState("");
const [birthday, setBirthday] = useState("");
const [country, setCountry] = useState("");
const [otp, setOtp] = useState("");
const [needsPhoneVerification, setNeedsPhoneVerification] = useState(false);
const [loading, setLoading] = useState(false);

useEffect(() => {
  document.title = "Sign in | WalletOS";
  const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
    if (session) navigate("/", { replace: true });
  });
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) navigate("/", { replace: true });
  });
  // Detect country from IP (best effort)
  fetch("https://ipapi.co/json/")
    .then((r) => r.json())
    .then((d) => setCountry(d?.country_name || d?.country || ""))
    .catch(() => {});
  return () => sub.subscription.unsubscribe();
}, [navigate]);

const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 5;
const isRateLimited = (key: string) => {
  try {
    const raw = localStorage.getItem(key);
    const now = Date.now();
    const arr = raw ? (JSON.parse(raw) as number[]) : [];
    const fresh = arr.filter((t) => now - t < RATE_LIMIT_WINDOW);
    return fresh.length >= RATE_LIMIT_MAX;
  } catch {
    return false;
  }
};
const recordAttempt = (key: string) => {
  try {
    const raw = localStorage.getItem(key);
    const now = Date.now();
    const arr = raw ? (JSON.parse(raw) as number[]) : [];
    arr.push(now);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {}
};
const sanitize = (s: string) => s.replace(/[<>]/g, "").trim();

const handleSignIn = async () => {
  if (isRateLimited("auth_signin_attempts")) {
    toast({ title: "Too many attempts", description: "Please wait a few minutes and try again.", variant: "destructive" });
    return;
  }
  recordAttempt("auth_signin_attempts");
  setLoading(true);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  setLoading(false);
  if (error) return toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
  toast({ title: "Welcome back" });
};

const handleSignUp = async () => {
  if (!fullName || !email || !password || !phone || !birthday) {
    return toast({ title: "Missing information", description: "Please fill all required fields.", variant: "destructive" });
  }
  if (isRateLimited("auth_signup_attempts")) {
    return toast({ title: "Too many attempts", description: "Please wait a few minutes and try again.", variant: "destructive" });
  }
  recordAttempt("auth_signup_attempts");

  setLoading(true);
  const safeUsername = sanitize((email.split("@")[0] || "user").replace(/[^a-zA-Z0-9_\-]/g, ""));
  const safeFullName = sanitize(fullName);
  const safeCountry = sanitize(country);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: { username: safeUsername, full_name: safeFullName, birthday, country: safeCountry },
    },
  });
  if (error) {
    setLoading(false);
    return toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
  }

  // Request SMS verification for phone
  const { error: updErr } = await supabase.auth.updateUser({
    phone,
    data: { username: safeUsername, full_name: safeFullName, birthday, country: safeCountry },
  });
  setLoading(false);

  if (updErr) {
    return toast({ title: "Phone setup failed", description: updErr.message, variant: "destructive" });
  }

  setUsername(safeUsername);
  setNeedsPhoneVerification(true);
  if (data.user) {
    toast({ title: "Verify your phone", description: "We sent you an SMS code. Enter it below to verify." });
  }
};

const handleVerifyPhone = async () => {
  if (!otp || !phone) return toast({ title: "Enter the SMS code", variant: "destructive" });
  setLoading(true);
  const { data, error } = await supabase.auth.verifyOtp({ type: "sms", phone, token: otp });
  setLoading(false);
  if (error) return toast({ title: "Verification failed", description: error.message, variant: "destructive" });
  setNeedsPhoneVerification(false);
  setOtp("");
  toast({ title: "Phone verified", description: "You can now continue." });
};

  const handleResetPassword = async () => {
    if (!email) return toast({ title: "Enter your email first", variant: "destructive" });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) return toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    toast({ title: "Check your email", description: "Password reset link sent." });
  };

  const signInWithProvider = async (provider: "google" | "apple") => {
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/` } });
    if (error) toast({ title: "OAuth failed", description: error.message, variant: "destructive" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md crypto-card border-0">
        <CardHeader>
          <CardTitle>WalletOS</CardTitle>
          <CardDescription>Secure login and signup</CardDescription>
        </CardHeader>
        <CardContent>
<div className="grid grid-cols-1 gap-3 mb-4">
  <Button variant="secondary" onClick={() => signInWithProvider("google")}>Continue with Google</Button>
</div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-4">
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button onClick={handleSignIn} disabled={loading} className="w-full">{loading ? "Please wait" : "Sign In"}</Button>
              <Button variant="link" onClick={handleResetPassword} className="w-full">Forgot password?</Button>
            </TabsContent>

<TabsContent value="signup" className="space-y-4 mt-4">
  <div className="space-y-2">
    <Label htmlFor="fullName">Full Name</Label>
    <Input id="fullName" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
  </div>
  <div className="space-y-2">
    <Label htmlFor="username">Username</Label>
    <Input id="username" placeholder="Auto from email" value={username || (email.split("@")[0] || "").replace(/[^a-zA-Z0-9_\-]/g, "")} onChange={(e) => setUsername(e.target.value)} readOnly />
  </div>
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" placeholder="Email" value={email} onChange={(e) => { setEmail(e.target.value); setUsername((e.target.value.split("@")[0] || "").replace(/[^a-zA-Z0-9_\-]/g, "")); }} />
  </div>
  <div className="space-y-2">
    <Label htmlFor="password">Password</Label>
    <Input id="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
  </div>
  <div className="space-y-2">
    <Label htmlFor="phone">Mobile Number</Label>
    <Input id="phone" placeholder="+2547xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
    <p className="text-xs text-muted-foreground">We’ll send an SMS code to verify your number.</p>
  </div>
  <div className="space-y-2">
    <Label htmlFor="birthday">Birthday</Label>
    <Input id="birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
  </div>
  <div className="space-y-2">
    <Label htmlFor="country">Country</Label>
    <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Auto from IP" readOnly />
  </div>
  <Button onClick={handleSignUp} disabled={loading} className="w-full">{loading ? "Please wait" : "Create Account"}</Button>

  {needsPhoneVerification && (
    <div className="space-y-2">
      <Label htmlFor="otp">Enter SMS Code</Label>
      <Input id="otp" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} />
      <Button onClick={handleVerifyPhone} disabled={loading} className="w-full">Verify Phone</Button>
    </div>
  )}
</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
