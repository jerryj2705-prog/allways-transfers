import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import {
  Plane, Clock, MapPin, Star, ArrowLeft, ArrowRight, Check,
  Users, Briefcase, Truck, ChevronLeft, CreditCard, Banknote, Wallet,
  AlertTriangle, Search, MapPinned, Baby, Dog, Plus, Minus, CalendarIcon,
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

/* ─── Suburb Autocomplete Component ─── */
function SuburbAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  suburbs,
  id,
  areaInfo,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  suburbs: string[];
  id: string;
  areaInfo?: { area: string; lga: string } | null;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return suburbs.slice(0, 20);
    const q = query.toLowerCase();
    return suburbs.filter((s) => s.toLowerCase().includes(q)).slice(0, 15);
  }, [query, suburbs]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const areaColor = areaInfo?.area === "primary"
    ? "text-emerald-400"
    : areaInfo?.area === "secondary"
    ? "text-amber-400"
    : areaInfo?.area === "other"
    ? "text-red-400"
    : "";

  const areaLabel = areaInfo?.area === "primary"
    ? "Primary Area"
    : areaInfo?.area === "secondary"
    ? "Secondary Area"
    : areaInfo?.area === "other"
    ? "Out of Service Area"
    : "";

  return (
    <div className="space-y-2" ref={ref}>
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id={id}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            // Clear selection if user types something different
            if (e.target.value.toLowerCase() !== value.toLowerCase()) {
              onChange("");
            }
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          className="h-12 pl-10"
          autoComplete="off"
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {filtered.map((suburb) => (
              <button
                key={suburb}
                type="button"
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors flex items-center gap-2 ${
                  value === suburb ? "bg-accent/30 text-primary font-medium" : "text-foreground"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery(suburb);
                  onChange(suburb);
                  setOpen(false);
                }}
              >
                <MapPinned className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {suburb}
              </button>
            ))}
          </div>
        )}
      </div>
      {value && areaInfo && (
        <p className={`text-xs ${areaColor}`}>
          {areaLabel} — {areaInfo.lga}
        </p>
      )}
    </div>
  );
}

