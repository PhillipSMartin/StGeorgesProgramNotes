import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminLogin, useAdminSession } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [_, setLocation] = useLocation();
  const { data: session, isLoading: sessionLoading } = useAdminSession();
  const loginMutation = useAdminLogin();
  const { toast } = useToast();

  useEffect(() => {
    if (session?.authenticated) {
      setLocation("/admin/dashboard");
    }
  }, [session?.authenticated, setLocation]);

  if (sessionLoading || session?.authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync({ password });
      setLocation("/admin/dashboard");
    } catch (error: any) {
      let description = "Invalid password";
      try {
        const parsed = JSON.parse(error.message.replace(/^\d+:\s*/, ""));
        description = parsed.message || description;
      } catch {
        description = error.message || description;
      }
      toast({
        title: "Login Failed",
        description,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="font-serif text-2xl" data-testid="text-admin-login-title">Admin Portal</CardTitle>
          <CardDescription>St. George's Choral Society</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-admin-password"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending || !password}
              data-testid="button-admin-login"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
