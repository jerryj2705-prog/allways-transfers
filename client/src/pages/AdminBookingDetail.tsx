import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import {
  ChevronLeft, MapPin, Calendar, Users, Car, Truck, Phone, Mail, User,
  Clock, CheckCircle, XCircle, AlertCircle,
} from "lucide-react";
import { SERVICE_TYPES, BOOKING_STATUSES } from "@shared/types";
import type { ServiceType, BookingStatus } from "@shared/types";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export default function AdminBookingDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const bookingId = parseInt(params.id ?? "0", 10);

  const [newStatus, setNewStatus] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");

  const utils = trpc.useUtils();

  const { data: booking, isLoading } = trpc.bookings.getById.useQuery(
    { id: bookingId },
    { enabled: !!user && user.role === "admin" && bookingId > 0 }
  );

  const updateStatus = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Booking status updated successfully");
      utils.bookings.getById.invalidate({ id: bookingId });
      utils.bookings.list.invalidate();
      utils.bookings.stats.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  if (authLoading || isLoading) {
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

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Booking not found.</p>
          <Button onClick={() => setLocation("/admin")} variant="outline" className="bg-background">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const serviceLabel = SERVICE_TYPES[booking.serviceType as ServiceType]?.label ?? booking.serviceType;
  const statusLabel = BOOKING_STATUSES[booking.status as BookingStatus]?.label ?? booking.status;
  const statusStyle = STATUS_STYLES[booking.status] || "";

  const handleStatusUpdate = () => {
    if (!newStatus) return;
    updateStatus.mutate({
      id: bookingId,
      status: newStatus as BookingStatus,
      adminNotes: adminNotes || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <div className="border-b border-border/50 bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-20">
          <button
            onClick={() => setLocation("/admin")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <img src={LOGO_IMG} alt="All Ways Transfers" className="h-12 w-auto" />
          </div>
          <div className="w-32" />
        </div>
      </div>

      <div className="container py-8 max-w-4xl mx-auto">
        {/* Header Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-muted-foreground">Reference</p>
            <h1 className="font-heading text-2xl font-bold tracking-wider">{booking.referenceNumber}</h1>
          </div>
          <Badge variant="outline" className={`text-sm px-3 py-1 ${statusStyle}`}>
            {statusLabel}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Info */}
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-4">
                <p className="text-xs font-medium tracking-widest uppercase text-primary">Client Information</p>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">{booking.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{booking.clientEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{booking.clientPhone}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trip Details */}
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-4">
                <p className="text-xs font-medium tracking-widest uppercase text-primary">Trip Details</p>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Service Type</p>
                      <p className="font-medium">{serviceLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Pickup Date & Time</p>
                      <p className="font-medium">
                        {new Date(booking.pickupDate).toLocaleString("en-AU", {
                          timeZone: "Australia/Brisbane",
                          dateStyle: "full",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Pickup</p>
                      <p className="font-medium">{booking.pickupAddress}</p>
                    </div>
                  </div>
                  {booking.dropoffAddress && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Drop-off</p>
                        <p className="font-medium">{booking.dropoffAddress}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Passengers</p>
                      <p className="font-medium">{booking.passengerCount}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Car className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Vehicle</p>
                      <p className="font-medium">{booking.vehicleName}</p>
                    </div>
                  </div>
                  {booking.needsSupportVan === 1 && (
                    <div className="flex items-start gap-3">
                      <Truck className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Support Van</p>
                        <p className="font-medium">Required (+${parseFloat(booking.supportVanPrice ?? "0").toFixed(2)})</p>
                      </div>
                    </div>
                  )}
                </div>
                {booking.specialRequests && (
                  <div className="border-t border-border/50 pt-4">
                    <p className="text-muted-foreground text-sm mb-1">Special Requests</p>
                    <p className="text-sm">{booking.specialRequests}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-3">
                <p className="text-xs font-medium tracking-widest uppercase text-primary">Pricing</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SUV Base</span>
                    <span>${parseFloat(booking.basePrice ?? "0").toFixed(2)}</span>
                  </div>
                  {booking.needsSupportVan === 1 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Support Van</span>
                      <span>${parseFloat(booking.supportVanPrice ?? "0").toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-heading text-lg font-bold border-t border-border/50 pt-2">
                    <span>Total</span>
                    <span className="gold-text">${parseFloat(booking.totalPrice ?? "0").toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Update */}
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-4">
                <p className="text-xs font-medium tracking-widest uppercase text-primary">Update Status</p>
                <div className="space-y-3">
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="space-y-2">
                    <Label className="text-sm">Admin Notes (optional)</Label>
                    <Textarea
                      placeholder="Add notes about this booking..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={!newStatus || updateStatus.isPending}
                    className="w-full gold-gradient text-gold-foreground border-0 hover:opacity-90"
                  >
                    {updateStatus.isPending ? "Updating..." : "Update Status"}
                  </Button>
                </div>
                {booking.adminNotes && (
                  <div className="border-t border-border/50 pt-3">
                    <p className="text-xs text-muted-foreground mb-1">Previous Notes</p>
                    <p className="text-sm">{booking.adminNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-3">
                <p className="text-xs font-medium tracking-widest uppercase text-primary">Timestamps</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {new Date(booking.createdAt).toLocaleString("en-AU", {
                        timeZone: "Australia/Brisbane",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {new Date(booking.updatedAt).toLocaleString("en-AU", {
                        timeZone: "Australia/Brisbane",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