/* ─── Main Booking Form ─── */
export default function BookingForm() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);

  // Form state
  const [serviceType, setServiceType] = useState<ServiceType | "">("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupSuburb, setPickupSuburb] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffSuburb, setDropoffSuburb] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pickupTime, setPickupTime] = useState("");
  const [timeOpen, setTimeOpen] = useState(false);
  const [passengerCount, setPassengerCount] = useState(1);
  const [needsSupportVan, setNeedsSupportVan] = useState(false);
  const [rearFacingSeats, setRearFacingSeats] = useState(0);
  const [forwardFacingSeats, setForwardFacingSeats] = useState(0);
  const [boosterSeats, setBoosterSeats] = useState(0);
  const [isPetFriendly, setIsPetFriendly] = useState(false);
  const [petDescription, setPetDescription] = useState("");
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

  // Fetch suburb list for autocomplete
  const { data: suburbList } = trpc.pricing.suburbs.useQuery();
  const suburbs = suburbList ?? [];

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

  // Lookup suburb info for area detection display
  const { data: pickupInfo } = trpc.pricing.lookupSuburb.useQuery(
    { suburb: pickupSuburb },
    { enabled: !!pickupSuburb }
  );
  const { data: dropoffInfo } = trpc.pricing.lookupSuburb.useQuery(
    { suburb: dropoffSuburb },
    { enabled: !!dropoffSuburb }
  );

  // Derive pickup hour from time input
  const pickupHour = useMemo(() => {
    if (!pickupTime) return 12;
    return parseInt(pickupTime.split(":")[0], 10);
  }, [pickupTime]);

  // Calculate price using server-side pricing engine (suburb-based)
  const priceInput = useMemo(() => {
    if (!serviceType || !pickupSuburb) return null;
    return {
      serviceType,
      pickupSuburb,
      destinationSuburb: dropoffSuburb || undefined,
      pickupHour,
      needsSupportVan,
      paymentMethod: paymentMethod || "cash_postpay",
    };
  }, [serviceType, pickupSuburb, dropoffSuburb, pickupHour, needsSupportVan, paymentMethod]);

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
    distanceKm: 0,
    isOutOfArea: false,
    pickupArea: null as string | null,
    destinationArea: null as string | null,
  };

  const estimatedDistance = priceBreakdown?.distanceKm ?? 0;
  const isOutOfArea = priceBreakdown?.isOutOfArea ?? false;
  const isOutOfHours = pickupHour >= 19 || pickupHour < 7;

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
      case 1: return pickupAddress && pickupSuburb && pickupDate && pickupTime && passengerCount >= 1 &&
        (serviceType === "hourly_hire" || (dropoffAddress && dropoffSuburb));
      case 2: return !!suv && (!isPetFriendly || petDescription.trim().length > 0);
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
      pickupAddress: `${pickupAddress} (${pickupSuburb})`,
      dropoffAddress: dropoffAddress ? `${dropoffAddress} (${dropoffSuburb})` : undefined,
      pickupDate: dateTime,
      passengerCount,
      vehicleId: suv.id,
      vehicleName: suv.name,
      needsSupportVan,
      supportVanPrice: pricing.supportVanPrice,
      rearFacingSeats,
      forwardFacingSeats,
      boosterSeats,
      isPetFriendly,
      petDescription: isPetFriendly ? petDescription : undefined,
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
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                          <div className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center ${
                            selected ? "gold-gradient" : "bg-background/80 backdrop-blur-sm"
                          }`}>
                            <Icon className={`w-5 h-5 ${selected ? "text-gold-foreground" : "text-muted-foreground"}`} />
                          </div>
                        </div>
                      )}
                      <CardContent className={`${svcImage ? "pt-2" : "pt-6"} pb-5 px-5 space-y-2`}>
                        <div className="flex items-center justify-between">
                          <h3 className="font-heading text-lg font-semibold">{svc.label}</h3>
                          {basePrice && (
                            <span className="text-sm gold-text font-bold">from ${basePrice}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{svc.description}</p>
                        {!svcImage && (
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selected ? "gold-gradient" : "bg-muted"
                          }`}>
                            <Icon className={`w-5 h-5 ${selected ? "text-gold-foreground" : "text-muted-foreground"}`} />
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
              {/* Pickup Address */}
              <div className="space-y-2">
                <Label htmlFor="pickup" className="text-sm font-medium">Pickup Address</Label>
                <Input
                  id="pickup"
                  placeholder="Enter street address"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Pickup Suburb - Autocomplete */}
              <SuburbAutocomplete
                label="Pickup Suburb"
                placeholder="Start typing suburb name..."
                value={pickupSuburb}
                onChange={setPickupSuburb}
                suburbs={suburbs}
                id="pickupSuburb"
                areaInfo={pickupInfo}
              />

              {/* Drop-off (not for hourly hire) */}
              {serviceType !== "hourly_hire" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="dropoff" className="text-sm font-medium">Drop-off Address</Label>
                    <Input
                      id="dropoff"
                      placeholder="Enter street address"
                      value={dropoffAddress}
                      onChange={(e) => setDropoffAddress(e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <SuburbAutocomplete
                    label="Drop-off Suburb"
                    placeholder="Start typing suburb name..."
                    value={dropoffSuburb}
                    onChange={setDropoffSuburb}
                    suburbs={suburbs}
                    id="dropoffSuburb"
                    areaInfo={dropoffInfo}
                  />
                </>
              )}

              {/* Auto-detected area & distance info */}
              {pickupSuburb && dropoffSuburb && estimatedDistance > 0 && (
                <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPinned className="w-4 h-4 text-primary" />
                    <span className="font-medium">Estimated Distance:</span>
                    <span className="gold-text font-bold">{estimatedDistance} km</span>
                  </div>
                  {isOutOfArea && (
                    <div className="flex items-start gap-2 text-sm text-amber-400">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>One or both locations are in a secondary service area. An out-of-area surcharge will apply.</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pickup Date</Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={`h-12 w-full justify-start text-left font-normal bg-background ${
                          !pickupDate ? "text-muted-foreground" : ""
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {pickupDate
                          ? new Date(pickupDate + "T00:00:00").toLocaleDateString("en-AU", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={pickupDate ? new Date(pickupDate + "T00:00:00") : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const yyyy = date.getFullYear();
                            const mm = String(date.getMonth() + 1).padStart(2, "0");
                            const dd = String(date.getDate()).padStart(2, "0");
                            setPickupDate(`${yyyy}-${mm}-${dd}`);
                            setCalendarOpen(false);
                          }
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pickup Time</Label>
                  <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={`h-12 w-full justify-start text-left font-normal bg-background ${
                          !pickupTime ? "text-muted-foreground" : ""
                        }`}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {pickupTime || "Select time"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-0" align="start">
                      <div className="h-64 overflow-y-auto">
                        {Array.from({ length: 96 }, (_, i) => {
                          const hour = Math.floor(i / 4);
                          const minute = (i % 4) * 15;
                          const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
                          const label = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => {
                                setPickupTime(value);
                                setTimeOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                                pickupTime === value
                                  ? "bg-primary text-primary-foreground font-medium"
                                  : ""
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {/* Out-of-hours notice */}
              {pickupTime && isOutOfHours && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-400">Out-of-Hours Pickup</p>
                    <p className="text-muted-foreground">Pickups between 7pm and 7am incur an out-of-hours surcharge.</p>
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

            {/* Child Seat Options */}
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Baby className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold">Child Seats</h3>
                    <p className="text-sm text-muted-foreground">Select the child seats you require (max 2 of each type)</p>
                  </div>
                </div>

                {/* Rear-Facing */}
                <div className="flex items-center justify-between py-2 border-t border-border/30">
                  <div>
                    <p className="text-sm font-medium">Rear-Facing Seat</p>
                    <p className="text-xs text-muted-foreground">For infants (birth to ~12 months)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button" variant="outline" size="icon"
                      className="h-8 w-8 bg-background"
                      onClick={() => setRearFacingSeats(Math.max(0, rearFacingSeats - 1))}
                      disabled={rearFacingSeats === 0}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-lg font-heading font-bold w-6 text-center">{rearFacingSeats}</span>
                    <Button
                      type="button" variant="outline" size="icon"
                      className="h-8 w-8 bg-background"
                      onClick={() => setRearFacingSeats(Math.min(2, rearFacingSeats + 1))}
                      disabled={rearFacingSeats === 2}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Forward-Facing */}
                <div className="flex items-center justify-between py-2 border-t border-border/30">
                  <div>
                    <p className="text-sm font-medium">Forward-Facing Seat</p>
                    <p className="text-xs text-muted-foreground">For toddlers (~1 to 4 years)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button" variant="outline" size="icon"
                      className="h-8 w-8 bg-background"
                      onClick={() => setForwardFacingSeats(Math.max(0, forwardFacingSeats - 1))}
                      disabled={forwardFacingSeats === 0}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-lg font-heading font-bold w-6 text-center">{forwardFacingSeats}</span>
                    <Button
                      type="button" variant="outline" size="icon"
                      className="h-8 w-8 bg-background"
                      onClick={() => setForwardFacingSeats(Math.min(2, forwardFacingSeats + 1))}
                      disabled={forwardFacingSeats === 2}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Booster */}
                <div className="flex items-center justify-between py-2 border-t border-border/30">
                  <div>
                    <p className="text-sm font-medium">Booster Seat</p>
                    <p className="text-xs text-muted-foreground">For children (~4 to 7 years)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button" variant="outline" size="icon"
                      className="h-8 w-8 bg-background"
                      onClick={() => setBoosterSeats(Math.max(0, boosterSeats - 1))}
                      disabled={boosterSeats === 0}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-lg font-heading font-bold w-6 text-center">{boosterSeats}</span>
                    <Button
                      type="button" variant="outline" size="icon"
                      className="h-8 w-8 bg-background"
                      onClick={() => setBoosterSeats(Math.min(2, boosterSeats + 1))}
                      disabled={boosterSeats === 2}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pet-Friendly Option */}
            <Card className={`transition-all duration-200 ${
              isPetFriendly ? "ring-2 ring-primary shadow-lg" : "border-border/50 hover:shadow-md"
            }`}>
              <CardContent className="p-6 space-y-4">
                <div
                  className="flex items-start gap-4 cursor-pointer"
                  onClick={() => {
                    setIsPetFriendly(!isPetFriendly);
                    if (isPetFriendly) setPetDescription("");
                  }}
                >
                  <Checkbox
                    checked={isPetFriendly}
                    onCheckedChange={(checked) => {
                      setIsPetFriendly(!!checked);
                      if (!checked) setPetDescription("");
                    }}
                    className="mt-1"
                  />
                  <div className="flex items-center gap-3">
                    <Dog className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-heading text-lg font-semibold">Pet Friendly</h3>
                      <p className="text-sm text-muted-foreground">I will be travelling with a pet</p>
                    </div>
                  </div>
                </div>
                {isPetFriendly && (
                  <div className="space-y-2 pl-8">
                    <Label htmlFor="petDesc" className="text-sm font-medium">
                      Pet Description <span className="text-red-400">*</span>
                    </Label>
                    <Textarea
                      id="petDesc"
                      placeholder="Please describe your pet (e.g. breed, size, temperament, any special needs)..."
                      value={petDescription}
                      onChange={(e) => setPetDescription(e.target.value)}
                      rows={3}
                      className={!petDescription.trim() ? "border-red-500/50" : ""}
                    />
                    {!petDescription.trim() && (
                      <p className="text-xs text-red-400">Pet description is required when travelling with a pet.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
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
                      <p className="text-xs text-muted-foreground">{pickupSuburb}{pickupInfo ? ` (${pickupInfo.area === "primary" ? "Primary" : pickupInfo.area === "secondary" ? "Secondary" : "Other"} Area)` : ""}</p>
                    </div>
                    {dropoffAddress && (
                      <div>
                        <p className="text-muted-foreground">Drop-off</p>
                        <p className="font-medium">{dropoffAddress}</p>
                        <p className="text-xs text-muted-foreground">{dropoffSuburb}{dropoffInfo ? ` (${dropoffInfo.area === "primary" ? "Primary" : dropoffInfo.area === "secondary" ? "Secondary" : "Other"} Area)` : ""}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Date & Time</p>
                      <p className="font-medium">
                        {pickupDate
                          ? new Date(pickupDate + "T00:00:00").toLocaleDateString("en-AU", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : pickupDate}
                        {" at "}
                        {pickupTime}
                      </p>
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
                        <p className="font-medium text-amber-400">Secondary area surcharge applies</p>
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

                {/* Options */}
                {(rearFacingSeats > 0 || forwardFacingSeats > 0 || boosterSeats > 0 || isPetFriendly) && (
                  <div className="space-y-3 border-t border-border/50 pt-4">
                    <p className="text-xs font-medium tracking-widest uppercase text-primary">Options</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {rearFacingSeats > 0 && (
                        <div>
                          <p className="text-muted-foreground">Rear-Facing Seats</p>
                          <p className="font-medium">{rearFacingSeats}</p>
                        </div>
                      )}
                      {forwardFacingSeats > 0 && (
                        <div>
                          <p className="text-muted-foreground">Forward-Facing Seats</p>
                          <p className="font-medium">{forwardFacingSeats}</p>
                        </div>
                      )}
                      {boosterSeats > 0 && (
                        <div>
                          <p className="text-muted-foreground">Booster Seats</p>
                          <p className="font-medium">{boosterSeats}</p>
                        </div>
                      )}
                      {isPetFriendly && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Pet</p>
                          <p className="font-medium">{petDescription}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
