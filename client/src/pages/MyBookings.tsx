import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  Plane, Clock, MapPin, Star, CalendarDays, Users,
  ArrowRight, Loader2, LogIn, ChevronRight, Car,
  XCircle, AlertTriangle, ShieldAlert, CheckCircle2,
  Pencil
} from "lucide-react";
import { SERVICE_TYPES, BOOKING_STATUSES, PAYMENT_METHODS } from "@shared/types";
import type { ServiceType, BookingStatus, PaymentMethod } from "@shared/types";
import { toast } from "sonner";

const SERVICE_ICONS: Record<string, React.ElementType> = {
  Plane, Clock, MapPin, Star,
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

// Generate 15-minute time slots in 24h format
const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
});

export default function MyBookings() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: bookings, isLoading } = trpc.bookings.myBookings.useQuery(undefined, {
    enabled: !!user,
  });

  // Cancellation dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelTermsAccepted, setCancelTermsAccepted] = useState(false);

  // Modification dialog state
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [modifyBookingId, setModifyBookingId] = useState<number | null>(null);
  const [modifyPickupAddress, setModifyPickupAddress] = useState("");
  const [modifyDropoffAddress, setModifyDropoffAddress] = useState("");
  const [modifyDate, setModifyDate] = useState<Date | undefined>(undefined);
  const [modifyTime, setModifyTime] = useState("");
  const [modifyPassengers, setModifyPassengers] = useState(1);
  const [modifySpecialRequests, setModifySpecialRequests] = useState("");
  const [modifyCalendarOpen, setModifyCalendarOpen] = useState(false);
  const [modifyTimeOpen, setModifyTimeOpen] = useState(false);

  const cancelBooking = bookings?.find(b => b.id === cancelBookingId);
  const modifyBooking = bookings?.find(b => b.id === modifyBookingId);

  const { data: cancellationPolicy, isLoading: policyLoading } = trpc.bookings.cancellationPolicy.useQuery(
    { bookingId: cancelBookingId! },
    { enabled: cancelDialogOpen && cancelBookingId !== null }
  );

  const cancelMutation = trpc.bookings.cancel.useMutation({
    onSuccess: () => {
      toast.success("Booking cancelled successfully");
      setCancelDialogOpen(false);
      setCancelBookingId(null);
      setCancelReason("");
      setCancelTermsAccepted(false);
      utils.bookings.myBookings.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel booking");
    },
  });

  const modifyMutation = trpc.bookings.modify.useMutation({
    onSuccess: () => {
      toast.success("Booking modified successfully");
      setModifyDialogOpen(false);
      setModifyBookingId(null);
      utils.bookings.myBookings.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to modify booking");
    },
  });

  const handleCancelClick = (e: React.MouseEvent, bookingId: number) => {
    e.stopPropagation();
    setCancelBookingId(bookingId);
    setCancelReason("");
    setCancelTermsAccepted(false);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!cancelBookingId || !cancelTermsAccepted) return;
    cancelMutation.mutate({
      bookingId: cancelBookingId,
      reason: cancelReason || undefined,
      termsAccepted: cancelTermsAccepted,
    });
  };

  const handleModifyClick = (e: React.MouseEvent, bookingId: number) => {
    e.stopPropagation();
    const booking = bookings?.find(b => b.id === bookingId);
    if (!booking) return;

    const pickupDt = new Date(booking.pickupDate);
    // Extract AEST time components using locale formatting to avoid UTC offset issues
    const aestTime = pickupDt.toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Australia/Brisbane",
    });
    // Get the correct local date for the calendar
    const aestDateStr = pickupDt.toLocaleDateString("en-CA", { timeZone: "Australia/Brisbane" }); // YYYY-MM-DD
    const [y, mo, d] = aestDateStr.split("-").map(Number);
    const localDate = new Date(y, mo - 1, d);

    setModifyBookingId(bookingId);
    setModifyPickupAddress(booking.pickupAddress);
    setModifyDropoffAddress(booking.dropoffAddress ?? "");
    setModifyDate(localDate);
    setModifyTime(aestTime);
    setModifyPassengers(booking.passengerCount);
    setModifySpecialRequests(booking.specialRequests ?? "");
    setModifyDialogOpen(true);
  };

  const handleConfirmModify = () => {
    if (!modifyBookingId || !modifyDate || !modifyTime) return;

    const [hours, minutes] = modifyTime.split(":").map(Number);
    const newPickupDate = new Date(modifyDate);
    newPickupDate.setHours(hours, minutes, 0, 0);

    modifyMutation.mutate({
      bookingId: modifyBookingId,
      pickupAddress: modifyPickupAddress,
      dropoffAddress: modifyDropoffAddress || undefined,
      pickupDate: newPickupDate.getTime(),
      passengerCount: modifyPassengers,
      specialRequests: modifySpecialRequests,
    });
  };

  // Check if anything changed from original booking
  const hasModifyChanges = useMemo(() => {
    if (!modifyBooking || !modifyDate || !modifyTime) return false;
    const origDt = new Date(modifyBooking.pickupDate);
    const [h, m] = modifyTime.split(":").map(Number);
    const newDt = new Date(modifyDate);
    newDt.setHours(h, m, 0, 0);

    return (
      modifyPickupAddress !== modifyBooking.pickupAddress ||
      modifyDropoffAddress !== (modifyBooking.dropoffAddress ?? "") ||
      newDt.getTime() !== modifyBooking.pickupDate ||
      modifyPassengers !== modifyBooking.passengerCount ||
      modifySpecialRequests !== (modifyBooking.specialRequests ?? "")
    );
  }, [modifyBooking, modifyPickupAddress, modifyDropoffAddress, modifyDate, modifyTime, modifyPassengers, modifySpecialRequests]);

  const now = Date.now();
  const upcoming = bookings?.filter(b => b.pickupDate >= now && b.status !== "cancelled") ?? [];
  const past = bookings?.filter(b => b.pickupDate < now || b.status === "cancelled") ?? [];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl py-20 text-center space-y-6">
          <div className="w-16 h-16 rounded-full gold-gradient mx-auto flex items-center justify-center">
            <LogIn className="w-8 h-8 text-gold-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-bold">Sign In to View Your Bookings</h1>
          <p className="text-muted-foreground text-lg">
            Log in to access your booking history and manage upcoming trips.
          </p>
          <Button
            className="gold-gradient text-gold-foreground hover:opacity-90"
            onClick={() => { window.location.href = getLoginUrl(); }}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Australia/Brisbane",
    });
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Australia/Brisbane",
    });
  };

  const renderBookingCard = (booking: NonNullable<typeof bookings>[number], showActions: boolean) => {
    const svcInfo = SERVICE_TYPES[booking.serviceType as ServiceType];
    const statusInfo = BOOKING_STATUSES[booking.status as BookingStatus];
    const paymentInfo = PAYMENT_METHODS[booking.paymentMethod as PaymentMethod];
    const Icon = SERVICE_ICONS[svcInfo?.icon ?? "Star"] || Star;
    const canModify = showActions && (booking.status === "pending" || booking.status === "confirmed");
    const canCancel = showActions && booking.status !== "cancelled" && booking.status !== "completed";

    return (
      <Card
        key={booking.id}
        className="group hover:shadow-lg transition-all duration-200 border-border/50 cursor-pointer"
        onClick={() => setLocation(`/booking/${booking.referenceNumber}`)}
      >
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Icon */}
            <div className="hidden sm:flex w-12 h-12 rounded-xl gold-gradient items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-gold-foreground" />
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading font-semibold text-lg">{svcInfo?.label ?? booking.serviceType}</h3>
                    <Badge variant="outline" className={STATUS_STYLES[booking.status] ?? ""}>
                      {statusInfo?.label ?? booking.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{booking.referenceNumber}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="w-4 h-4 shrink-0" />
                  <span>{formatDate(booking.pickupDate)} at {formatTime(booking.pickupDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>{booking.passengerCount} passenger{booking.passengerCount !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground col-span-1 sm:col-span-2">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {booking.pickupAddress}
                    {booking.dropoffAddress && (
                      <>
                        <ArrowRight className="w-3 h-3 inline mx-1" />
                        {booking.dropoffAddress}
                      </>
                    )}
                  </span>
                </div>
                {booking.vehicleName && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Car className="w-4 h-4 shrink-0" />
                    <span>{booking.vehicleName}</span>
                  </div>
                )}
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    {paymentInfo?.label ?? booking.paymentMethod} &middot;{" "}
                    <span className={booking.paymentStatus === "paid" ? "text-emerald-400" : booking.paymentStatus === "refunded" ? "text-blue-400" : "text-amber-400"}>
                      {booking.paymentStatus === "paid" ? "Paid" : booking.paymentStatus === "refunded" ? "Refunded" : "Unpaid"}
                    </span>
                  </span>
                  {canModify && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300 h-7 text-xs"
                      onClick={(e) => handleModifyClick(e, booking.id)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Modify
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300 h-7 text-xs"
                      onClick={(e) => handleCancelClick(e, booking.id)}
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
                <span className="font-heading font-bold text-lg gold-text">
                  ${parseFloat(booking.totalPrice).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getPolicyIcon = () => {
    if (!cancellationPolicy) return null;
    switch (cancellationPolicy.tier) {
      case "free":
        return <CheckCircle2 className="w-10 h-10 text-emerald-400" />;
      case "partial_charge":
        return <AlertTriangle className="w-10 h-10 text-amber-400" />;
      case "no_refund":
        return <ShieldAlert className="w-10 h-10 text-red-400" />;
    }
  };

  const getPolicyBorderColor = () => {
    if (!cancellationPolicy) return "border-border";
    switch (cancellationPolicy.tier) {
      case "free": return "border-emerald-500/30";
      case "partial_charge": return "border-amber-500/30";
      case "no_refund": return "border-red-500/30";
    }
  };

  const getPolicyBgColor = () => {
    if (!cancellationPolicy) return "";
    switch (cancellationPolicy.tier) {
      case "free": return "bg-emerald-500/5";
      case "partial_charge": return "bg-amber-500/5";
      case "no_refund": return "bg-red-500/5";
    }
  };

  const getPolicyTitle = () => {
    if (!cancellationPolicy) return "Cancellation Policy";
    switch (cancellationPolicy.tier) {
      case "free": return "Free Cancellation";
      case "partial_charge": return "Late Cancellation Warning";
      case "no_refund": return "No Refund Available";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container max-w-4xl py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold">My Bookings</h1>
              <p className="text-muted-foreground mt-1">
                {bookings?.length ?? 0} booking{(bookings?.length ?? 0) !== 1 ? "s" : ""} total
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setLocation("/")}>
                Home
              </Button>
              <Button
                className="gold-gradient text-gold-foreground hover:opacity-90"
                onClick={() => setLocation("/book")}
              >
                New Booking
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl py-8 space-y-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
              <CalendarDays className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-heading text-xl font-semibold">No Bookings Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              You haven't made any bookings yet. Book your first chauffeur transfer today.
            </p>
            <Button
              className="gold-gradient text-gold-foreground hover:opacity-90"
              onClick={() => setLocation("/book")}
            >
              Book Your First Ride
            </Button>
          </div>
        ) : (
          <>
            {/* Upcoming Bookings */}
            {upcoming.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <h2 className="font-heading text-xl font-semibold">Upcoming</h2>
                  <span className="text-sm text-muted-foreground">({upcoming.length})</span>
                </div>
                <div className="space-y-3">
                  {upcoming.map(b => renderBookingCard(b, true))}
                </div>
              </section>
            )}

            {/* Past Bookings */}
            {past.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <h2 className="font-heading text-xl font-semibold">Past & Cancelled</h2>
                  <span className="text-sm text-muted-foreground">({past.length})</span>
                </div>
                <div className="space-y-3">
                  {past.map(b => renderBookingCard(b, false))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Cancellation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCancelDialogOpen(false);
          setCancelBookingId(null);
          setCancelReason("");
          setCancelTermsAccepted(false);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Cancel Booking</DialogTitle>
            {cancelBooking && (
              <DialogDescription>
                {cancelBooking.referenceNumber} &middot; {formatDate(cancelBooking.pickupDate)} at {formatTime(cancelBooking.pickupDate)}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Policy tier display */}
            {policyLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : cancellationPolicy && (
              <div className={`rounded-lg border p-4 space-y-3 ${getPolicyBorderColor()} ${getPolicyBgColor()}`}>
                <div className="flex items-start gap-3">
                  {getPolicyIcon()}
                  <div className="space-y-1">
                    <h4 className="font-heading font-semibold text-base">{getPolicyTitle()}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {cancellationPolicy.message}
                    </p>
                  </div>
                </div>

                {cancellationPolicy.tier === "partial_charge" && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 mt-2">
                    <p className="text-sm text-amber-300 font-medium">
                      You are cancelling less than 24 hours before your scheduled pickup. A {cancellationPolicy.chargePercent}% charge of the booking fee (${cancelBooking ? (parseFloat(cancelBooking.totalPrice) * cancellationPolicy.chargePercent / 100).toFixed(2) : "0.00"}) will apply.
                    </p>
                  </div>
                )}

                {cancellationPolicy.tier === "no_refund" && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 mt-2">
                    <p className="text-sm text-red-300 font-medium">
                      You are cancelling less than 4 hours before your scheduled pickup. No refund will be provided for this cancellation.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Reason (optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for cancellation (optional)</label>
              <Textarea
                placeholder="Please let us know why you're cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            {/* Terms acceptance */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/50">
              <Checkbox
                id="cancel-terms"
                checked={cancelTermsAccepted}
                onCheckedChange={(checked) => setCancelTermsAccepted(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="cancel-terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                I understand and accept the cancellation policy{" "}
                {cancellationPolicy?.tier === "partial_charge" && `including that a ${cancellationPolicy.chargePercent}% charge of the booking fee will apply`}
                {cancellationPolicy?.tier === "no_refund" && "including that no refund will be provided"}
                . I agree to the Terms and Conditions.
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={!cancelTermsAccepted || cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirm Cancellation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modification Dialog */}
      <Dialog open={modifyDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setModifyDialogOpen(false);
          setModifyBookingId(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Modify Booking</DialogTitle>
            {modifyBooking && (
              <DialogDescription>
                {modifyBooking.referenceNumber} &middot; Update your trip details below
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Info notice */}
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
              <div className="flex items-start gap-2">
                <Pencil className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-300">
                  You can update the pickup address, drop-off address, date, time, passengers, and special requests. Vehicle and service type changes require a new booking.
                </p>
              </div>
            </div>

            {/* Pickup Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Pickup Address
              </label>
              <Input
                value={modifyPickupAddress}
                onChange={(e) => setModifyPickupAddress(e.target.value)}
                placeholder="Enter pickup address"
              />
            </div>

            {/* Drop-off Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Drop-off Address
              </label>
              <Input
                value={modifyDropoffAddress}
                onChange={(e) => setModifyDropoffAddress(e.target.value)}
                placeholder="Enter drop-off address"
              />
            </div>

            {/* Date & Time row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Date picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  Pickup Date
                </label>
                <Popover open={modifyCalendarOpen} onOpenChange={setModifyCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
                      {modifyDate
                        ? modifyDate.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={modifyDate}
                      onSelect={(date) => {
                        setModifyDate(date);
                        setModifyCalendarOpen(false);
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Pickup Time
                </label>
                <Popover open={modifyTimeOpen} onOpenChange={setModifyTimeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                      {modifyTime || "Select time"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0" align="start">
                    <ScrollArea className="h-60">
                      <div className="p-1">
                        {TIME_SLOTS.map((slot) => (
                          <button
                            key={slot}
                            className={`w-full text-left px-3 py-1.5 rounded text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                              modifyTime === slot ? "bg-primary text-primary-foreground" : ""
                            }`}
                            onClick={() => {
                              setModifyTime(slot);
                              setModifyTimeOpen(false);
                            }}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground mt-1">Times are in Queensland local time (AEST/UTC+10)</p>
              </div>
            </div>

            {/* Passengers */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                Number of Passengers
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => setModifyPassengers(Math.max(1, modifyPassengers - 1))}
                  disabled={modifyPassengers <= 1}
                >
                  -
                </Button>
                <span className="text-lg font-semibold w-8 text-center">{modifyPassengers}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => setModifyPassengers(Math.min(7, modifyPassengers + 1))}
                  disabled={modifyPassengers >= 7}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Special Requests */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Special Requests</label>
              <Textarea
                placeholder="Any additional requirements or notes..."
                value={modifySpecialRequests}
                onChange={(e) => setModifySpecialRequests(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setModifyDialogOpen(false)}
            >
              Discard Changes
            </Button>
            <Button
              className="gold-gradient text-gold-foreground hover:opacity-90"
              onClick={handleConfirmModify}
              disabled={!hasModifyChanges || modifyMutation.isPending || !modifyPickupAddress}
            >
              {modifyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
