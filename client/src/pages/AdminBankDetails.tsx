import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Building2, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AdminBankDetails() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [bankName, setBankName] = useState("");
  const [bsb, setBsb] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [referenceInstructions, setReferenceInstructions] = useState(
    "Please use your booking reference number as the payment reference."
  );
  const [isEnabled, setIsEnabled] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const { data: bankDetails, isLoading } = trpc.bankDetails.adminGet.useQuery();
  const utils = trpc.useUtils();

  const saveMutation = trpc.bankDetails.save.useMutation({
    onSuccess: () => {
      toast.success("Bank details saved successfully");
      utils.bankDetails.adminGet.invalidate();
      utils.bankDetails.get.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save bank details");
    },
  });

  useEffect(() => {
    if (bankDetails) {
      setBankName(bankDetails.bankName);
      setBsb(bankDetails.bsb);
      setAccountNumber(bankDetails.accountNumber);
      setAccountName(bankDetails.accountName);
      setReferenceInstructions(bankDetails.referenceInstructions);
      setIsEnabled(bankDetails.isEnabled);
    }
  }, [bankDetails]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    setLocation("/");
    return null;
  }

  const handleSave = () => {
    if (!bankName.trim() || !bsb.trim() || !accountNumber.trim() || !accountName.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    saveMutation.mutate({
      bankName: bankName.trim(),
      bsb: bsb.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
      referenceInstructions: referenceInstructions.trim(),
      isEnabled,
    });
  };

  const formatBsb = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    if (digits.length > 3) {
      return digits.slice(0, 3) + "-" + digits.slice(3);
    }
    return digits;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/admin")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6 text-amber-400" />
              Bank Details
            </h1>
            <p className="text-muted-foreground text-sm">
              Configure bank account details for direct deposit payments
            </p>
          </div>
        </div>

        {/* Enable/Disable Toggle */}
        <Card className="mb-6 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Enable Direct Deposit</h3>
                <p className="text-sm text-muted-foreground">
                  When enabled, clients can select "Direct Deposit" as a payment method during booking
                </p>
              </div>
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            </div>
          </CardContent>
        </Card>

        {/* Bank Details Form */}
        <Card className="mb-6 border-border/50">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              These details will be displayed to clients who select direct deposit as their payment method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input
                id="bankName"
                placeholder="e.g. Commonwealth Bank, ANZ, Westpac"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bsb">BSB *</Label>
                <Input
                  id="bsb"
                  placeholder="e.g. 064-000"
                  value={bsb}
                  onChange={(e) => setBsb(formatBsb(e.target.value))}
                  maxLength={7}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  placeholder="e.g. 12345678"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name *</Label>
              <Input
                id="accountName"
                placeholder="e.g. All Ways Transfers Pty Ltd"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceInstructions">Reference Instructions</Label>
              <Textarea
                id="referenceInstructions"
                placeholder="Instructions for the client about what to use as the payment reference"
                value={referenceInstructions}
                onChange={(e) => setReferenceInstructions(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This message will be shown to clients along with the bank details
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="mb-6 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Client Preview</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2 text-muted-foreground"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? "Hide" : "Show"} Preview
              </Button>
            </div>
          </CardHeader>
          {showPreview && (
            <CardContent>
              <div className="rounded-lg bg-[#1a1a1a] border border-amber-500/20 p-5 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <Building2 className="w-5 h-5" />
                  Bank Transfer Details
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs mb-0.5">Bank</span>
                    <span className="text-foreground font-medium">{bankName || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-0.5">BSB</span>
                    <span className="text-foreground font-medium font-mono">{bsb || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-0.5">Account Number</span>
                    <span className="text-foreground font-medium font-mono">{accountNumber || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-0.5">Account Name</span>
                    <span className="text-foreground font-medium">{accountName || "—"}</span>
                  </div>
                </div>
                {referenceInstructions && (
                  <div className="text-sm text-amber-200/70 bg-amber-500/10 rounded-md p-3 border border-amber-500/20">
                    {referenceInstructions}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="gap-2 gold-gradient text-gold-foreground border-0 hover:opacity-90"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Bank Details
          </Button>
        </div>
      </div>
    </div>
  );
}
