import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    toast({ title: "Welcome back" });
  };

  const handleSignUp = async () => {
    setLoading(true);
    const username = (email.split("@")[0] || "user").replace(/[^a-zA-Z0-9_\-]/g, "");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { username },
      },
    });
    setLoading(false);
    if (error) return toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    if (data.user) {
      toast({ title: "Check your email", description: "Confirm to finish sign up." });
    }
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
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button variant="secondary" onClick={() => signInWithProvider("google")}>Continue with Google</Button>
            <Button variant="secondary" onClick={() => signInWithProvider("apple")}>Continue with Apple</Button>
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
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button onClick={handleSignUp} disabled={loading} className="w-full">{loading ? "Please wait" : "Create Account"}</Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
