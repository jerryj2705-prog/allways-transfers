import { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle } from "lucide-react";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const token = useMemo(() => new URLSearchParams(search).get("token") || "", [search]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: (data) => {
      setSuccess(true);
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reset password. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    resetPasswordMutation.mutate({ token, password });
  };

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
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
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-900/30 flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-amber-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Invalid Reset Link</CardTitle>
              <CardDescription className="text-zinc-400">
                This password reset link is missing or invalid. Please request a new one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/forgot-password")}
                  className="w-full gold-gradient text-gold-foreground border-0 font-semibold"
                >
                  Request New Reset Link
                </Button>
                <Button
                  onClick={() => navigate("/login")}
                  variant="outline"
                  className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Back to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <CardTitle className="text-2xl font-bold text-white">
              {success ? "Password Reset" : "Set New Password"}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {success
                ? "Your password has been updated successfully"
                : "Enter your new password below"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-900/30 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                  </div>
                  <p className="text-zinc-300 text-sm text-center">
                    You can now sign in with your new password.
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full gold-gradient text-gold-foreground border-0 font-semibold"
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-300">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 pr-10"
                      autoComplete="new-password"
                      autoFocus
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
                  <Label htmlFor="confirmPassword" className="text-zinc-300">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 pr-10"
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            password.length >= level * 4
                              ? password.length >= 12
                                ? "bg-emerald-500"
                                : password.length >= 8
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              : "bg-zinc-700"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {password.length < 8
                        ? "Too short"
                        : password.length < 12
                          ? "Good"
                          : "Strong"}
                    </p>
                  </div>
                )}

                {/* Password match indicator */}
                {confirmPassword.length > 0 && (
                  <p className={`text-xs ${password === confirmPassword ? "text-emerald-400" : "text-red-400"}`}>
                    {password === confirmPassword ? "Passwords match" : "Passwords do not match"}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full gold-gradient text-gold-foreground border-0 font-semibold"
                  disabled={resetPasswordMutation.isPending || password.length < 8 || password !== confirmPassword}
                >
                  {resetPasswordMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Resetting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Reset Password
                    </span>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
