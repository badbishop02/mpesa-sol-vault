import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Signup extras
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState<string | null>(null);

  const phoneCountryMismatch = useMemo(() => {
    if (!countryCode || !phone) return false;
    const cc = countryCode.replace("+", "");
    return !phone.replace(/\D/g, "").startsWith(cc);
  }, [countryCode, phone]);

  useEffect(() => {
    document.title = "Sign in | WalletOS";
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/", { replace: true });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  // Auto username from email
  useEffect(() => {
    if (email.includes("@")) setUsername(email.split("@")[0]);
  }, [email]);

  // Geo-IP for country
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const info = await res.json();
        setCountry(info?.country_name || "");
        setCountryCode(info?.country_calling_code || null);
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    setGoogleLoading(false);
    if (error) toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
  };

  const handleReset = async () => {
    if (!email) return toast({ title: "Enter your email first" });
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setResetLoading(false);
    if (error) return toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    toast({ title: "Email sent", description: "Check your inbox to reset password." });
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      // Check rate limit before attempting
      const identifier = email.toLowerCase();
      const rateLimitCheck = await supabase.functions.invoke('auth-rate-limiter', {
        body: { action: 'check_rate_limit', identifier }
      });

      if (rateLimitCheck.data && !rateLimitCheck.data.allowed) {
        const lockoutTime = new Date(rateLimitCheck.data.lockoutUntil).toLocaleTimeString();
        return toast({ 
          title: "Account Locked", 
          description: `Too many failed attempts. Try again after ${lockoutTime}`, 
          variant: "destructive" 
        });
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        return toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      }

      // Record successful auth to clear lockout
      await supabase.functions.invoke('auth-rate-limiter', {
        body: { action: 'record_success', identifier }
      });
      
      // Generate wallet on first login if needed
      if (data.user) {
        try {
          await supabase.functions.invoke('wallet-generator', {
            body: { user_id: data.user.id }
          });
        } catch (walletError) {
          console.log('Wallet generation handled separately');
        }
      }
      
      toast({ title: "Welcome back" });
    } catch (err) {
      toast({ title: "Sign in failed", description: "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!fullName || !username || !email || !password || !phone || !birthday || !country) {
      return toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, username, phone, birthday, country },
      },
    });
    // Try to store profile if session already exists (email confirmations disabled)
    const userId = data?.user?.id;
    if (userId && !error) {
      await supabase.from("profiles").upsert({ id: userId, display_name: fullName, full_name: fullName, username, phone, country }, { onConflict: "id" });
    }
    setLoading(false);
    if (error) return toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    toast({ title: "Check your email", description: "Confirm to finish sign up." });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-xl crypto-card border-0">
        <CardHeader>
          <CardTitle>WalletOS</CardTitle>
          <CardDescription>Secure login and signup</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Security Disclaimers */}
          <div className="mb-6 p-4 bg-accent/5 border border-accent/20 rounded-lg">
            <h4 className="font-medium text-accent mb-2">📝 Important Disclaimers</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• This is not investment advice. Crypto trading involves risk. Trade responsibly.</li>
              <li>• Your wallet is secured with industry-standard encryption.</li>
              <li>• All transactions occur on Solana mainnet with real funds.</li>
              <li>• M-Pesa deposits go to Paybill 400200, Account 20758.</li>
            </ul>
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-4">
              <Button variant="secondary" onClick={handleGoogle} disabled={googleLoading} className="w-full">
                {googleLoading ? "Redirecting..." : "Continue with Google"}
              </Button>
              <div className="grid gap-3 mt-2">
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button onClick={handleSignIn} disabled={loading} className="w-full">{loading ? "Please wait" : "Sign In"}</Button>
                <Button type="button" variant="link" onClick={handleReset} disabled={resetLoading} className="justify-start px-0">
                  {resetLoading ? "Sending..." : "Forgot password?"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
                </div>
                <div>
                  <Label>Username</Label>
                  <Input value={username} readOnly />
                </div>
                <div className="md:col-span-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="md:col-span-2">
                  <Label>Password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div>
                  <Label>Mobile Number</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={`${countryCode ?? ''}7XXXXXXXX`} />
                  {phoneCountryMismatch && (
                    <p className="text-xs text-muted-foreground mt-1">Number does not match your country code ({countryCode}).</p>
                  )}
                </div>
                <div>
                  <Label>Birthday</Label>
                  <Input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>Country</Label>
                  <Input value={country} readOnly placeholder="Auto-detected" />
                </div>
              </div>

              <div className="text-xs text-muted-foreground border border-border rounded-md p-3">
                Your mobile number will be used for transactions. Please ensure it is correct. Email and mobile number changes require contacting support.
                By creating an account, you acknowledge that you understand the risks of cryptocurrency trading and agree to our terms.
              </div>

              <Button onClick={handleSignUp} disabled={loading} className="w-full">{loading ? "Please wait" : "Create Account"}</Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
