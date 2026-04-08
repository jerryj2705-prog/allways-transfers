import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Search, MessageSquare, Mail, MailOpen, Reply, Archive,
  ChevronLeft, ChevronRight, LogOut, Home, ArrowLeft,
  Clock, User, Phone,
} from "lucide-react";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-amber-100 text-amber-800 border-amber-200",
  read: "bg-blue-100 text-blue-800 border-blue-200",
  replied: "bg-green-100 text-green-800 border-green-200",
  archived: "bg-gray-100 text-gray-800 border-gray-200",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  new: Mail,
  read: MailOpen,
  replied: Reply,
  archived: Archive,
};

export default function AdminEnquiries() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const pageSize = 15;

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useMemo(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const { data: stats } = trpc.enquiries.stats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const queryInput = useMemo(() => ({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: debouncedSearch || undefined,
    limit: pageSize,
    offset: page * pageSize,
  }), [statusFilter, debouncedSearch, page]);

  const { data, isLoading, refetch } = trpc.enquiries.list.useQuery(queryInput, {
    enabled: !!user && user.role === "admin",
  });

  const { data: selectedEnquiry } = trpc.enquiries.getById.useQuery(
    { id: selectedEnquiryId! },
    { enabled: !!selectedEnquiryId && !!user && user.role === "admin" }
  );

  const updateStatus = trpc.enquiries.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Enquiry status updated");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const enquiries = data?.enquiries ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const statCards = [
    { label: "Total", value: stats?.total ?? 0, icon: MessageSquare, color: "text-blue-400" },
    { label: "New", value: stats?.new ?? 0, icon: Mail, color: "text-amber-400" },
    { label: "Read", value: stats?.read ?? 0, icon: MailOpen, color: "text-blue-400" },
    { label: "Replied", value: stats?.replied ?? 0, icon: Reply, color: "text-green-400" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in with an admin account.</p>
            <Button onClick={() => window.location.href = getLoginUrl()} className="bg-amber-600 hover:bg-amber-700 text-white">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStatusUpdate = (id: number, status: "new" | "read" | "replied" | "archived", notes?: string) => {
    updateStatus.mutate({ id, status, adminNotes: notes });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/admin")} className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <img src={LOGO_IMG} alt="All Ways Transfers" className="h-10 w-auto" />
              <span className="text-lg font-bold hidden sm:inline">Enquiries</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color} opacity-60`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6 border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or subject..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : enquiries.length === 0 ? (
              <div className="text-center py-20">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                <p className="text-muted-foreground">No enquiries found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enquiries.map((enquiry) => {
                    const StatusIcon = STATUS_ICONS[enquiry.status] || Mail;
                    return (
                      <TableRow
                        key={enquiry.id}
                        className={`cursor-pointer hover:bg-muted/50 ${enquiry.status === "new" ? "font-semibold" : ""}`}
                        onClick={() => { setSelectedEnquiryId(enquiry.id); setAdminNotes(""); }}
                      >
                        <TableCell>
                          <Badge variant="outline" className={`${STATUS_STYLES[enquiry.status]} text-xs`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{enquiry.name}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{enquiry.email}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{enquiry.subject}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                          {new Date(enquiry.createdAt).toLocaleDateString("en-AU", { timeZone: "Australia/Brisbane", day: "2-digit", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {enquiry.status !== "replied" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusUpdate(enquiry.id, "replied")}
                                title="Mark as Replied"
                              >
                                <Reply className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {enquiry.status !== "archived" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusUpdate(enquiry.id, "archived")}
                                title="Archive"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Enquiry Detail Dialog */}
      <Dialog open={!!selectedEnquiryId} onOpenChange={(open) => { if (!open) setSelectedEnquiryId(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              Enquiry Details
            </DialogTitle>
          </DialogHeader>
          {selectedEnquiry && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`${STATUS_STYLES[selectedEnquiry.status]} text-xs`}>
                  {selectedEnquiry.status.charAt(0).toUpperCase() + selectedEnquiry.status.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedEnquiry.createdAt).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">{selectedEnquiry.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a href={`mailto:${selectedEnquiry.email}`} className="text-amber-400 hover:underline">{selectedEnquiry.email}</a>
                </div>
                {selectedEnquiry.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a href={`tel:${selectedEnquiry.phone}`} className="text-amber-400 hover:underline">{selectedEnquiry.phone}</a>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-2">{selectedEnquiry.subject}</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{selectedEnquiry.message}</p>
              </div>

              {/* Admin Notes */}
              <div className="border-t border-border pt-4 space-y-3">
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  placeholder="Add internal notes about this enquiry..."
                  value={adminNotes || selectedEnquiry.adminNotes || ""}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedEnquiry.status !== "replied" && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white gap-1"
                    onClick={() => { handleStatusUpdate(selectedEnquiry.id, "replied", adminNotes || undefined); setSelectedEnquiryId(null); }}
                  >
                    <Reply className="w-3.5 h-3.5" />
                    Mark as Replied
                  </Button>
                )}
                {selectedEnquiry.status !== "archived" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => { handleStatusUpdate(selectedEnquiry.id, "archived", adminNotes || undefined); setSelectedEnquiryId(null); }}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archive
                  </Button>
                )}
                {selectedEnquiry.status === "archived" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => { handleStatusUpdate(selectedEnquiry.id, "new", adminNotes || undefined); setSelectedEnquiryId(null); }}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Reopen
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => window.open(`mailto:${selectedEnquiry.email}?subject=Re: ${encodeURIComponent(selectedEnquiry.subject)}`, "_blank")}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Reply via Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
