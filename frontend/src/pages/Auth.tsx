import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { NavLink } from "@/components/NavLink";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      await login(username, password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      await register(username, password);
      toast.success("Registration successful! Please sign in.");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 nepali-pattern">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Back link for mobile */}
        <NavLink to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </NavLink>

        <div className="text-center mb-6">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl gradient-primary mx-auto mb-3 flex items-center justify-center shadow-soft">
            <Calendar className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">शैक्षिक वर्ष योजना</h1>
          <p className="text-sm text-muted-foreground mt-1">Academic Year Planner</p>
        </div>

        <Card className="glass-card border-0 shadow-lg">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-3 px-4 md:px-6">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 h-10">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm">
                  Register
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="px-4 md:px-6 pb-6">
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="text-sm">Username</Label>
                    <Input
                      id="login-username"
                      name="username"
                      placeholder="Enter your username"
                      required
                      className="h-10 md:h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm">Password</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      required
                      className="h-10 md:h-11"
                    />
                  </div>
                  <Button
                    type="submit"
                   className="w-full h-10 md:h-11 gradient-accent text-secondary-foreground font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username" className="text-sm">Username</Label>
                    <Input
                      id="register-username"
                      name="username"
                      placeholder="Choose a username"
                      required
                      className="h-10 md:h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-sm">Password</Label>
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      placeholder="Min 8 characters"
                      required
                      minLength={8}
                      className="h-10 md:h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      required
                      className="h-10 md:h-11"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-10 md:h-11 gradient-accent text-secondary-foreground font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Nepali Academic Year Planning Made Simple
        </p>
      </div>
    </div>
  );
}
