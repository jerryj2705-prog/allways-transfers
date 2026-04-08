import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Plane, Clock, MapPin, Star, ArrowLeft, ArrowRight, Check,
  Users, Briefcase, Truck, ChevronLeft, CreditCard, Banknote, Wallet,
  AlertTriangle,
} from "lucide-react";
import { SERVICE_TYPES, SUV_CAPACITY, PAYMENT_METHODS } from "@shared/types";
import type { PaymentMethod } from "@shared/types";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";
const SVC_AIRPORT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/aircraft-highway_9944f3aa.png";
const SVC_HOURLY_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/lady-in-limo_de251852.png";
const SVC_P2P_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/roads-spaghetti_814c9a5d.png";
const SVC_EVENTS_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/crowd-event_baea8a77.jpg";

const SERVICE_IMAGES: Record<string, string> = {
  airport_transfer: SVC_AIRPORT_IMG,
  hourly_hire: SVC_HOURLY_IMG,
  point_to_point: SVC_P2P_IMG,
  special_events: SVC_EVENTS_IMG,
};

type ServiceType = keyof typeof SERVICE_TYPES;

const SERVICE_ICONS: Record<string, React.ElementType> = {
  Plane, Clock, MapPin, Star,
};

const PAYMENT_ICONS: Record<PaymentMethod, React.ElementType> = {
  stripe_prepay: CreditCard,
  square_postpay: Wallet,
  cash_postpay: Banknote,
};

const STEPS = [
  "Service Type",
  "Trip Details",
  "Vehicle & Options",
  "Your Details",
  "Payment",
  "Review & Confirm",
];

