import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { CheckCircle, XCircle, Copy, Home, Calendar, MapPin, Users, Car, CreditCard, Wallet, Banknote, Baby, Dog, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { SERVICE_TYPES, PAYMENT_METHODS } from "@shared/types";
import type { ServiceType, PaymentMethod } from "@shared/types";
import { useEffect, useMemo, useState } from "react";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

export default function BookingConfirmation() {
  const params = useParams<{ ref: string }>();
  const [, setLocation] = useLocation();

  // Parse payment query param once on mount
  const paymentResult = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("payment");
  }, []);

  const [showPaymentBanner, setShowPaymentBanner] = useState(!!paymentResult);

  const { data: booking, isLoading, refetch } = trpc.bookings.getByReference.useQuery(
    { referenceNumber: params.ref ?? "" },
    { enabled: !!params.ref, refetchInterval: paymentResult === "success" ? 3000 : false }
  );

  // Stop polling once payment status is confirmed as paid
  useEffect(() => {
    if (booking?.paymentStatus === "paid" && paymentResult === "success") {
      // Payment confirmed, no need to keep polling
    }
  }, [booking?.paymentStatus, paymentResult]);

  const retryPayment = trpc.bookings.retryPayment.useMutation({
    onSuccess: (data) => {
      toast.info("Redirecting to secure payment...");
      window.location.href = data.checkoutUrl;
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleRetryPayment = () => {
    if (!params.ref) return;
    retryPayment.mutate({
      referenceNumber: params.ref,
      origin: window.location.origin,
    });
  };

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
  const isStripeBooking = booking.paymentMethod === "stripe_prepay";
  const isUnpaid = booking.paymentStatus !== "paid";
  const canRetryPayment = isStripeBooking && isUnpaid && booking.status !== "cancelled";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <div className="border-b border-border/50 bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-center h-20">
          <div className="flex items-center gap-3">
            <img src={LOGO_IMG} alt="All Ways Transfers" className="h-16 w-auto" />
          </div>
        </div>
      </div>

      <div className="container py-12 max-w-2xl mx-auto">
        {/* Payment Success Banner */}
        {showPaymentBanner && paymentResult === "success" && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-400">Payment Successful!</p>
              <p className="text-sm text-muted-foreground">
                Your payment has been processed successfully. You will receive a confirmation email shortly.
              </p>
            </div>
            <button onClick={() => setShowPaymentBanner(false)} className="text-muted-foreground hover:text-foreground ml-auto shrink-0">&times;</button>
          </div>
        )}

        {/* Payment Cancelled Banner */}
        {showPaymentBanner && paymentResult === "cancelled" && (
          <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-400">Payment Not Completed</p>
              <p className="text-sm text-muted-foreground">
                You left the payment page before completing your payment. Your booking has been saved — you can pay now using the button below.
              </p>
            </div>
            <button onClick={() => setShowPaymentBanner(false)} className="text-muted-foreground hover:text-foreground ml-auto shrink-0">&times;</button>
          </div>
        )}

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
              {(booking.rearFacingSeats > 0 || booking.forwardFacingSeats > 0 || booking.boosterSeats > 0) && (
                <div className="col-span-2">
                  <p className="text-muted-foreground flex items-center gap-1"><Baby className="w-3 h-3" /> Child Seats</p>
                  <p className="font-medium">
                    {[booking.rearFacingSeats > 0 && `${booking.rearFacingSeats} Rear-Facing`, booking.forwardFacingSeats > 0 && `${booking.forwardFacingSeats} Forward-Facing`, booking.boosterSeats > 0 && `${booking.boosterSeats} Booster`].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
              {booking.isPetFriendly === 1 && (
                <>
                  {booking.numberOfPets != null && booking.numberOfPets > 0 && (
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1"><Dog className="w-3 h-3" /> Number of Pets</p>
                      <p className="font-medium">{booking.numberOfPets}</p>
                    </div>
                  )}
                  <div className={booking.numberOfPets ? "" : "col-span-2"}>
                    <p className="text-muted-foreground flex items-center gap-1"><Dog className="w-3 h-3" /> Pet(s) Description</p>
                    <p className="font-medium">{booking.petDescription || "Yes"}</p>
                  </div>
                </>
              )}
              {((booking.additionalPickupCount ?? 0) > 0 || (booking.additionalDropoffCount ?? 0) > 0) && (
                <div className="col-span-2 space-y-2">
                  <p className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Additional Stops</p>
                  {(booking.additionalPickupCount ?? 0) > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Additional Pickups ({booking.additionalPickupCount})</p>
                      {(() => {
                        try {
                          const addrs = JSON.parse(booking.additionalPickupAddresses || "[]");
                          return addrs.map((addr: string, i: number) => (
                            <p key={i} className="font-medium text-sm flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-primary shrink-0" />{addr}
                            </p>
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
                            <p key={i} className="font-medium text-sm flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />{addr}
                            </p>
                          ));
                        } catch { return null; }
                      })()}
                    </div>
                  )}
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-medium">
                  {booking.paymentMethod ? PAYMENT_METHODS[booking.paymentMethod as PaymentMethod]?.label : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  booking.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-800" :
                  booking.paymentStatus === "refunded" ? "bg-blue-100 text-blue-800" :
                  "bg-amber-100 text-amber-800"
                }`}>
                  {booking.paymentStatus === "paid" ? "Paid" : booking.paymentStatus === "refunded" ? "Refunded" : "Unpaid"}
                </span>
              </div>
            </div>

            {booking.publicHolidayName && (
              <div className="col-span-2 mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-amber-400 text-sm font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Public Holiday: {booking.publicHolidayName}
                  {parseFloat(booking.publicHolidaySurcharge ?? "0") > 0 && (
                    <span className="ml-auto text-amber-300">
                      +${parseFloat(booking.publicHolidaySurcharge ?? "0").toFixed(2)} surcharge
                    </span>
                  )}
                </p>
              </div>
            )}

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

            {/* Retry Payment Button */}
            {canRetryPayment && (
              <div className="border-t border-border/50 pt-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-start gap-2">
                    <CreditCard className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Payment Required</p>
                      <p className="text-xs text-muted-foreground">
                        Your booking is saved but payment has not been completed. Click below to complete your payment securely via Stripe.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleRetryPayment}
                    disabled={retryPayment.isPending}
                    className="w-full gap-2 gold-gradient text-gold-foreground border-0 hover:opacity-90"
                  >
                    <CreditCard className="w-4 h-4" />
                    {retryPayment.isPending ? "Preparing payment..." : `Pay Now — $${parseFloat(booking.totalPrice ?? "0").toFixed(2)}`}
                  </Button>
                </div>
              </div>
            )}
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
