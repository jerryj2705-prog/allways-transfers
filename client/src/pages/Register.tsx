import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function Register() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Account created successfully");
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo") || "/";
      window.location.href = returnTo;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create account");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    registerMutation.mutate({ name, email, password });
  };

  const handleGoogleSuccess = () => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo") || "/";
    window.location.href = returnTo;
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
            <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
            <CardDescription className="text-zinc-400">
              Sign up to book your chauffeur service
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Google Sign-Up Button */}
            <div className="mb-4">
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                text="signup_with"
              />
            </div>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-3 text-zinc-500">or sign up with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  autoComplete="name"
                  required
                />
              </div>
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
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 pr-10"
                    autoComplete="new-password"
                    required
                    minLength={8}
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-zinc-300">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
              <Button
                type="submit"
                className="w-full gold-gradient text-gold-foreground border-0 font-semibold"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create Account
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-zinc-400 text-sm">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-amber-500 hover:text-amber-400 font-medium"
                >
                  Sign in
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
