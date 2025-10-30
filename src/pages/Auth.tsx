import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Shield, Mail, Lock, User, Phone, Calendar, Globe, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation schemas
  const signInSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  const signUpSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
    username: z.string().min(3, "Username must be at least 3 characters").max(50),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    phone: z.string().min(10, "Please enter a valid phone number"),
    birthday: z.string().min(1, "Birthday is required"),
    country: z.string().min(1, "Country is required"),
  });

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password) && /[^a-zA-Z\d]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  }, [password]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return "bg-danger";
    if (passwordStrength < 50) return "bg-orange-500";
    if (passwordStrength < 75) return "bg-yellow-500";
    return "bg-success";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return "Weak";
    if (passwordStrength < 50) return "Fair";
    if (passwordStrength < 75) return "Good";
    return "Strong";
  };

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
    if (error) {
      if (error.message.includes('captcha')) {
        return toast({ 
          title: "CAPTCHA Required", 
          description: "Please disable CAPTCHA in Supabase Auth settings or contact support.", 
          variant: "destructive" 
        });
      }
      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
    }
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
    // Validate inputs
    const validation = signInSchema.safeParse({ email, password });
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
      toast({ 
        title: "Validation Error", 
        description: "Please check your inputs",
        variant: "destructive" 
      });
      return;
    }
    setErrors({});
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
        // Handle CAPTCHA error specifically
        if (error.message.includes('captcha')) {
          return toast({ 
            title: "CAPTCHA Required", 
            description: "Please disable CAPTCHA in Supabase Auth settings or contact support.", 
            variant: "destructive" 
          });
        }
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
    // Validate inputs
    const validation = signUpSchema.safeParse({ fullName, username, email, password, phone, birthday, country });
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
      toast({ 
        title: "Validation Error", 
        description: "Please check all required fields",
        variant: "destructive" 
      });
      return;
    }
    setErrors({});
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, username, phone, birthday, country },
      },
    });
    
    if (error) {
      setLoading(false);
      // Handle CAPTCHA error specifically
      if (error.message.includes('captcha')) {
        return toast({ 
          title: "CAPTCHA Required", 
          description: "Please disable CAPTCHA in Supabase Auth settings (Bot and Abuse Protection) or contact support.", 
          variant: "destructive" 
        });
      }
      return toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    }
    
    // Try to store profile if session already exists (email confirmations disabled)
    const userId = data?.user?.id;
    if (userId) {
      await supabase.from("profiles").upsert({ id: userId, display_name: fullName, full_name: fullName, username, phone, country }, { onConflict: "id" });
    }
    setLoading(false);
    toast({ title: "Check your email", description: "Confirm to finish sign up." });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-xl crypto-card border-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent" />
            <CardTitle className="text-2xl">WalletOS</CardTitle>
          </div>
          <CardDescription>Secure cryptocurrency trading platform</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Security Disclaimers */}
          <Alert className="mb-6 border-accent/20 bg-accent/5">
            <Shield className="h-4 w-4 text-accent" />
            <AlertDescription>
              <h4 className="font-medium text-accent mb-2">Important Security Information</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>This is not investment advice. Crypto trading involves risk.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>Your wallet is secured with industry-standard encryption.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>All transactions occur on Solana mainnet with real funds.</span>
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-4">
              <Button 
                variant="secondary" 
                onClick={handleGoogle} 
                disabled={googleLoading} 
                className="w-full transition-smooth hover:scale-[1.02]"
              >
                {googleLoading ? "Redirecting..." : "Continue with Google"}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input 
                    id="signin-email"
                    type="email" 
                    placeholder="you@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className={`transition-smooth ${errors.email ? 'border-danger' : ''}`}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-xs text-danger flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <Input 
                    id="signin-password"
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className={`transition-smooth ${errors.password ? 'border-danger' : ''}`}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  {errors.password && (
                    <p id="password-error" className="text-xs text-danger flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {errors.password}
                    </p>
                  )}
                </div>

                <Button 
                  onClick={handleSignIn} 
                  disabled={loading} 
                  className="w-full transition-smooth hover:scale-[1.02]"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                
                <Button 
                  type="button" 
                  variant="link" 
                  onClick={handleReset} 
                  disabled={resetLoading} 
                  className="justify-start px-0 text-sm"
                >
                  {resetLoading ? "Sending email..." : "Forgot password?"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input 
                    id="fullName"
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="Jane Doe"
                    className={`transition-smooth ${errors.fullName ? 'border-danger' : ''}`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-danger flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {errors.fullName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Username
                  </Label>
                  <Input 
                    id="username"
                    value={username} 
                    readOnly 
                    className="bg-muted"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="signup-email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input 
                    id="signup-email"
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="you@example.com"
                    className={`transition-smooth ${errors.email ? 'border-danger' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-xs text-danger flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {errors.email}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="signup-password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <Input 
                    id="signup-password"
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    className={`transition-smooth ${errors.password ? 'border-danger' : ''}`}
                  />
                  {password && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Progress value={passwordStrength} className="h-1.5" />
                        <span className={`text-xs font-medium ${
                          passwordStrength < 50 ? 'text-danger' : 
                          passwordStrength < 75 ? 'text-yellow-500' : 'text-success'
                        }`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Use 8+ characters with uppercase, lowercase, numbers & symbols
                      </p>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-xs text-danger flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Mobile Number
                  </Label>
                  <Input 
                    id="phone"
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder={`${countryCode ?? ''}7XXXXXXXX`}
                    className={`transition-smooth ${errors.phone ? 'border-danger' : ''}`}
                  />
                  {phoneCountryMismatch && (
                    <p className="text-xs text-yellow-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Number doesn't match country code ({countryCode})
                    </p>
                  )}
                  {errors.phone && (
                    <p className="text-xs text-danger flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {errors.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Birthday
                  </Label>
                  <Input 
                    id="birthday"
                    type="date" 
                    value={birthday} 
                    onChange={(e) => setBirthday(e.target.value)}
                    className={`transition-smooth ${errors.birthday ? 'border-danger' : ''}`}
                  />
                  {errors.birthday && (
                    <p className="text-xs text-danger flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {errors.birthday}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="country" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Country
                  </Label>
                  <Input 
                    id="country"
                    value={country} 
                    readOnly 
                    placeholder="Auto-detected"
                    className="bg-muted"
                  />
                </div>
              </div>

              <Alert className="border-accent/20 bg-accent/5">
                <Shield className="h-4 w-4 text-accent" />
                <AlertDescription className="text-xs">
                  Your mobile number will be used for transactions. Email and phone changes require support.
                  By creating an account, you acknowledge crypto trading risks and agree to our terms.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleSignUp} 
                disabled={loading || passwordStrength < 50} 
                className="w-full transition-smooth hover:scale-[1.02]"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
