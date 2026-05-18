import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import {
  ChevronLeft, MapPin, Calendar, Users, Car, Truck, Phone, Mail, User,
  Clock, Baby, Dog, Pencil, Package, Navigation, FileDown, Loader2,
} from "lucide-react";
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

function toLocalDateTimeValue(timestamp: number): string {
  const d = new Date(timestamp);
  // Convert to AEST (UTC+10)
  const aest = new Date(d.getTime() + 10 * 60 * 60 * 1000);
  return aest.toISOString().slice(0, 16);
}

function fromLocalDateTimeValue(value: string): number {
  // Parse as AEST (UTC+10) — subtract 10 hours to get UTC
  const d = new Date(value + ":00.000Z");
  return d.getTime() - 10 * 60 * 60 * 1000;
}

export default function AdminBookingDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const bookingId = parseInt(params.id ?? "0", 10);

  const [newStatus, setNewStatus] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [pendingPaymentStatus, setPendingPaymentStatus] = useState<"unpaid" | "paid" | "refunded">("paid");
  const [paymentNote, setPaymentNote] = useState("");
  const [sendReceipt, setSendReceipt] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertPaymentMethod, setConvertPaymentMethod] = useState<"stripe_prepay" | "square_postpay" | "cash_postpay">("cash_postpay");

  // Edit form state
  const [editPickupAddress, setEditPickupAddress] = useState("");
  const [editDropoffAddress, setEditDropoffAddress] = useState("");
  const [editPickupDate, setEditPickupDate] = useState("");
  const [editPassengerCount, setEditPassengerCount] = useState(1);
  const [editBabyCount, setEditBabyCount] = useState(0);
  const [editLuggageCount, setEditLuggageCount] = useState(0);
  const [editStrollerCount, setEditStrollerCount] = useState(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>("cash_postpay");
  const [editSpecialRequests, setEditSpecialRequests] = useState("");

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

  const updatePaymentStatus = trpc.bookings.updatePaymentStatus.useMutation({
    onSuccess: () => {
      toast.success("Payment status updated successfully");
      utils.bookings.getById.invalidate({ id: bookingId });
      utils.bookings.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update payment status");
    },
  });

  const invoiceMutation = trpc.bookings.downloadInvoice.useMutation({
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
      toast.success("Invoice downloaded");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate invoice");
    },
  });

  const adminConvertQuote = trpc.bookings.adminConvertQuote.useMutation({
    onSuccess: () => {
      toast.success("Quote converted to booking successfully");
      setConvertDialogOpen(false);
      utils.bookings.getById.invalidate({ id: bookingId });
      utils.bookings.list.invalidate();
      utils.bookings.stats.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to convert quote");
    },
  });

  const adminModify = trpc.bookings.adminModify.useMutation({
    onSuccess: () => {
      toast.success("Booking details updated successfully");
      utils.bookings.getById.invalidate({ id: bookingId });
      utils.bookings.list.invalidate();
      setEditOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update booking details");
    },
  });

  // Populate edit form when booking loads or dialog opens
  useEffect(() => {
    if (booking && editOpen) {
      setEditPickupAddress(booking.pickupAddress);
      setEditDropoffAddress(booking.dropoffAddress ?? "");
      setEditPickupDate(toLocalDateTimeValue(booking.pickupDate));
      setEditPassengerCount(booking.passengerCount);
      setEditBabyCount(booking.babyCount ?? 0);
      setEditLuggageCount(booking.luggageCount ?? 0);
      setEditStrollerCount(booking.strollerCount ?? 0);
      setEditPaymentMethod(booking.paymentMethod ?? "cash_postpay");
      setEditSpecialRequests(booking.specialRequests ?? "");
    }
  }, [booking, editOpen]);

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
  const canEdit = booking.status !== "cancelled";
  const isQuoteOrExpired = booking.status === "quote" || booking.status === "expired";

  const handleStatusUpdate = () => {
    if (!newStatus) return;
    updateStatus.mutate({
      id: bookingId,
      status: newStatus as BookingStatus,
      adminNotes: adminNotes || undefined,
    });
  };

  const handleEditSave = () => {
    if (!editPickupAddress.trim()) {
      toast.error("Pickup address is required");
      return;
    }

    const pickupTimestamp = fromLocalDateTimeValue(editPickupDate);

    adminModify.mutate({
      bookingId,
      pickupAddress: editPickupAddress.trim(),
      dropoffAddress: editDropoffAddress.trim() || null,
      pickupDate: pickupTimestamp,
      passengerCount: editPassengerCount,
      babyCount: editBabyCount,
      luggageCount: editLuggageCount,
      strollerCount: editStrollerCount,
      paymentMethod: editPaymentMethod as any,
      specialRequests: editSpecialRequests.trim() || null,
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
            <img src={LOGO_IMG} alt="All Ways Transfers" className="h-16 w-auto" />
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
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={`text-sm px-3 py-1 ${statusStyle}`}>
              {statusLabel}
            </Badge>
            {isQuoteOrExpired && (
              <Button
                size="sm"
                className="gold-gradient text-gold-foreground hover:opacity-90 gap-1.5"
                onClick={() => setConvertDialogOpen(true)}
              >
                Convert to Booking
              </Button>
            )}
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent gap-1.5"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Details
              </Button>
            )}
            {booking.status !== "quote" && (
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent gap-1.5"
                onClick={() => invoiceMutation.mutate({ referenceNumber: booking.referenceNumber })}
                disabled={invoiceMutation.isPending}
              >
                {invoiceMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                Invoice
              </Button>
            )}
          </div>
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
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium tracking-widest uppercase text-primary">Trip Details</p>
                  {canEdit && (
                    <button
                      onClick={() => setEditOpen(true)}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
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
                      <p className="font-medium">{booking.passengerCount}{(booking.babyCount ?? 0) > 0 ? ` (incl. ${booking.babyCount} baby/toddler${booking.babyCount !== 1 ? "s" : ""})` : ""}</p>
                    </div>
                  </div>
                  {(booking.luggageCount ?? 0) > 0 && (
                    <div className="flex items-start gap-3">
                      <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Luggage</p>
                        <p className="font-medium">{booking.luggageCount}{(booking.strollerCount ?? 0) > 0 ? ` (incl. ${booking.strollerCount} stroller${booking.strollerCount !== 1 ? "s" : ""})` : ""}</p>
                      </div>
                    </div>
                  )}
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
                  {(booking.rearFacingSeats > 0 || booking.forwardFacingSeats > 0 || booking.boosterSeats > 0) && (
                    <div className="flex items-start gap-3 col-span-2">
                      <Baby className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Child Seats</p>
                        <p className="font-medium">
                          {[booking.rearFacingSeats > 0 && `${booking.rearFacingSeats} Rear-Facing`, booking.forwardFacingSeats > 0 && `${booking.forwardFacingSeats} Forward-Facing`, booking.boosterSeats > 0 && `${booking.boosterSeats} Booster`].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                  {booking.isPetFriendly === 1 && (
                    <>
                      {booking.numberOfPets != null && booking.numberOfPets > 0 && (
                        <div className="flex items-start gap-3">
                          <Dog className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-muted-foreground">Number of Pets</p>
                            <p className="font-medium">{booking.numberOfPets}</p>
                          </div>
                        </div>
                      )}
                      <div className={`flex items-start gap-3 ${!booking.numberOfPets ? 'col-span-2' : ''}`}>
                        <Dog className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Pet(s) Description</p>
                          <p className="font-medium">{booking.petDescription || "Yes"}</p>
                        </div>
                      </div>
                    </>
                  )}
                  {booking.serviceType === "freight" && booking.freightDescription && (
                    <>
                      <div className="flex items-start gap-3">
                        <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Item Description</p>
                          <p className="font-medium">{booking.freightDescription}</p>
                        </div>
                      </div>
                      {booking.freightWeight && (
                        <div className="flex items-start gap-3">
                          <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-muted-foreground">Estimated Weight</p>
                            <p className="font-medium">{{
                              under_10kg: "Under 10 kg",
                              "10_25kg": "10 \u2013 25 kg",
                              "25_50kg": "25 \u2013 50 kg",
                              "50_100kg": "50 \u2013 100 kg",
                              "100_plus": "100+ kg",
                            }[booking.freightWeight] || booking.freightWeight}</p>
                          </div>
                        </div>
                      )}
                      {booking.freightItemCount != null && booking.freightItemCount > 0 && (
                        <div className="flex items-start gap-3">
                          <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-muted-foreground">Number of Items</p>
                            <p className="font-medium">{booking.freightItemCount}</p>
                          </div>
                        </div>
                      )}
                      {booking.freightSpecialHandling && (
                        <div className="flex items-start gap-3">
                          <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-muted-foreground">Special Handling</p>
                            <p className="font-medium">{booking.freightSpecialHandling}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {booking.routePreference && (
                    <div className="flex items-start gap-3">
                      <Navigation className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Route Preference</p>
                        <p className={`font-medium ${booking.routePreference === 'toll_free' ? 'text-emerald-400' : ''}`}>
                          {booking.routePreference === 'toll_free' ? 'Toll-Free Route' : 'Fastest Route'}
                        </p>
                      </div>
                    </div>
                  )}
                  {booking.tollOverride != null && parseFloat(booking.tollOverride) > 0 && (
                    <div className="flex items-start gap-3">
                      <Navigation className="w-4 h-4 text-amber-400 mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Toll Override</p>
                        <p className="font-medium text-amber-400">${parseFloat(booking.tollOverride).toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                  {((booking.additionalPickupCount ?? 0) > 0 || (booking.additionalDropoffCount ?? 0) > 0) && (
                    <div className="flex items-start gap-3 col-span-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-muted-foreground">Additional Stops</p>
                        {(booking.additionalPickupCount ?? 0) > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground">Additional Pickups ({booking.additionalPickupCount})</p>
                            {(() => {
                              try {
                                const addrs = JSON.parse(booking.additionalPickupAddresses || "[]");
                                return addrs.map((addr: string, i: number) => (
                                  <p key={i} className="font-medium text-sm">{addr}</p>
                                ));
                              } catch { return null; }
                            })()}
                          </div>
                        )}
                        {(booking.additionalDropoffCount ?? 0) > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground">Additional Drop-offs ({booking.additionalDropoffCount})</p>
                            {(() => {
                              try {
                                const addrs = JSON.parse(booking.additionalDropoffAddresses || "[]");
                                return addrs.map((addr: string, i: number) => (
                                  <p key={i} className="font-medium text-sm">{addr}</p>
                                ));
                              } catch { return null; }
                            })()}
                          </div>
                        )}
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
                  {parseFloat(booking.additionalStopsSurcharge ?? "0") > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Additional Stops</span>
                      <span>${parseFloat(booking.additionalStopsSurcharge ?? "0").toFixed(2)}</span>
                    </div>
                  )}
                  {parseFloat(booking.publicHolidaySurcharge ?? "0") > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Public Holiday</span>
                      <span>${parseFloat(booking.publicHolidaySurcharge ?? "0").toFixed(2)}</span>
                    </div>
                  )}
                  {booking.publicHolidayName && (
                    <div className="text-xs text-amber-400">
                      Holiday: {booking.publicHolidayName}
                    </div>
                  )}
                  {parseFloat(booking.airportTollSurcharge ?? "0") > 0 && (
                    <>
                      {(() => {
                        try {
                          const details = JSON.parse(booking.airportTollDetails || "[]");
                          return details.map((toll: { airport: string; direction: string; amount: number }, idx: number) => (
                            <div key={`airport-toll-${idx}`} className="flex justify-between text-amber-400">
                              <span>{toll.airport} {toll.direction} toll</span>
                              <span>${toll.amount.toFixed(2)}</span>
                            </div>
                          ));
                        } catch {
                          return (
                            <div className="flex justify-between text-amber-400">
                              <span>Airport Tolls</span>
                              <span>${parseFloat(booking.airportTollSurcharge ?? "0").toFixed(2)}</span>
                            </div>
                          );
                        }
                      })()}
                    </>
                  )}
                  {parseFloat(booking.roadTollSurcharge ?? "0") > 0 && (
                    <>
                      {(() => {
                        try {
                          const details = JSON.parse(booking.roadTollDetails || "[]");
                          return details.map((toll: { road: string; amount: number }, idx: number) => (
                            <div key={`road-toll-${idx}`} className="flex justify-between text-amber-400">
                              <span>{toll.road} Toll</span>
                              <span>${toll.amount.toFixed(2)}</span>
                            </div>
                          ));
                        } catch {
                          return (
                            <div className="flex justify-between text-amber-400">
                              <span>Road Tolls</span>
                              <span>${parseFloat(booking.roadTollSurcharge ?? "0").toFixed(2)}</span>
                            </div>
                          );
                        }
                      })()}
                    </>
                  )}
                  <div className="flex justify-between font-heading text-lg font-bold border-t border-border/50 pt-2">
                    <span>Total</span>
                    <span className="gold-text">${parseFloat(booking.totalPrice ?? "0").toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-3">
                <p className="text-xs font-medium tracking-widest uppercase text-primary">Payment</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span className="font-medium">{booking.paymentMethod ? PAYMENT_METHODS[booking.paymentMethod as PaymentMethod]?.label : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline" className={`text-xs ${
                      booking.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                      booking.paymentStatus === "refunded" ? "bg-blue-100 text-blue-800 border-blue-200" :
                      "bg-amber-100 text-amber-800 border-amber-200"
                    }`}>
                      {booking.paymentStatus === "paid" ? "Paid" : booking.paymentStatus === "refunded" ? "Refunded" : "Unpaid"}
                    </Badge>
                  </div>
                </div>
                {booking.paymentNote && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Note</span>
                    <span className="text-xs text-right max-w-[200px]">{booking.paymentNote}</span>
                  </div>
                )}
                {/* Payment Proof for direct deposit */}
                {booking.paymentMethod === "direct_deposit" && (
                  <div className="border-t border-border/50 pt-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Payment Proof</p>
                    {booking.paymentProofUrl ? (
                      <div className="rounded-lg border border-border/50 overflow-hidden">
                        {booking.paymentProofUrl.endsWith(".pdf") ? (
                          <a
                            href={booking.paymentProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors"
                          >
                            <Package className="w-8 h-8 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Payment Proof (PDF)</p>
                              <p className="text-xs text-muted-foreground">Click to view</p>
                            </div>
                          </a>
                        ) : (
                          <a href={booking.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={booking.paymentProofUrl}
                              alt="Payment proof"
                              className="w-full max-h-48 object-contain bg-black/20 cursor-pointer"
                            />
                          </a>
                        )}
                        <div className="px-3 py-1.5 bg-muted/30 text-xs text-muted-foreground">
                          Uploaded by client
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-400 italic">No payment proof uploaded yet</p>
                    )}
                  </div>
                )}
                {/* Quick Mark as Paid button for direct deposit unpaid bookings */}
                {booking.paymentMethod === "direct_deposit" && booking.paymentStatus === "unpaid" && (
                  <div className="border-t border-border/50 pt-3">
                    <Button
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0 gap-2"
                      disabled={updatePaymentStatus.isPending}
                      onClick={() => {
                        setPendingPaymentStatus("paid");
                        setPaymentNote("Bank transfer received");
                        setSendReceipt(true);
                        setPaymentDialogOpen(true);
                      }}
                    >
                      <Mail className="h-4 w-4" />
                      Mark as Paid & Send Receipt
                    </Button>
                  </div>
                )}
                <div className="border-t border-border/50 pt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Update Payment Status</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={booking.paymentStatus === "unpaid" ? "default" : "outline"}
                      className={`flex-1 text-xs ${booking.paymentStatus === "unpaid" ? "bg-amber-600 hover:bg-amber-700 text-white border-0" : "bg-transparent"}`}
                      disabled={booking.paymentStatus === "unpaid" || updatePaymentStatus.isPending}
                      onClick={() => { setPendingPaymentStatus("unpaid"); setPaymentNote(""); setSendReceipt(false); setPaymentDialogOpen(true); }}
                    >
                      Unpaid
                    </Button>
                    <Button
                      size="sm"
                      variant={booking.paymentStatus === "paid" ? "default" : "outline"}
                      className={`flex-1 text-xs ${booking.paymentStatus === "paid" ? "bg-emerald-600 hover:bg-emerald-700 text-white border-0" : "bg-transparent"}`}
                      disabled={booking.paymentStatus === "paid" || updatePaymentStatus.isPending}
                      onClick={() => { setPendingPaymentStatus("paid"); setPaymentNote(""); setSendReceipt(false); setPaymentDialogOpen(true); }}
                    >
                      Paid
                    </Button>
                    <Button
                      size="sm"
                      variant={booking.paymentStatus === "refunded" ? "default" : "outline"}
                      className={`flex-1 text-xs ${booking.paymentStatus === "refunded" ? "bg-blue-600 hover:bg-blue-700 text-white border-0" : "bg-transparent"}`}
                      disabled={booking.paymentStatus === "refunded" || updatePaymentStatus.isPending}
                      onClick={() => { setPendingPaymentStatus("refunded"); setPaymentNote(""); setSendReceipt(false); setPaymentDialogOpen(true); }}
                    >
                      Refunded
                    </Button>
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

      {/* Edit Booking Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Booking Details</DialogTitle>
            <DialogDescription>
              Modify the trip details for booking {booking.referenceNumber}. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-pickup-date">Pickup Date & Time (AEST)</Label>
              <Input
                id="edit-pickup-date"
                type="datetime-local"
                value={editPickupDate}
                onChange={(e) => setEditPickupDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-pickup-address">Pickup Address</Label>
              <Input
                id="edit-pickup-address"
                value={editPickupAddress}
                onChange={(e) => setEditPickupAddress(e.target.value)}
                placeholder="Enter pickup address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dropoff-address">Drop-off Address</Label>
              <Input
                id="edit-dropoff-address"
                value={editDropoffAddress}
                onChange={(e) => setEditDropoffAddress(e.target.value)}
                placeholder="Enter drop-off address (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-passengers">Passengers</Label>
              <Select
                value={editPassengerCount.toString()}
                onValueChange={(v) => setEditPassengerCount(parseInt(v, 10))}
              >
                <SelectTrigger id="edit-passengers">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} {n === 1 ? "passenger" : "passengers"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-babies">Of which, Babies/Toddlers</Label>
              <Input
                id="edit-babies"
                type="number"
                min={0}
                max={editPassengerCount}
                value={editBabyCount}
                onChange={(e) => setEditBabyCount(Math.min(editPassengerCount, parseInt(e.target.value, 10) || 0))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-luggage">Luggage Items</Label>
                <Input
                  id="edit-luggage"
                  type="number"
                  min={0}
                  max={20}
                  value={editLuggageCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 0;
                    setEditLuggageCount(val);
                    if (editStrollerCount > val) setEditStrollerCount(val);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-strollers">Of which, Strollers</Label>
                <Input
                  id="edit-strollers"
                  type="number"
                  min={0}
                  max={editLuggageCount}
                  value={editStrollerCount}
                  onChange={(e) => setEditStrollerCount(Math.min(editLuggageCount, parseInt(e.target.value, 10) || 0))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-payment-method">Payment Method</Label>
              <Select
                value={editPaymentMethod}
                onValueChange={(v) => setEditPaymentMethod(v)}
              >
                <SelectTrigger id="edit-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe_prepay">Card (Stripe Pre-Pay)</SelectItem>
                  <SelectItem value="square_postpay">Card (Square Post-Pay)</SelectItem>
                  <SelectItem value="cash_postpay">Cash (Pay Driver)</SelectItem>
                  <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-special-requests">Special Requests</Label>
              <Textarea
                id="edit-special-requests"
                value={editSpecialRequests}
                onChange={(e) => setEditSpecialRequests(e.target.value)}
                placeholder="Any special requirements..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={adminModify.isPending}
              className="gold-gradient text-gold-foreground border-0 hover:opacity-90"
            >
              {adminModify.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Status Change Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Payment Status</DialogTitle>
            <DialogDescription>
              Change payment status to <span className="font-semibold capitalize">{pendingPaymentStatus}</span>. Please provide a reason for this change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Reason / Note</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {["Cash payment", "Card to driver", "Bank transfer", "Refund processed", "Payment reversed"].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    size="sm"
                    variant="outline"
                    className={`text-xs h-7 ${paymentNote === preset ? "bg-primary/20 border-primary" : "bg-transparent"}`}
                    onClick={() => setPaymentNote(preset)}
                  >
                    {preset}
                  </Button>
                ))}
              </div>
              <Textarea
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Enter reason for payment status change..."
                rows={2}
              />
            </div>
            {pendingPaymentStatus === "paid" && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <input
                  type="checkbox"
                  id="sendReceipt"
                  checked={sendReceipt}
                  onChange={(e) => setSendReceipt(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-emerald-600"
                />
                <label htmlFor="sendReceipt" className="text-sm cursor-pointer">
                  <span className="font-medium">Send payment receipt email</span>
                  <span className="block text-xs text-muted-foreground">Client will receive a payment confirmation email</span>
                </label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={() => {
                updatePaymentStatus.mutate({
                  id: bookingId,
                  paymentStatus: pendingPaymentStatus,
                  paymentNote: paymentNote || undefined,
                  sendReceipt: sendReceipt,
                });
                setPaymentDialogOpen(false);
              }}
              disabled={updatePaymentStatus.isPending}
              className="gold-gradient text-gold-foreground border-0 hover:opacity-90"
            >
              {updatePaymentStatus.isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert Quote to Booking Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convert Quote to Booking</DialogTitle>
            <DialogDescription>
              Convert quote <strong>{booking.referenceNumber}</strong> to an active booking. The client will receive a booking confirmation email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm">Payment Method</Label>
              <Select value={convertPaymentMethod} onValueChange={(v) => setConvertPaymentMethod(v as any)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash_postpay">Pay Driver by Cash</SelectItem>
                  <SelectItem value="square_postpay">Pay Driver by Card</SelectItem>
                  <SelectItem value="stripe_prepay">Pre-pay by Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
              <p className="text-sm text-muted-foreground">
                <strong>Client:</strong> {booking.clientName} ({booking.clientEmail})<br/>
                <strong>Service:</strong> {serviceLabel}<br/>
                <strong>Total:</strong> ${parseFloat(booking.totalPrice ?? "0").toFixed(2)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={() => {
                adminConvertQuote.mutate({
                  bookingId: booking.id,
                  paymentMethod: convertPaymentMethod,
                  origin: window.location.origin,
                });
              }}
              disabled={adminConvertQuote.isPending}
              className="gold-gradient text-gold-foreground border-0 hover:opacity-90"
            >
              {adminConvertQuote.isPending ? "Converting..." : "Convert to Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