export default function BookingForm() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);

  // Form state
  const [serviceType, setServiceType] = useState<ServiceType | "">("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [needsSupportVan, setNeedsSupportVan] = useState(false);
  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [isOutOfArea, setIsOutOfArea] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");

  const { data: vehiclesData } = trpc.vehicles.list.useQuery();
  const vehicles = vehiclesData ?? [];
  const suv = vehicles.find((v) => v.type === "suv");
  const van = vehicles.find((v) => v.type === "van");

  // Fetch pricing settings for base prices on service cards
  const { data: pricingSettings } = trpc.pricing.getAll.useQuery();

  const getBasePrice = (key: string) => {
    const setting = pricingSettings?.find(s => s.settingKey === key);
    if (!setting) return null;
    const val = parseFloat(setting.settingValue);
    return val % 1 === 0 ? val.toFixed(0) : val.toFixed(2);
  };

  const SERVICE_PRICE_KEYS: Record<string, string> = {
    airport_transfer: "base_airport_transfer",
    hourly_hire: "base_hourly_hire",
    point_to_point: "base_point_to_point",
    special_events: "base_special_events",
  };

  // Derive pickup hour from time input
  const pickupHour = useMemo(() => {
    if (!pickupTime) return 12;
    return parseInt(pickupTime.split(":")[0], 10);
  }, [pickupTime]);

  // Calculate price using server-side pricing engine
  const priceInput = useMemo(() => {
    if (!serviceType) return null;
    return {
      serviceType,
      distanceKm: estimatedDistance,
      pickupHour,
      isOutOfArea,
      needsSupportVan,
      paymentMethod: paymentMethod || "cash_postpay",
    };
  }, [serviceType, estimatedDistance, pickupHour, isOutOfArea, needsSupportVan, paymentMethod]);

  const { data: priceBreakdown } = trpc.pricing.calculate.useQuery(
    priceInput!,
    { enabled: !!priceInput }
  );

  const pricing = priceBreakdown ?? {
    basePrice: 0,
    distanceCharge: 0,
    outOfHoursSurcharge: 0,
    outOfAreaSurcharge: 0,
    fuelLevySurcharge: 0,
    supportVanPrice: 0,
    squareSurcharge: 0,
    subtotal: 0,
    totalPrice: 0,
  };

  const isOutOfHours = pickupHour >= 20 || pickupHour < 6;

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.info("Redirecting to payment...");
        window.open(data.checkoutUrl, "_blank");
        setLocation(`/confirmation/${data.referenceNumber}`);
      } else {
        setLocation(`/confirmation/${data.referenceNumber}`);
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create booking");
    },
  });

  const canProceed = () => {
    switch (step) {
      case 0: return serviceType !== "";
      case 1: return pickupAddress && pickupDate && pickupTime && passengerCount >= 1 &&
        (serviceType === "hourly_hire" || dropoffAddress);
      case 2: return !!suv;
      case 3: return clientName && clientEmail && clientPhone;
      case 4: return paymentMethod !== "";
      case 5: return termsAccepted;
      default: return false;
    }
  };

  const handleSubmit = () => {
    if (!suv || !serviceType || !paymentMethod) return;

    const dateTime = new Date(`${pickupDate}T${pickupTime}`).getTime();

    createBooking.mutate({
      clientName,
      clientEmail,
      clientPhone,
      serviceType,
      pickupAddress,
      dropoffAddress: dropoffAddress || undefined,
      pickupDate: dateTime,
      passengerCount,
      vehicleId: suv.id,
      vehicleName: suv.name,
      needsSupportVan,
      supportVanPrice: pricing.supportVanPrice,
      estimatedDistance,
      basePrice: pricing.basePrice,
      totalPrice: pricing.totalPrice,
      specialRequests: specialRequests || undefined,
      termsAccepted,
      paymentMethod,
      origin: window.location.origin,
    });
  };

  const passengerNote = passengerCount > SUV_CAPACITY.withLuggage
    ? "With limited check-in luggage allowance"
    : "With standard check-in luggage + personal belongings";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <div className="border-b border-border/50 bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-20">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : setLocation("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step > 0 ? "Back" : "Home"}
          </button>
          <img src={LOGO_IMG} alt="All Ways Transfers" className="h-16 w-auto" />
          <div className="w-16" />
        </div>
      </div>

      <div className="container max-w-3xl py-10 space-y-8">
        {/* Step Indicator */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-1 md:gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-1 md:gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < step
                      ? "gold-gradient text-gold-foreground"
                      : i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className="hidden md:inline text-xs text-muted-foreground">{label}</span>
                {i < STEPS.length - 1 && (
                  <div className={`hidden md:block w-6 lg:w-12 h-px ${i < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className="gold-gradient h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 0: Service Type */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-bold">Select Your Service</h2>
              <p className="text-muted-foreground">Choose the type of service that best suits your needs.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {(Object.entries(SERVICE_TYPES) as [ServiceType, typeof SERVICE_TYPES[ServiceType]][]).map(
                ([key, svc]) => {
                  const Icon = SERVICE_ICONS[svc.icon] || Star;
                  const selected = serviceType === key;
                  const svcImage = SERVICE_IMAGES[key];
                  const priceKey = SERVICE_PRICE_KEYS[key];
                  const basePrice = priceKey ? getBasePrice(priceKey) : null;
                  return (
                    <Card
                      key={key}
                      className={`cursor-pointer transition-all duration-200 overflow-hidden ${
                        selected
                          ? "ring-2 ring-primary shadow-lg"
                          : "hover:shadow-md border-border/50"
                      }`}
                      onClick={() => setServiceType(key)}
                    >
                      {svcImage && (
                        <div className="relative h-36 overflow-hidden">
                          <img
                            src={svcImage}
                            alt={svc.label}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                          <div className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center ${
                            selected ? "gold-gradient" : "bg-background/80 backdrop-blur-sm"
                          }`}>
                            <Icon className={`w-5 h-5 ${selected ? "text-gold-foreground" : "text-muted-foreground"}`} />
                          </div>
                        </div>
                      )}
                      <CardContent className={`${svcImage ? "p-4 pt-2" : "p-6"} space-y-2`}>
                        {!svcImage && (
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            selected ? "gold-gradient" : "bg-muted"
                          }`}>
                            <Icon className={`w-6 h-6 ${selected ? "text-gold-foreground" : "text-muted-foreground"}`} />
                          </div>
                        )}
                        <h3 className="font-heading text-lg font-semibold">{svc.label}</h3>
                        <p className="text-sm text-muted-foreground">{svc.description}</p>
                        {basePrice && (
                          <div className="pt-2 border-t border-border/30">
                            <span className="text-primary font-heading text-lg font-bold">
                              From ${basePrice}
                            </span>
                            {key === "hourly_hire" && (
                              <span className="text-xs text-muted-foreground ml-1">/per hour</span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Step 1: Trip Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-bold">Trip Details</h2>
              <p className="text-muted-foreground">Tell us about your journey.</p>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="pickup" className="text-sm font-medium">Pickup Location</Label>
                <Input
                  id="pickup"
                  placeholder="Enter pickup address"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="h-12"
                />
              </div>
              {serviceType !== "hourly_hire" && (
                <div className="space-y-2">
                  <Label htmlFor="dropoff" className="text-sm font-medium">Drop-off Location</Label>
                  <Input
                    id="dropoff"
                    placeholder="Enter drop-off address"
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                    className="h-12"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium">Pickup Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-sm font-medium">Pickup Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
              {/* Out-of-hours notice */}
              {pickupTime && isOutOfHours && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-400">Out-of-Hours Pickup</p>
                    <p className="text-muted-foreground">Pickups between 8pm and 6am may incur an out-of-hours surcharge.</p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="passengers" className="text-sm font-medium">Number of Passengers</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                    className="bg-background"
                  >
                    -
                  </Button>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-xl font-heading font-bold w-8 text-center">{passengerCount}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPassengerCount(Math.min(SUV_CAPACITY.limitedLuggage, passengerCount + 1))}
                    className="bg-background"
                  >
                    +
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{passengerNote}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="distance" className="text-sm font-medium">Estimated Distance (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Approximate distance in kilometres"
                  value={estimatedDistance || ""}
                  onChange={(e) => setEstimatedDistance(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the approximate distance for your trip. This helps us calculate your fare estimate.
                </p>
              </div>
              {/* Out-of-area checkbox */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
                <Checkbox
                  id="outOfArea"
                  checked={isOutOfArea}
                  onCheckedChange={(checked) => setIsOutOfArea(!!checked)}
                  className="mt-0.5"
                />
                <label htmlFor="outOfArea" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  <span className="font-medium text-foreground">Out-of-area pickup/drop-off</span>
                  <br />
                  Check this if your pickup or drop-off is outside the Sunshine Coast / Brisbane primary service area.
                  An additional surcharge may apply.
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Vehicle & Options */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-bold">Vehicle & Options</h2>
              <p className="text-muted-foreground">Your vehicle and optional add-ons.</p>
            </div>

            {/* Primary Vehicle */}
            <Card className="ring-2 ring-primary shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg gold-gradient flex items-center justify-center shrink-0">
                    <Briefcase className="w-6 h-6 text-gold-foreground" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-heading text-lg font-semibold">{suv?.name ?? "Luxury SUV"}</h3>
                    <p className="text-sm text-muted-foreground">{suv?.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-primary" />
                        Up to {SUV_CAPACITY.withLuggage} pax (with luggage)
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-primary" />
                        Up to {SUV_CAPACITY.limitedLuggage} pax (limited luggage)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Van Option */}
            {van && (
              <Card
                className={`cursor-pointer transition-all duration-200 ${
                  needsSupportVan ? "ring-2 ring-primary shadow-lg" : "border-border/50 hover:shadow-md"
                }`}
                onClick={() => setNeedsSupportVan(!needsSupportVan)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={needsSupportVan}
                        onCheckedChange={(checked) => setNeedsSupportVan(!!checked)}
                        className="mt-1"
                      />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Truck className="w-5 h-5 text-muted-foreground" />
                          <h3 className="font-heading text-lg font-semibold">{van.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-md">{van.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-heading font-bold">+${pricing.supportVanPrice.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">add-on</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 3: Client Details */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-bold">Your Details</h2>
              <p className="text-muted-foreground">We need your contact information for the booking.</p>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+61 4XX XXX XXX"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requests" className="text-sm font-medium">Special Requests (optional)</Label>
                <Textarea
                  id="requests"
                  placeholder="Any special requirements or notes..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Payment Method */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-bold">Payment Method</h2>
              <p className="text-muted-foreground">Choose how you would like to pay for your transfer.</p>
            </div>
            <div className="space-y-4">
              {(Object.entries(PAYMENT_METHODS) as [PaymentMethod, typeof PAYMENT_METHODS[PaymentMethod]][]).map(
                ([key, method]) => {
                  const Icon = PAYMENT_ICONS[key];
                  const selected = paymentMethod === key;

                  return (
                    <Card
                      key={key}
                      className={`cursor-pointer transition-all duration-200 ${
                        selected
                          ? "ring-2 ring-primary shadow-lg"
                          : "hover:shadow-md border-border/50"
                      }`}
                      onClick={() => setPaymentMethod(key)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                            selected ? "gold-gradient" : "bg-muted"
                          }`}>
                            <Icon className={`w-6 h-6 ${selected ? "text-gold-foreground" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-heading text-lg font-semibold">{method.label}</h3>
                              {method.surcharge > 0 && (
                                <span className="text-sm text-amber-400 font-medium">+{(method.surcharge * 100).toFixed(0)}% surcharge</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                            {key === "stripe_prepay" && selected && (
                              <p className="text-xs text-primary mt-1">
                                You will be redirected to a secure Stripe checkout page after confirming your booking.
                              </p>
                            )}
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                            selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                          }`}>
                            {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Step 5: Review & Confirm */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-bold">Review Your Booking</h2>
              <p className="text-muted-foreground">Please confirm all details are correct before submitting.</p>
            </div>

            <Card className="border-border/50">
              <CardContent className="p-6 space-y-6">
                {/* Service */}
                <div className="space-y-1">
                  <p className="text-xs font-medium tracking-widest uppercase text-primary">Service</p>
                  <p className="font-semibold">{serviceType ? SERVICE_TYPES[serviceType].label : ""}</p>
                </div>

                {/* Trip */}
                <div className="space-y-3 border-t border-border/50 pt-4">
                  <p className="text-xs font-medium tracking-widest uppercase text-primary">Trip Details</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Pickup</p>
                      <p className="font-medium">{pickupAddress}</p>
                    </div>
                    {dropoffAddress && (
                      <div>
                        <p className="text-muted-foreground">Drop-off</p>
                        <p className="font-medium">{dropoffAddress}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Date & Time</p>
                      <p className="font-medium">{pickupDate} at {pickupTime}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Passengers</p>
                      <p className="font-medium">{passengerCount}</p>
                    </div>
                    {estimatedDistance > 0 && (
                      <div>
                        <p className="text-muted-foreground">Est. Distance</p>
                        <p className="font-medium">{estimatedDistance} km</p>
                      </div>
                    )}
                    {isOutOfArea && (
                      <div>
                        <p className="text-muted-foreground">Area</p>
                        <p className="font-medium text-amber-400">Out of primary area</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle */}
                <div className="space-y-3 border-t border-border/50 pt-4">
                  <p className="text-xs font-medium tracking-widest uppercase text-primary">Vehicle</p>
                  <p className="font-medium">{suv?.name}</p>
                  {needsSupportVan && (
                    <p className="text-sm text-muted-foreground">+ Support Van for luggage/freight</p>
                  )}
                </div>

                {/* Client */}
                <div className="space-y-3 border-t border-border/50 pt-4">
                  <p className="text-xs font-medium tracking-widest uppercase text-primary">Contact</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">{clientName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{clientEmail}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{clientPhone}</p>
                    </div>
                  </div>
                  {specialRequests && (
                    <div>
                      <p className="text-muted-foreground text-sm">Special Requests</p>
                      <p className="text-sm font-medium">{specialRequests}</p>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div className="space-y-3 border-t border-border/50 pt-4">
                  <p className="text-xs font-medium tracking-widest uppercase text-primary">Payment</p>
                  <div className="flex items-center gap-2">
                    {paymentMethod && (() => {
                      const Icon = PAYMENT_ICONS[paymentMethod];
                      return <Icon className="w-5 h-5 text-primary" />;
                    })()}
                    <p className="font-medium">{paymentMethod ? PAYMENT_METHODS[paymentMethod].label : ""}</p>
                  </div>
                  {paymentMethod === "square_postpay" && (
                    <p className="text-xs text-amber-400">Includes 2% card processing surcharge</p>
                  )}
                  {paymentMethod === "cash_postpay" && (
                    <p className="text-xs text-muted-foreground">Please prepare the exact amount</p>
                  )}
                  {paymentMethod === "stripe_prepay" && (
                    <p className="text-xs text-primary">You will be redirected to Stripe for secure payment</p>
                  )}
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-3 border-t border-border/50 pt-4">
                  <p className="text-xs font-medium tracking-widest uppercase text-primary">Pricing Breakdown</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{serviceType ? SERVICE_TYPES[serviceType].label : "Service"} – Base</span>
                      <span>${pricing.basePrice.toFixed(2)}</span>
                    </div>
                    {pricing.distanceCharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Distance ({estimatedDistance} km)</span>
                        <span>${pricing.distanceCharge.toFixed(2)}</span>
                      </div>
                    )}
                    {pricing.outOfHoursSurcharge > 0 && (
                      <div className="flex justify-between text-sm text-amber-400">
                        <span>Out-of-Hours Surcharge</span>
                        <span>+${pricing.outOfHoursSurcharge.toFixed(2)}</span>
                      </div>
                    )}
                    {pricing.outOfAreaSurcharge > 0 && (
                      <div className="flex justify-between text-sm text-amber-400">
                        <span>Out-of-Area Surcharge</span>
                        <span>+${pricing.outOfAreaSurcharge.toFixed(2)}</span>
                      </div>
                    )}
                    {pricing.fuelLevySurcharge > 0 && (
                      <div className="flex justify-between text-sm text-amber-400">
                        <span>Fuel Levy</span>
                        <span>+${pricing.fuelLevySurcharge.toFixed(2)}</span>
                      </div>
                    )}
                    {needsSupportVan && pricing.supportVanPrice > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Support Van</span>
                        <span>+${pricing.supportVanPrice.toFixed(2)}</span>
                      </div>
                    )}
                    {pricing.squareSurcharge > 0 && (
                      <div className="flex justify-between text-sm text-amber-400">
                        <span>Card Surcharge (2%)</span>
                        <span>+${pricing.squareSurcharge.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-heading text-lg font-bold border-t border-border/50 pt-2">
                      <span>Total Estimate</span>
                      <span className="gold-text">${pricing.totalPrice.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Final price may vary based on actual distance and duration.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                I agree to the Terms and Conditions. I understand that the quoted price is an estimate
                and the final amount may vary. Cancellation policies apply.
              </label>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/50">
          <Button
            variant="outline"
            onClick={() => step > 0 ? setStep(step - 1) : setLocation("/")}
            className="gap-2 bg-background"
          >
            <ArrowLeft className="w-4 h-4" />
            {step > 0 ? "Previous" : "Cancel"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="gap-2 gold-gradient text-gold-foreground border-0 hover:opacity-90"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || createBooking.isPending}
              className="gap-2 gold-gradient text-gold-foreground border-0 hover:opacity-90"
            >
              {createBooking.isPending ? "Submitting..." : paymentMethod === "stripe_prepay" ? "Confirm & Pay" : "Confirm Booking"}
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
