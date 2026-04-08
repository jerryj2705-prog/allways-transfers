import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { CheckCircle, Copy, Home, Calendar, MapPin, Users, Car } from "lucide-react";
import { toast } from "sonner";
import { SERVICE_TYPES } from "@shared/types";
import type { ServiceType } from "@shared/types";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

export default function BookingConfirmation() {
  const params = useParams<{ ref: string }>();
  const [, setLocation] = useLocation();

  const { data: booking, isLoading } = trpc.bookings.getByReference.useQuery(
    { referenceNumber: params.ref ?? "" },
    { enabled: !!params.ref }
  );

  const copyRef = () => {
    if (booking?.referenceNumber) {
      navigator.clipboard.writeText(booking.referenceNumber);
      toast.success("Reference number copied!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading confirmation...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Booking not found.</p>
        <Button onClick={() => setLocation("/")} variant="outline" className="bg-background">
          Return Home
        </Button>
      </div>
    );
  }

  const serviceLabel = SERVICE_TYPES[booking.serviceType as ServiceType]?.label ?? booking.serviceType;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <div className="border-b border-border/50 bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-center h-20">
          <div className="flex items-center gap-3">
            <img src={LOGO_IMG} alt="All Ways Transfers" className="h-12 w-auto" />
          </div>
        </div>
      </div>

      <div className="container py-12 max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8 space-y-4">
          <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-gold-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-bold">Thank You!</h1>
          <p className="text-muted-foreground">
            Your booking has been submitted successfully. We will confirm your reservation shortly.
          </p>
        </div>

        {/* Reference Number */}
        <Card className="mb-8 border-2 border-primary/30">
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Your Booking Reference</p>
            <div className="flex items-center justify-center gap-3">
              <p className="font-heading text-2xl font-bold tracking-wider gold-text">
                {booking.referenceNumber}
              </p>
              <button
                onClick={copyRef}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Copy reference"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Please save this reference number for your records.
            </p>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card className="border-border/50">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium tracking-widest uppercase text-primary">Booking Details</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Service</p>
                <p className="font-medium">{serviceLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Pending Confirmation
                </span>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Pickup</p>
                <p className="font-medium">{booking.pickupAddress}</p>
              </div>
              {booking.dropoffAddress && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Drop-off</p>
                  <p className="font-medium">{booking.dropoffAddress}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Date & Time</p>
                <p className="font-medium">
                  {new Date(booking.pickupDate).toLocaleString("en-AU", {
                    timeZone: "Australia/Brisbane",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Passengers</p>
                <p className="font-medium">{booking.passengerCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1"><Car className="w-3 h-3" /> Vehicle</p>
                <p className="font-medium">{booking.vehicleName}</p>
              </div>
              {booking.needsSupportVan === 1 && (
                <div>
                  <p className="text-muted-foreground">Support Van</p>
                  <p className="font-medium">Included</p>
                </div>
              )}
            </div>

            <div className="border-t border-border/50 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Estimated Total</span>
                <span className="font-heading text-xl font-bold gold-text">
                  ${parseFloat(booking.totalPrice ?? "0").toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Final price may vary based on actual distance and duration.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Button
            onClick={() => setLocation("/")}
            className="gap-2 gold-gradient text-gold-foreground border-0 hover:opacity-90"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation("/book")}
            className="gap-2 bg-background"
          >
            Book Another Ride
          </Button>
        </div>
      </div>
    </div>
  );
}
