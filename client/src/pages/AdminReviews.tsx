import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  Star, MessageSquare, CheckCircle2, XCircle, Clock,
  ChevronLeft, ChevronRight, LogOut, ArrowLeft, Trash2, User, RefreshCw, Settings2, ExternalLink,
} from "lucide-react";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

const SERVICE_LABELS: Record<string, string> = {
  airport_transfer: "Airport Transfer",
  hourly_hire: "Hourly Hire",
  point_to_point: "Point to Point",
  special_events: "Special Events",
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showGoogleSettings, setShowGoogleSettings] = useState(false);
  const [placeIdInput, setPlaceIdInput] = useState("");
  const pageSize = 15;

  const { data: stats } = trpc.reviews.stats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const queryInput = useMemo(() => ({
    status: statusFilter !== "all" ? statusFilter : undefined,
    limit: pageSize,
    offset: page * pageSize,
  }), [statusFilter, page]);

  const { data, isLoading, refetch } = trpc.reviews.list.useQuery(queryInput, {
    enabled: !!user && user.role === "admin",
  });

  const { data: selectedReview } = trpc.reviews.getById.useQuery(
    { id: selectedReviewId! },
    { enabled: !!selectedReviewId && !!user && user.role === "admin" }
  );

  const updateStatus = trpc.reviews.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Review status updated");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteReview = trpc.reviews.delete.useMutation({
    onSuccess: () => {
      toast.success("Review deleted");
      setSelectedReviewId(null);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // Google Reviews
  const { data: googlePlaceId } = trpc.googleReviews.getPlaceId.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
    onSuccess: (data: { placeId: string }) => {
      if (data.placeId && !placeIdInput) setPlaceIdInput(data.placeId);
    },
  } as any);

  const { data: googleReviewsData } = trpc.googleReviews.get.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const setPlaceId = trpc.googleReviews.setPlaceId.useMutation({
    onSuccess: () => {
      toast.success("Google Place ID saved. Reviews will be fetched shortly.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const refreshGoogle = trpc.googleReviews.refresh.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Refreshed ${data.count} Google reviews (${data.rating} avg rating)`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const reviews = data?.reviews ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const statCards = [
    { label: "Total", value: stats?.total ?? 0, icon: MessageSquare, color: "text-blue-400" },
    { label: "Pending", value: stats?.pending ?? 0, icon: Clock, color: "text-amber-400" },
    { label: "Approved", value: stats?.approved ?? 0, icon: CheckCircle2, color: "text-green-400" },
    { label: "Avg Rating", value: stats?.averageRating ?? 0, icon: Star, color: "text-primary" },
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
            <Star className="w-12 h-12 text-amber-400 mx-auto mb-4" />
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

  const handleStatusUpdate = (id: number, status: "pending" | "approved" | "rejected", notes?: string) => {
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
              <span className="text-lg font-bold hidden sm:inline">Reviews</span>
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

        {/* Google Reviews Settings */}
        <Card className="mb-6 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Google Business Reviews</h3>
                {googleReviewsData?.configured && googleReviewsData.totalRatings > 0 && (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">
                    {googleReviewsData.totalRatings} reviews &middot; {googleReviewsData.rating} avg
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowGoogleSettings(!showGoogleSettings)}>
                {showGoogleSettings ? "Hide" : "Configure"}
              </Button>
            </div>
            {showGoogleSettings && (
              <div className="space-y-3 pt-2 border-t border-border/30">
                <p className="text-xs text-muted-foreground">
                  Enter your Google Place ID to automatically pull in Google Business reviews. They'll appear alongside in-app reviews on the homepage.
                  <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1 inline-flex items-center gap-0.5">
                    Find your Place ID <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. ChIJ..."
                    value={placeIdInput}
                    onChange={(e) => setPlaceIdInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => setPlaceId.mutate({ placeId: placeIdInput.trim() })}
                    disabled={setPlaceId.isPending}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Save
                  </Button>
                  {googlePlaceId?.placeId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refreshGoogle.mutate()}
                      disabled={refreshGoogle.isPending}
                      className="gap-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshGoogle.isPending ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  )}
                </div>
                {googleReviewsData?.configured && googleReviewsData.reviews.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Currently showing {googleReviewsData.reviews.length} Google reviews. Cache refreshes automatically every 24 hours.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6 border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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
            ) : reviews.length === 0 ? (
              <div className="text-center py-20">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                <p className="text-muted-foreground">No reviews found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="hidden md:table-cell">Service</TableHead>
                    <TableHead className="hidden lg:table-cell">Comment</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => {
                    const StatusIcon = STATUS_ICONS[review.status] || Clock;
                    return (
                      <TableRow
                        key={review.id}
                        className={`cursor-pointer hover:bg-muted/50 ${review.status === "pending" ? "font-semibold" : ""}`}
                        onClick={() => { setSelectedReviewId(review.id); setAdminNotes(""); }}
                      >
                        <TableCell>
                          <Badge variant="outline" className={`${STATUS_STYLES[review.status]} text-xs`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{review.reviewerName}</TableCell>
                        <TableCell>
                          <StarDisplay rating={review.rating} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                          {SERVICE_LABELS[review.serviceType] || review.serviceType}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[200px] truncate text-muted-foreground text-sm">
                          {review.comment || "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                          {new Date(review.createdAt).toLocaleDateString("en-AU", { timeZone: "Australia/Brisbane", day: "2-digit", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {review.status !== "approved" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusUpdate(review.id, "approved")}
                                title="Approve"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                              </Button>
                            )}
                            {review.status !== "rejected" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusUpdate(review.id, "rejected")}
                                title="Reject"
                              >
                                <XCircle className="w-3.5 h-3.5 text-red-500" />
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

      {/* Review Detail Dialog */}
      <Dialog open={!!selectedReviewId} onOpenChange={(open) => { if (!open) setSelectedReviewId(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              Review Details
            </DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`${STATUS_STYLES[selectedReview.status]} text-xs`}>
                  {selectedReview.status.charAt(0).toUpperCase() + selectedReview.status.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedReview.createdAt).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">{selectedReview.reviewerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex items-center gap-2">
                    <StarDisplay rating={selectedReview.rating} />
                    <span className="text-sm text-muted-foreground">({selectedReview.rating}/5)</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {SERVICE_LABELS[selectedReview.serviceType] || selectedReview.serviceType} &middot; Booking #{selectedReview.bookingReference}
                </div>
              </div>

              {selectedReview.comment && (
                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold mb-2">Comment</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap italic">"{selectedReview.comment}"</p>
                </div>
              )}

              {/* Admin Notes */}
              <div className="border-t border-border pt-4 space-y-3">
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  placeholder="Add internal notes about this review..."
                  value={adminNotes || selectedReview.adminNotes || ""}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedReview.status !== "approved" && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white gap-1"
                    onClick={() => { handleStatusUpdate(selectedReview.id, "approved", adminNotes || undefined); setSelectedReviewId(null); }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve
                  </Button>
                )}
                {selectedReview.status !== "rejected" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                    onClick={() => { handleStatusUpdate(selectedReview.id, "rejected", adminNotes || undefined); setSelectedReviewId(null); }}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </Button>
                )}
                {selectedReview.status === "rejected" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => { handleStatusUpdate(selectedReview.id, "pending", adminNotes || undefined); setSelectedReviewId(null); }}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Set Pending
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                  onClick={() => {
                    if (confirm("Are you sure you want to permanently delete this review?")) {
                      deleteReview.mutate({ id: selectedReview.id });
                    }
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
