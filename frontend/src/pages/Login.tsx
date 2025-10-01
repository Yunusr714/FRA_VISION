import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { AuthApi } from "@/lib/api";

const Login = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Signup
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPhone, setSPhone] = useState("");
  const [sUsername, setSUsername] = useState("");
  const [sPassword, setSPassword] = useState("");
  const [sConfirm, setSConfirm] = useState("");
  const [sState, setSState] = useState<number | "">("");
  const [sDistrict, setSDistrict] = useState<number | "">("");
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [signupError, setSignupError] = useState("");

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLogin(true);
    setLoginError("");
    try {
      const ok = await login(username, password);
      if (ok) {
        toast({ title: "Login Successful", description: "Welcome to FRA Atlas" });
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setLoginError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    if (sPassword !== sConfirm) {
      setSignupError("Passwords do not match");
      return;
    }
    setLoadingSignup(true);
    try {
      const payload = {
        username: sUsername.trim(),
        password: sPassword,
        name: sName.trim(),
        email: sEmail.trim(),
        phone: sPhone.trim(),
        state_id: sState === "" ? undefined : Number(sState),
        district_id: sDistrict === "" ? undefined : Number(sDistrict)
      };
      const { token, user } = await AuthApi.registerCitizen(payload);
      // Accept auth after signup
      useAuthStore.getState().acceptAuth(user, token);
      toast({ title: "Account created", description: "Welcome to FRA Atlas" });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setSignupError(err?.message || "Signup failed. Please try again.");
    } finally {
      setLoadingSignup(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-2">
          <div className="flex justify-center items-center space-x-4 mb-4">
            <img src="/emblem.png" alt="Emblem" style={{ width: "48px", height: "48px" }} />
          </div>
          <h1 className="text-2xl font-bold text-primary">FRA Atlas</h1>
          <p className="text-muted-foreground">Forest Rights Act Decision Support System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("auth.welcome", { defaultValue: "Welcome" })}</CardTitle>
            <CardDescription>Access the AI-powered forest rights management platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Signup</TabsTrigger>
              </TabsList>

              {/* LOGIN */}
              <TabsContent value="login" className="space-y-4 pt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">{t("auth.username", { defaultValue: "Username" })}</Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("auth.password", { defaultValue: "Password" })}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  {loginError && (
                    <Alert variant="destructive">
                      <AlertDescription>{loginError}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={loadingLogin}>
                    {loadingLogin ? "Signing in..." : t("auth.login", { defaultValue: "Login" })}
                  </Button>
                </form>
              </TabsContent>

              {/* SIGNUP (Citizen) */}
              <TabsContent value="signup" className="space-y-4 pt-4">
                <form onSubmit={handleSignup} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={sName} onChange={(e) => setSName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input value={sUsername} onChange={(e) => setSUsername(e.target.value)} required />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Email</Label>
                      <Input type="email" value={sEmail} onChange={(e) => setSEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Phone</Label>
                      <Input value={sPhone} onChange={(e) => setSPhone(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" value={sPassword} onChange={(e) => setSPassword(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm Password</Label>
                      <Input type="password" value={sConfirm} onChange={(e) => setSConfirm(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>State ID (optional)</Label>
                      <Input
                        type="number"
                        value={sState as any}
                        onChange={(e) => setSState(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g., 8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>District ID (optional)</Label>
                      <Input
                        type="number"
                        value={sDistrict as any}
                        onChange={(e) => setSDistrict(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g., 108"
                      />
                    </div>
                  </div>

                  {signupError && (
                    <Alert variant="destructive">
                      <AlertDescription>{signupError}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={loadingSignup}>
                    {loadingSignup ? "Creating..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardContent>
            {/* Language toggle */}
            <div className="flex justify-center mt-4 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => i18n.changeLanguage("en")}
                className={i18n.language === "en" ? "bg-muted" : ""}
              >
                English
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => i18n.changeLanguage("hi")}
                className={i18n.language === "hi" ? "bg-muted" : ""}
              >
                हिंदी
              </Button>
            </div>
            {/* Footer links */}
            <div className="text-center mt-6 space-x-4 text-sm">
              <Link to="/help" className="text-muted-foreground hover:text-foreground">
                Help & Support
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link to="/" className="text-muted-foreground hover:text-foreground">
                Back to Home
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link to="/register" className="text-muted-foreground hover:text-foreground">
                Register as Citizen
              </Link>
            </div>
            {/* Security note */}
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Secured by Government of India</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;