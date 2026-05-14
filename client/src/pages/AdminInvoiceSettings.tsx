import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, Save, Loader2, Eye, EyeOff, Download } from "lucide-react";
import { toast } from "sonner";

const MAX_FOOTER_LENGTH = 500;
const MAX_ABN_LENGTH = 50;

export default function AdminInvoiceSettings() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [footerMessage, setFooterMessage] = useState("");
  const [abn, setAbn] = useState("18 715 944 056");
  const [showPreview, setShowPreview] = useState(false);

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

  const previewMutation = trpc.invoiceSettings.preview.useMutation({
    onSuccess: (result) => {
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Preview invoice downloaded");
    },
    onError: (err) => { toast.error(err.message || "Failed to generate preview"); },
  });

  useEffect(() => {
    if (data) {
      setFooterMessage(data.footerMessage);
      setAbn(data.abn);
    }
  }, [data]);

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
      <div className="container max-w-3xl py-8">
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
          <Button variant="outline" size="sm" onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending} className="gap-2">
            {previewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download Sample Invoice
          </Button>
        </div>

        {/* ABN / Tax Registration */}
        <Card className="mb-6 border-border/50">
          <CardHeader>
            <CardTitle>ABN / Tax Registration</CardTitle>
            <CardDescription>Your Australian Business Number (ABN) or tax registration number. This appears in the invoice header and footer alongside your business name.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="abn">ABN / Tax Number</Label>
            <Input id="abn" placeholder="e.g. 18 715 944 056" value={abn} onChange={(e) => { if (e.target.value.length <= MAX_ABN_LENGTH) setAbn(e.target.value); }} className="max-w-sm" />
            <p className="text-xs text-muted-foreground">Leave empty to hide the ABN from invoices</p>
          </CardContent>
        </Card>

        {/* Footer Message Form */}
        <Card className="mb-6 border-border/50">
          <CardHeader>
            <CardTitle>Invoice Footer Message</CardTitle>
            <CardDescription>This message will appear in a highlighted box at the bottom of every invoice PDF, above the standard business details footer. Use it for thank-you notes, payment terms, or any other information you want clients to see.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="footerMessage">Footer Message</Label>
              <Textarea id="footerMessage" placeholder="e.g. Thank you for choosing All Ways Transfers. Payment is due within 7 days of the invoice date." value={footerMessage} onChange={(e) => { if (e.target.value.length <= MAX_FOOTER_LENGTH) setFooterMessage(e.target.value); }} rows={4} className="resize-none" />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">Leave empty to hide the custom footer section from invoices</p>
                <p className={`text-xs ${footerCharsRemaining < 50 ? "text-amber-400" : "text-muted-foreground"}`}>{footerCharsRemaining} characters remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="mb-6 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Invoice Preview</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-2 text-muted-foreground">
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? "Hide" : "Show"} Preview
              </Button>
            </div>
          </CardHeader>
          {showPreview && (
            <CardContent>
              <div className="rounded-lg bg-white border border-gray-200 p-6 space-y-4">
                {/* Simulated invoice header */}
                <div className="flex justify-between items-start pb-3 border-b-2 border-amber-400">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">All Ways Transfers</p>
                    <p className="text-xs text-gray-400">Phone: 0466 544 068 | Email: bookings@allwaystransfers.com.au</p>
                    <p className="text-xs text-gray-400">{abn.trim() ? `ABN: ${abn}  |  ` : ""}Queensland, Australia</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-600 text-sm">TAX INVOICE</p>
                    <p className="text-xs text-gray-400">{new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                </div>

                {/* Simulated invoice total area */}
                <div className="border-t-2 border-amber-400 pt-3">
                  <div className="flex justify-between items-center bg-amber-50 rounded px-3 py-2">
                    <span className="font-bold text-gray-800 text-sm">TOTAL (AUD)</span>
                    <span className="font-bold text-amber-600 text-lg">$200.00</span>
                  </div>
                  <p className="text-xs text-gray-400 italic mt-1 ml-2">All prices are inclusive of GST</p>
                </div>

                {/* PAID watermark indicator */}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded px-3 py-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Invoices with &quot;Paid&quot; payment status display a large diagonal &quot;PAID&quot; watermark across the page
                  </div>
                </div>

                {/* Custom footer preview */}
                {footerMessage.trim() ? (
                  <div className="border-t border-gray-200 pt-3">
                    <div className="bg-amber-50 border border-amber-200 rounded p-3">
                      <p className="text-sm text-amber-800 italic">{footerMessage}</p>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-400 italic text-center">No custom footer message — this section will not appear on the invoice</p>
                  </div>
                )}

                {/* Standard footer */}
                <div className="border-t border-gray-200 pt-3 text-center space-y-1">
                  <p className="text-xs text-gray-400">All Ways Transfers{abn.trim() ? ` | ABN ${abn}` : ""} | Queensland, Australia</p>
                  <p className="text-xs text-gray-400">Phone: 0466 544 068 | Email: bookings@allwaystransfers.com.au</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">This is a simplified preview. Click &quot;Download Sample Invoice&quot; above to see the full PDF with logo, layout, and PAID watermark.</p>
            </CardContent>
          )}
        </Card>

        {/* Suggestions */}
        <Card className="mb-6 border-border/50 bg-muted/30">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Suggested Footer Messages</h3>
            <div className="space-y-2">
              {[
                "Thank you for choosing All Ways Transfers. We appreciate your business and look forward to serving you again.",
                "Payment is due within 7 days of the invoice date. For any queries regarding this invoice, please contact us at bookings@allwaystransfers.com.au or call 0466 544 068.",
                "Thank you for travelling with All Ways Transfers. We hope you had a comfortable journey. Please don't hesitate to reach out if you need future transfers.",
              ].map((suggestion, i) => (
                <button key={i} onClick={() => setFooterMessage(suggestion)} className="w-full text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md p-3 border border-transparent hover:border-border/50 transition-colors">
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
    </div>
  );
}
