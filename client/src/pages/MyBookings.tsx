import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  Plane, Clock, MapPin, Star, CalendarDays, Users,
  ArrowRight, Loader2, LogIn, ChevronRight, Car
} from "lucide-react";
import { SERVICE_TYPES, BOOKING_STATUSES, PAYMENT_METHODS } from "@shared/types";
import type { ServiceType, BookingStatus, PaymentMethod } from "@shared/types";

const SERVICE_ICONS: Record<string, React.ElementType> = {
  Plane, Clock, MapPin, Star,
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function MyBookings() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: bookings, isLoading } = trpc.bookings.myBookings.useQuery(undefined, {
    enabled: !!user,
  });

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

  const renderBookingCard = (booking: NonNullable<typeof bookings>[number]) => {
    const svcInfo = SERVICE_TYPES[booking.serviceType as ServiceType];
    const statusInfo = BOOKING_STATUSES[booking.status as BookingStatus];
    const paymentInfo = PAYMENT_METHODS[booking.paymentMethod as PaymentMethod];
    const Icon = SERVICE_ICONS[svcInfo?.icon ?? "Star"] || Star;

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
                <span className="text-xs text-muted-foreground">
                  {paymentInfo?.label ?? booking.paymentMethod} &middot;{" "}
                  <span className={booking.paymentStatus === "paid" ? "text-emerald-400" : "text-amber-400"}>
                    {booking.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                  </span>
                </span>
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
                  {upcoming.map(renderBookingCard)}
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
                  {past.map(renderBookingCard)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
