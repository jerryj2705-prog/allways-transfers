import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Signed in successfully");
      // Check if there's a return URL
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo") || "/";
      window.location.href = returnTo;
    },
    onError: (error) => {
      toast.error(error.message || "Invalid email or password");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    loginMutation.mutate({ email, password, rememberMe });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png"
              alt="All Ways Transfers"
              className="h-16 mx-auto mb-4"
            />
          </a>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Sign In</CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your email and password to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="border-zinc-600 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm text-zinc-400 cursor-pointer select-none"
                >
                  Remember me for 30 days
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full gold-gradient text-gold-foreground border-0 font-semibold"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-zinc-400 text-sm">
                Don't have an account?{" "}
                <button
                  onClick={() => navigate("/register")}
                  className="text-amber-500 hover:text-amber-400 font-medium"
                >
                  Create one
                </button>
              </p>
            </div>

            <div className="mt-4 text-center">
              <a href="/" className="text-zinc-500 hover:text-zinc-400 text-sm">
                Back to Home
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
