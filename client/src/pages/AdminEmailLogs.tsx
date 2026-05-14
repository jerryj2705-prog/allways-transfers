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
import { useLocation } from "wouter";
import {
  Search, ChevronLeft, ChevronRight, LogOut, ArrowLeft,
  Mail, MailCheck, MailX, Send, Clock,
} from "lucide-react";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

const EMAIL_TYPE_LABELS: Record<string, string> = {
  booking_confirmation: "Booking Confirmation",
  quote: "Quote",
  quote_reminder: "Quote Reminder",
  quote_expired: "Quote Expired",
  cancellation_confirmation: "Cancellation",
  admin_new_booking: "Admin: New Booking",
  admin_cancellation: "Admin: Cancellation",
  password_reset: "Password Reset",
  payment_receipt: "Payment Receipt",
};

const STATUS_STYLES: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-800 border-emerald-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

export default function AdminEmailLogs() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useMemo(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const { data: stats } = trpc.emailLogs.stats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const { data: logs, isLoading: logsLoading } = trpc.emailLogs.list.useQuery(
    {
      emailType: typeFilter !== "all" ? typeFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: debouncedSearch || undefined,
      limit: pageSize,
      offset: page * pageSize,
    },
    { enabled: !!user && user.role === "admin" }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="font-heading text-2xl font-bold">Access Denied</h2>
          <Button onClick={() => setLocation("/")} variant="outline" className="bg-background">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil((logs?.total ?? 0) / pageSize);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/admin")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
          </div>
          <div className="flex items-center gap-3">
            <img src={LOGO_IMG} alt="All Ways Transfers" className="h-16 w-auto" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="container py-8 max-w-6xl mx-auto">
        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">Email Logs</h1>
            <p className="text-muted-foreground mt-1">Track all emails sent from the system</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Send className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-heading font-bold">{stats?.total ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Sent</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <MailCheck className="w-5 h-5 mx-auto mb-2 text-emerald-500" />
              <p className="text-2xl font-heading font-bold">{stats?.sent ?? 0}</p>
              <p className="text-xs text-muted-foreground">Delivered</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <MailX className="w-5 h-5 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-heading font-bold">{stats?.failed ?? 0}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Clock className="w-5 h-5 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-heading font-bold">{stats?.byType?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Email Types</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border/50 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by recipient, subject, or reference..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0); }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Email Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                  <SelectItem value="quote">Quote</SelectItem>
                  <SelectItem value="quote_reminder">Quote Reminder</SelectItem>
                  <SelectItem value="quote_expired">Quote Expired</SelectItem>
                  <SelectItem value="cancellation_confirmation">Cancellation</SelectItem>
                  <SelectItem value="admin_new_booking">Admin: New Booking</SelectItem>
                  <SelectItem value="admin_cancellation">Admin: Cancellation</SelectItem>
                  <SelectItem value="password_reset">Password Reset</SelectItem>
                  <SelectItem value="payment_receipt">Payment Receipt</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Date</TableHead>
                    <TableHead className="w-36">Type</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="w-24">Reference</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : !logs?.logs?.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No email logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.logs.map((log: any) => (
                      <TableRow key={log.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.sentAt).toLocaleString("en-AU", {
                            timeZone: "Australia/Brisbane",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium">
                            {EMAIL_TYPE_LABELS[log.emailType] ?? log.emailType}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {log.recipientEmail}
                        </TableCell>
                        <TableCell className="text-sm max-w-[250px] truncate">
                          {log.subject}
                        </TableCell>
                        <TableCell>
                          {log.bookingReference ? (
                            <span className="text-xs font-mono text-primary">{log.bookingReference}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${STATUS_STYLES[log.status] ?? ""}`}>
                            {log.status === "sent" ? "Sent" : "Failed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, logs?.total ?? 0)} of {logs?.total ?? 0}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
