import { useState, useMemo } from "react";
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
} from "lucide-react";
import { SERVICE_TYPES, BOOKING_STATUSES, PAYMENT_METHODS } from "@shared/types";
import type { ServiceType, BookingStatus, PaymentMethod } from "@shared/types";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Clock,
  confirmed: AlertCircle,
  completed: CheckCircle,
  cancelled: XCircle,
};

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeout = useMemo(() => {
    return (val: string) => {
      const id = setTimeout(() => setDebouncedSearch(val), 400);
      return () => clearTimeout(id);
    };
  }, []);

  const { data: stats } = trpc.bookings.stats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const queryInput = useMemo(() => ({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: debouncedSearch || undefined,
    limit: pageSize,
    offset: page * pageSize,
  }), [statusFilter, debouncedSearch, page]);

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
    { label: "Pending", value: stats?.pending ?? 0, icon: Clock, color: "text-amber-600" },
    { label: "Confirmed", value: stats?.confirmed ?? 0, icon: AlertCircle, color: "text-blue-600" },
    { label: "Completed", value: stats?.completed ?? 0, icon: CheckCircle, color: "text-green-600" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <div className="border-b border-border/50 bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <img src={LOGO_IMG} alt="All Ways Transfers" className="h-16 w-auto" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin/calendar")}
              className="gap-1 bg-background"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin/pricing")}
              className="gap-1 bg-background"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pricing</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin/enquiries")}
              className="gap-1 bg-background"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enquiries</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin/reviews")}
              className="gap-1 bg-background"
            >
              <Star className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reviews</span>
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:inline">{user.name}</span>
            <Button variant="outline" size="sm" onClick={logout} className="gap-1 bg-background">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Loading bookings...
                    </TableCell>
                  </TableRow>
                ) : !bookingsData?.bookings.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
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
    </div>
  );
}
