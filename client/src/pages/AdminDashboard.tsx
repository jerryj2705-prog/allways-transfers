import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  Search, LayoutDashboard, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, LogOut, Home, DollarSign, MessageSquare, CalendarDays, Star,
  Download, X, Banknote, CreditCard, RotateCcw, MapPin, Trash2, Navigation, FileText, Mail, Building2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { SERVICE_TYPES, BOOKING_STATUSES, PAYMENT_METHODS } from "@shared/types";
import type { ServiceType, BookingStatus, PaymentMethod } from "@shared/types";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

const STATUS_STYLES: Record<string, string> = {
  quote: "bg-purple-100 text-purple-800 border-purple-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-zinc-100 text-zinc-800 border-zinc-200",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  quote: FileText,
  pending: Clock,
  confirmed: AlertCircle,
  completed: CheckCircle,
  cancelled: XCircle,
};

// PWA Install Prompt Hook
function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("pwa-install-dismissed") === "true"; } catch { return false; }
  });

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const installedHandler = () => setIsInstalled(true);

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem("pwa-install-dismissed", "true"); } catch {}
  };

  const showBanner = !isInstalled && !dismissed && deferredPrompt !== null;

  return { showBanner, install, dismiss, isInstalled };
}

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 15;
  const pwa = usePwaInstall();

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const searchTimeout = useMemo(() => {
    return (val: string) => {
      const id = setTimeout(() => setDebouncedSearch(val), 400);
      return () => clearTimeout(id);
    };
  }, []);

  const utils = trpc.useUtils();
  const deleteMutation = trpc.bookings.delete.useMutation({
    onSuccess: () => {
      toast.success("Booking deleted successfully");
      utils.bookings.list.invalidate();
      utils.bookings.stats.invalidate();
      setDeleteConfirmId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete booking");
      setDeleteConfirmId(null);
    },
  });

  const { data: stats } = trpc.bookings.stats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const queryInput = useMemo(() => ({
    status: statusFilter !== "all" ? statusFilter : undefined,
    paymentStatus: paymentStatusFilter !== "all" ? paymentStatusFilter : undefined,
    search: debouncedSearch || undefined,
    limit: pageSize,
    offset: page * pageSize,
  }), [statusFilter, paymentStatusFilter, debouncedSearch, page]);

  const { data: bookingsData, isLoading: bookingsLoading } = trpc.bookings.list.useQuery(
    queryInput,
    { enabled: !!user && user.role === "admin" }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="font-heading text-2xl font-bold">Admin Access Required</h2>
          <p className="text-muted-foreground">Please sign in to access the admin dashboard.</p>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="gold-gradient text-gold-foreground border-0"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="font-heading text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">You do not have admin privileges.</p>
          <Button onClick={() => setLocation("/")} variant="outline" className="bg-background">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil((bookingsData?.total ?? 0) / pageSize);

  const statCards = [
    { label: "Total Bookings", value: stats?.total ?? 0, icon: LayoutDashboard, color: "text-foreground" },
    { label: "Quotes", value: stats?.quote ?? 0, icon: FileText, color: "text-purple-600" },
    { label: "Pending", value: stats?.pending ?? 0, icon: Clock, color: "text-amber-600" },
    { label: "Confirmed", value: stats?.confirmed ?? 0, icon: AlertCircle, color: "text-blue-600" },
    { label: "Completed", value: stats?.completed ?? 0, icon: CheckCircle, color: "text-green-600" },
    { label: "Expired", value: stats?.expired ?? 0, icon: XCircle, color: "text-zinc-500" },
  ];

  const fmtAud = (v: string) => `$${parseFloat(v).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const paymentCards = [
    {
      label: "Total Revenue", value: fmtAud(stats?.totalRevenue ?? "0"),
      icon: Banknote, color: "text-emerald-500", bg: "from-emerald-950/40 to-emerald-900/20",
      breakdown: stats?.revenueByMethod ?? { stripe: "0", square: "0", cash: "0" },
      breakdownLabels: { col1: "Stripe", col2: "Card", col3: "Cash" },
    },
    {
      label: "Outstanding", value: fmtAud(stats?.unpaidAmount ?? "0"),
      icon: CreditCard, color: "text-amber-500", bg: "from-amber-950/40 to-amber-900/20",
      breakdown: stats?.unpaidByMethod ?? { stripe: "0", square: "0", cash: "0" },
      breakdownLabels: { col1: "Stripe", col2: "Card", col3: "Cash" },
    },
    {
      label: "Refunded", value: fmtAud(stats?.refundedAmount ?? "0"),
      icon: RotateCcw, color: "text-blue-500", bg: "from-blue-950/40 to-blue-900/20",
      breakdown: stats?.refundedByMethod ?? { stripe: "0", square: "0", cash: "0" },
      breakdownLabels: { col1: "Stripe", col2: "Card", col3: "Cash" },
    },
    {
      label: "Total Tolls", value: fmtAud(stats?.totalTolls ?? "0"),
      icon: Navigation, color: "text-amber-400", bg: "from-amber-950/40 to-amber-900/20",
      breakdown: { stripe: stats?.totalAirportTolls ?? "0", square: stats?.totalRoadTolls ?? "0", cash: "0" },
      breakdownLabels: { col1: "Airport", col2: "Road", col3: "" },
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <div className="border-b border-border/50 bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container py-2">
          {/* Top row: Logo + User */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocation("/")}
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="w-4 h-4" />
              </button>
              <img src={LOGO_IMG} alt="All Ways Transfers" className="h-10 w-auto" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{user.name}</span>
              <Button variant="outline" size="sm" onClick={logout} className="gap-1 bg-background h-7 px-2 text-xs">
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            </div>
          </div>
          {/* Bottom row: All nav buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/calendar")} className="gap-1 bg-background h-7 px-2.5 text-xs">
              <CalendarDays className="w-3 h-3" />
              Calendar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/pricing")} className="gap-1 bg-background h-7 px-2.5 text-xs">
              <DollarSign className="w-3 h-3" />
              Pricing
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/enquiries")} className="gap-1 bg-background h-7 px-2.5 text-xs">
              <MessageSquare className="w-3 h-3" />
              Enquiries
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/reviews")} className="gap-1 bg-background h-7 px-2.5 text-xs">
              <Star className="w-3 h-3" />
              Reviews
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/landmarks")} className="gap-1 bg-background h-7 px-2.5 text-xs">
              <MapPin className="w-3 h-3" />
              Landmarks
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/email-logs")} className="gap-1 bg-background h-7 px-2.5 text-xs">
              <Mail className="w-3 h-3" />
              Email Logs
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/bank-details")} className="gap-1 bg-background h-7 px-2.5 text-xs">
              <Building2 className="w-3 h-3" />
              Bank Details
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/invoice-settings")} className="gap-1 bg-background h-7 px-2.5 text-xs">
              <FileText className="w-3 h-3" />
              Invoice
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* PWA Install Banner */}
        {pwa.showBanner && (
          <div className="mb-6 relative overflow-hidden rounded-xl border border-amber-600/30 bg-gradient-to-r from-amber-950/60 via-amber-900/40 to-amber-950/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-600/20 flex items-center justify-center">
                  <Download className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-foreground">Install Admin App</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Quick access from your home screen — works offline</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={pwa.install}
                  className="gold-gradient text-gold-foreground border-0 text-xs sm:text-sm"
                >
                  Install
                </Button>
                <button
                  onClick={pwa.dismiss}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label="Dismiss install banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                    <p className={`text-2xl font-heading font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color} opacity-30`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {paymentCards.map((card) => (
            <Card key={card.label} className={`border-border/50 bg-gradient-to-br ${card.bg} group relative overflow-hidden transition-all duration-200 hover:border-border`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                    <p className={`text-2xl font-heading font-bold mt-1 ${card.color}`}>{card.value}</p>
                  </div>
                  <card.icon className={`w-8 h-8 ${card.color} opacity-30`} />
                </div>
                {/* Hover breakdown */}
                <div className="grid grid-cols-3 gap-2 mt-0 max-h-0 opacity-0 group-hover:mt-3 group-hover:max-h-24 group-hover:opacity-100 transition-all duration-300 ease-in-out overflow-hidden border-t-0 group-hover:border-t border-border/30 group-hover:pt-3">
                  {card.breakdownLabels.col1 && (
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{card.breakdownLabels.col1}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{fmtAud(card.breakdown.stripe)}</p>
                    </div>
                  )}
                  {card.breakdownLabels.col2 && (
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{card.breakdownLabels.col2}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{fmtAud(card.breakdown.square)}</p>
                    </div>
                  )}
                  {card.breakdownLabels.col3 && (
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{card.breakdownLabels.col3}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{fmtAud(card.breakdown.cash)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or reference..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
                searchTimeout(e.target.value);
              }}
              className="pl-10 h-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) => { setStatusFilter(val); setPage(0); }}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-10">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="quote">Quote</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={paymentStatusFilter}
            onValueChange={(val) => { setPaymentStatusFilter(val); setPage(0); }}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-10">
              <SelectValue placeholder="Filter by payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bookings Table */}
        <Card className="border-border/50">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Reference</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Service</TableHead>
                  <TableHead className="hidden lg:table-cell">Pickup Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Passengers</TableHead>
                  <TableHead className="hidden lg:table-cell">Pets</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingsLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      Loading bookings...
                    </TableCell>
                  </TableRow>
                ) : !bookingsData?.bookings.length ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      No bookings found.
                    </TableCell>
                  </TableRow>
                ) : (
                  bookingsData.bookings.map((booking) => {
                    const StatusIcon = STATUS_ICONS[booking.status] || Clock;
                    const statusStyle = STATUS_STYLES[booking.status] || "";
                    const serviceLabel = SERVICE_TYPES[booking.serviceType as ServiceType]?.label ?? booking.serviceType;
                    return (
                      <TableRow
                        key={booking.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setLocation(`/admin/booking/${booking.id}`)}
                      >
                        <TableCell className="font-mono text-xs font-medium">
                          {booking.referenceNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{booking.clientName}</p>
                            <p className="text-xs text-muted-foreground">{booking.clientEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {serviceLabel}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {new Date(booking.pickupDate).toLocaleString("en-AU", {
                            timeZone: "Australia/Brisbane",
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {booking.passengerCount}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {booking.numberOfPets ? booking.numberOfPets : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${statusStyle}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {BOOKING_STATUSES[booking.status as BookingStatus]?.label ?? booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <div className="space-y-1">
                            <p className="text-xs">{booking.paymentMethod ? PAYMENT_METHODS[booking.paymentMethod as PaymentMethod]?.label : "—"}</p>
                            <Badge variant="outline" className={`text-xs ${
                              booking.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                              booking.paymentStatus === "refunded" ? "bg-blue-100 text-blue-800 border-blue-200" :
                              "bg-amber-100 text-amber-800 border-amber-200"
                            }`}>
                              {booking.paymentStatus === "paid" ? "Paid" : booking.paymentStatus === "refunded" ? "Refunded" : "Unpaid"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          ${parseFloat(booking.totalPrice ?? "0").toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(booking.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, bookingsData?.total ?? 0)} of {bookingsData?.total ?? 0}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="bg-background"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="bg-background"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteConfirmId) {
                  deleteMutation.mutate({ id: deleteConfirmId });
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
