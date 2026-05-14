import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, Save, Loader2, Download, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";

const MAX_FOOTER_LENGTH = 500;
const MAX_ABN_LENGTH = 50;

export default function AdminInvoiceSettings() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [footerMessage, setFooterMessage] = useState("");
  const [abn, setAbn] = useState("18 715 944 056");
  const [previewStatus, setPreviewStatus] = useState<"paid" | "unpaid">("paid");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { data, isLoading } = trpc.invoiceSettings.getAll.useQuery();
  const utils = trpc.useUtils();

  const saveFooterMutation = trpc.invoiceSettings.setFooterMessage.useMutation({
    onSuccess: () => { utils.invoiceSettings.getAll.invalidate(); },
    onError: (err) => { toast.error(err.message || "Failed to save footer message"); },
  });

  const saveAbnMutation = trpc.invoiceSettings.setAbn.useMutation({
    onSuccess: () => { utils.invoiceSettings.getAll.invalidate(); },
    onError: (err) => { toast.error(err.message || "Failed to save ABN"); },
  });

  const previewMutation = trpc.invoiceSettings.preview.useMutation();

  useEffect(() => {
    if (data) {
      setFooterMessage(data.footerMessage);
      setAbn(data.abn);
    }
  }, [data]);

  // Convert base64 to blob URL for inline preview
  const base64ToBlobUrl = useCallback((base64: string): string => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  }, []);

  // Generate preview
  const generatePreview = useCallback(async (status: "paid" | "unpaid") => {
    setPreviewLoading(true);
    try {
      const result = await previewMutation.mutateAsync({ paymentStatus: status });
      // Revoke old URL
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = base64ToBlobUrl(result.data);
      setPreviewUrl(url);
    } catch (err) {
      toast.error("Failed to generate preview");
    } finally {
      setPreviewLoading(false);
    }
  }, [previewMutation, previewUrl, base64ToBlobUrl]);

  // Download the current preview
  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `Invoice-Preview-${previewStatus.toUpperCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Invoice PDF downloaded");
  }, [previewUrl, previewStatus]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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

  const isSaving = saveFooterMutation.isPending || saveAbnMutation.isPending;

  const handleSaveAll = async () => {
    try {
      await Promise.all([
        saveFooterMutation.mutateAsync({ message: footerMessage }),
        saveAbnMutation.mutateAsync({ abn }),
      ]);
      toast.success("Invoice settings saved successfully");
    } catch { /* Individual error handlers already fire toasts */ }
  };

  const footerCharsRemaining = MAX_FOOTER_LENGTH - footerMessage.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-amber-400" />
              Invoice Settings
            </h1>
            <p className="text-muted-foreground text-sm">Customise the details that appear on all invoice PDFs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Settings */}
          <div className="space-y-6">
            {/* ABN / Tax Registration */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">ABN / Tax Registration</CardTitle>
                <CardDescription className="text-xs">Appears in the invoice header and footer alongside your business name.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="abn" className="text-sm">ABN / Tax Number</Label>
                <Input id="abn" placeholder="e.g. 18 715 944 056" value={abn} onChange={(e) => { if (e.target.value.length <= MAX_ABN_LENGTH) setAbn(e.target.value); }} className="max-w-sm" />
                <p className="text-xs text-muted-foreground">Leave empty to hide from invoices</p>
              </CardContent>
            </Card>

            {/* Footer Message Form */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Invoice Footer Message</CardTitle>
                <CardDescription className="text-xs">Appears in a highlighted box at the bottom of every invoice PDF. Use for thank-you notes or payment terms.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="footerMessage" className="text-sm">Footer Message</Label>
                  <Textarea id="footerMessage" placeholder="e.g. Thank you for choosing All Ways Transfers. Payment is due within 7 days of the invoice date." value={footerMessage} onChange={(e) => { if (e.target.value.length <= MAX_FOOTER_LENGTH) setFooterMessage(e.target.value); }} rows={3} className="resize-none" />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Leave empty to hide</p>
                    <p className={`text-xs ${footerCharsRemaining < 50 ? "text-amber-400" : "text-muted-foreground"}`}>{footerCharsRemaining} chars left</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suggestions */}
            <Card className="border-border/50 bg-muted/30">
              <CardContent className="pt-5">
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Suggested Footer Messages</h3>
                <div className="space-y-1.5">
                  {[
                    "Thank you for choosing All Ways Transfers. We appreciate your business and look forward to serving you again.",
                    "Payment is due within 7 days of the invoice date. For any queries regarding this invoice, please contact us at bookings@allwaystransfers.com.au or call 0466 544 068.",
                    "Thank you for travelling with All Ways Transfers. We hope you had a comfortable journey. Please don't hesitate to reach out if you need future transfers.",
                  ].map((suggestion, i) => (
                    <button key={i} onClick={() => setFooterMessage(suggestion)} className="w-full text-left text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md p-2.5 border border-transparent hover:border-border/50 transition-colors">
                      &quot;{suggestion}&quot;
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSaveAll} disabled={isSaving} className="gap-2 gold-gradient text-gold-foreground border-0 hover:opacity-90">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Invoice Settings
              </Button>
            </div>
          </div>

          {/* Right Column: Interactive PDF Preview */}
          <div className="space-y-4">
            <Card className="border-border/50 sticky top-8">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-400" />
                    Live Invoice Preview
                  </CardTitle>
                  {previewUrl && (
                    <Button variant="ghost" size="sm" onClick={handleDownload} className="gap-1.5 text-xs text-muted-foreground">
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </Button>
                  )}
                </div>
                <CardDescription className="text-xs">
                  Save your settings first, then generate a preview to see the actual PDF.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Status Toggle */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Payment Status:</Label>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    <button
                      onClick={() => setPreviewStatus("paid")}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        previewStatus === "paid"
                          ? "bg-green-600 text-white"
                          : "bg-transparent text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Paid
                    </button>
                    <button
                      onClick={() => setPreviewStatus("unpaid")}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        previewStatus === "unpaid"
                          ? "bg-red-600 text-white"
                          : "bg-transparent text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Unpaid
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generatePreview(previewStatus)}
                    disabled={previewLoading}
                    className="gap-1.5 ml-auto text-xs"
                  >
                    {previewLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    {previewUrl ? "Refresh" : "Generate"} Preview
                  </Button>
                </div>

                {/* PDF Viewer */}
                {previewUrl ? (
                  <div className="rounded-lg border border-border overflow-hidden bg-gray-100" style={{ height: "680px" }}>
                    <iframe
                      src={previewUrl}
                      className="w-full h-full"
                      title="Invoice Preview"
                      style={{ border: "none" }}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center text-center p-8" style={{ height: "680px" }}>
                    <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-sm text-muted-foreground mb-1">No preview generated yet</p>
                    <p className="text-xs text-muted-foreground/60 mb-4">Save your settings, then click &quot;Generate Preview&quot; to see the actual invoice PDF</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generatePreview(previewStatus)}
                      disabled={previewLoading}
                      className="gap-1.5"
                    >
                      {previewLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      Generate Preview
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Toggle between Paid/Unpaid to see different watermarks. Save settings first to reflect changes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
