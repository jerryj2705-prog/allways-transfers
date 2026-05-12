import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useParams, useLocation } from "wouter";
import {
  Printer, Download, ArrowLeft, CheckCircle, MapPin,
  Calendar, Users, Car, Dog, Loader2, Package
} from "lucide-react";
import { SERVICE_TYPES, PAYMENT_METHODS } from "@shared/types";
import type { ServiceType, PaymentMethod } from "@shared/types";
import { useRef } from "react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

export default function Receipt() {
  const params = useParams<{ ref: string }>();
  const [, setLocation] = useLocation();
  const receiptRef = useRef<HTMLDivElement>(null);

  const { data: booking, isLoading } = trpc.bookings.getByReference.useQuery(
    { referenceNumber: params.ref ?? "" },
    { enabled: !!params.ref }
  );

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Booking not found.</p>
        <Button onClick={() => setLocation("/my-bookings")} variant="outline" className="bg-background">
          Back to My Bookings
        </Button>
      </div>
    );
  }

  if (booking.paymentStatus !== "paid") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">No payment receipt available for this booking.</p>
        <Button onClick={() => setLocation("/my-bookings")} variant="outline" className="bg-background">
          Back to My Bookings
        </Button>
      </div>
    );
  }

  const serviceLabel = SERVICE_TYPES[booking.serviceType as ServiceType]?.label ?? booking.serviceType;
  const paymentLabel = PAYMENT_METHODS[booking.paymentMethod as PaymentMethod]?.label ?? booking.paymentMethod;

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Australia/Brisbane",
    });

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Australia/Brisbane",
    });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Action bar — hidden when printing */}
      <div className="print:hidden border-b border-border/50 bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16 max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/my-bookings")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2 bg-background"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Receipt content */}
      <div ref={receiptRef} className="container max-w-3xl mx-auto py-10 px-6 print:py-4 print:px-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 print:mb-6">
          <div>
            <img
              src={LOGO_URL}
              alt="All Ways Transfers"
              className="h-14 w-auto mb-3 print:h-10 hidden dark:block"
            />
            <h1 className="font-heading text-2xl font-bold print:text-xl">Payment Receipt</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Receipt for booking {booking.referenceNumber}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 print:border-emerald-600">
              <CheckCircle className="w-4 h-4 text-emerald-500 print:text-emerald-600" />
              <span className="text-sm font-medium text-emerald-400 print:text-emerald-600">Paid</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 mb-8 print:mb-6" />

        {/* Reference & Amount */}
        <div className="grid grid-cols-2 gap-6 mb-8 print:mb-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Booking Reference</p>
              <p className="font-heading text-xl font-bold gold-text print:text-black">{booking.referenceNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Customer</p>
              <p className="font-medium">{booking.clientName}</p>
              <p className="text-sm text-muted-foreground">{booking.clientEmail}</p>
            </div>
          </div>
          <div className="text-right space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Amount Paid</p>
              <p className="font-heading text-3xl font-bold gold-text print:text-black">
                ${parseFloat(booking.totalPrice ?? "0").toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">AUD</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Payment Method</p>
              <p className="text-sm font-medium">{paymentLabel}</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 mb-8 print:mb-6" />

        {/* Trip Details */}
        <div className="mb-8 print:mb-6">
          <h2 className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Trip Details</h2>
          <div className="bg-card/50 border border-border/50 rounded-lg p-5 print:p-4 print:border-gray-300 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" /> Service
                </p>
                <p className="font-medium text-sm">{serviceLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" /> Date & Time
                </p>
                <p className="font-medium text-sm">{formatDate(booking.pickupDate)}</p>
                <p className="text-sm text-muted-foreground">{formatTime(booking.pickupDate)} AEST</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3" /> Pickup
                </p>
                <p className="font-medium text-sm">{booking.pickupAddress}</p>
              </div>
              {booking.dropoffAddress && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3" /> Drop-off
                  </p>
                  <p className="font-medium text-sm">{booking.dropoffAddress}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Car className="w-3 h-3" /> Vehicle
                </p>
                <p className="font-medium text-sm">{booking.vehicleName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Users className="w-3 h-3" /> Passengers
                </p>
                <p className="font-medium text-sm">{booking.passengerCount}</p>
              </div>
            </div>

            {booking.isPetFriendly === 1 && booking.numberOfPets != null && booking.numberOfPets > 0 && (
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Dog className="w-3 h-3" /> Pets
                </p>
                <p className="font-medium text-sm">
                  {booking.numberOfPets} pet{booking.numberOfPets !== 1 ? "s" : ""}
                  {booking.petDescription ? ` — ${booking.petDescription}` : ""}
                </p>
              </div>
            )}

            {booking.serviceType === "freight" && booking.freightDescription && (
              <div className="pt-2 border-t border-border/30">
                <p className="text-xs font-medium tracking-widest uppercase text-primary mb-2">Freight Details</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <Package className="w-3 h-3" /> Item Description
                    </p>
                    <p className="font-medium text-sm">{booking.freightDescription}</p>
                  </div>
                  {booking.freightWeight && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Package className="w-3 h-3" /> Estimated Weight
                      </p>
                      <p className="font-medium text-sm">{booking.freightWeight === "under_10kg" ? "Under 10 kg" : booking.freightWeight === "10_25kg" ? "10\u201325 kg" : booking.freightWeight === "25_50kg" ? "25\u201350 kg" : booking.freightWeight === "50_100kg" ? "50\u2013100 kg" : booking.freightWeight === "100_plus" ? "100+ kg" : booking.freightWeight}</p>
                    </div>
                  )}
                  {booking.freightItemCount != null && booking.freightItemCount > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Package className="w-3 h-3" /> Number of Items
                      </p>
                      <p className="font-medium text-sm">{booking.freightItemCount}</p>
                    </div>
                  )}
                  {booking.freightSpecialHandling && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Package className="w-3 h-3" /> Special Handling
                      </p>
                      <p className="font-medium text-sm">{booking.freightSpecialHandling}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {booking.publicHolidayName && (
              <div className="pt-2 border-t border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Public Holiday</p>
                <p className="font-medium text-sm text-amber-400 print:text-amber-700">
                  {booking.publicHolidayName}
                  {parseFloat(booking.publicHolidaySurcharge ?? "0") > 0 && (
                    <span className="ml-2 text-muted-foreground">
                      (+${parseFloat(booking.publicHolidaySurcharge ?? "0").toFixed(2)} surcharge)
                    </span>
                  )}
                </p>
              </div>
            )}

            {(parseFloat(booking.airportTollSurcharge ?? "0") > 0 || parseFloat(booking.roadTollSurcharge ?? "0") > 0) && (
              <div className="pt-2 border-t border-border/30 space-y-1">
                <p className="text-xs text-muted-foreground mb-1">Tolls Included</p>
                {parseFloat(booking.airportTollSurcharge ?? "0") > 0 && (
                  <>
                    {(() => {
                      try {
                        const details = JSON.parse(booking.airportTollDetails || "[]");
                        return details.map((toll: { airport: string; direction: string; amount: number }, idx: number) => (
                          <p key={`at-${idx}`} className="font-medium text-sm text-amber-400 print:text-amber-700 flex justify-between">
                            <span>{toll.airport} {toll.direction} Toll</span>
                            <span>+${toll.amount.toFixed(2)}</span>
                          </p>
                        ));
                      } catch {
                        return (
                          <p className="font-medium text-sm text-amber-400 print:text-amber-700">Airport Tolls: +${parseFloat(booking.airportTollSurcharge ?? "0").toFixed(2)}</p>
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
                          <p key={`rt-${idx}`} className="font-medium text-sm text-amber-400 print:text-amber-700 flex justify-between">
                            <span>{toll.road} Toll</span>
                            <span>+${toll.amount.toFixed(2)}</span>
                          </p>
                        ));
                      } catch {
                        return (
                          <p className="font-medium text-sm text-amber-400 print:text-amber-700">Road Tolls: +${parseFloat(booking.roadTollSurcharge ?? "0").toFixed(2)}</p>
                        );
                      }
                    })()}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/50 pt-6 print:pt-4 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            All Ways Transfers &middot; ABN 18 715 944 056
          </p>
          <p className="text-xs text-muted-foreground">
            Phone: 0466 544 068 &middot; Email: bookings@allwaystransfers.com.au
          </p>
          <p className="text-xs text-muted-foreground">
            This receipt was generated on {new Date().toLocaleDateString("en-AU", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "Australia/Brisbane",
            })}
          </p>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .print\\:text-black { color: black !important; }
          .print\\:border-gray-300 { border-color: #d1d5db !important; }
          .print\\:text-emerald-600 { color: #059669 !important; }
          .print\\:border-emerald-600 { border-color: #059669 !important; }
          .print\\:text-amber-700 { color: #b45309 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}
