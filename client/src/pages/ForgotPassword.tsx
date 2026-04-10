import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    forgotPasswordMutation.mutate({
      email,
      origin: window.location.origin,
    });
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
            <CardTitle className="text-2xl font-bold text-white">
              {submitted ? "Check Your Email" : "Forgot Password"}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {submitted
                ? "We've sent you a password reset link"
                : "Enter your email and we'll send you a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-900/30 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-zinc-300 text-sm">
                      If an account exists for <strong className="text-white">{email}</strong>, you'll receive a password reset email shortly.
                    </p>
                    <p className="text-zinc-500 text-xs">
                      The link will expire in 30 minutes. Check your spam folder if you don't see it.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setSubmitted(false);
                      setEmail("");
                    }}
                    variant="outline"
                    className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    Try a different email
                  </Button>
                  <Button
                    onClick={() => navigate("/login")}
                    className="w-full gold-gradient text-gold-foreground border-0 font-semibold"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      autoComplete="email"
                      autoFocus
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full gold-gradient text-gold-foreground border-0 font-semibold"
                    disabled={forgotPasswordMutation.isPending}
                  >
                    {forgotPasswordMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Send Reset Link
                      </span>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => navigate("/login")}
                    className="text-zinc-400 hover:text-zinc-300 text-sm inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back to Sign In
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
