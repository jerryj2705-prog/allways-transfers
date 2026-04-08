import { useState, useMemo } from "react";
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
  Users, Briefcase, Truck, ChevronLeft,
} from "lucide-react";
import { SERVICE_TYPES, SUV_CAPACITY } from "@shared/types";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

type ServiceType = keyof typeof SERVICE_TYPES;

const SERVICE_ICONS: Record<string, React.ElementType> = {
  Plane, Clock, MapPin, Star,
};

const STEPS = [
  "Service Type",
  "Trip Details",
  "Vehicle & Options",
  "Your Details",
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
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { data: vehiclesData } = trpc.vehicles.list.useQuery();
  const vehicles = vehiclesData ?? [];
  const suv = vehicles.find((v) => v.type === "suv");
  const van = vehicles.find((v) => v.type === "van");

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: (data) => {
      setLocation(`/confirmation/${data.referenceNumber}`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create booking");
    },
  });

  // Dynamic pricing
  const pricing = useMemo(() => {
    if (!suv) return { basePrice: 0, supportVanPrice: 0, totalPrice: 0 };

    const baseRate = parseFloat(suv.baseRate ?? "65");
    const perHourRate = parseFloat(suv.perHourRate ?? "95");
    const perKmRate = parseFloat(suv.perKmRate ?? "3.50");

    let basePrice = baseRate;
    if (serviceType === "hourly_hire") {
      basePrice = baseRate + perHourRate * 2; // Minimum 2 hours
    } else if (serviceType === "airport_transfer") {
      basePrice = baseRate + perKmRate * 30; // Estimated 30km
    } else if (serviceType === "point_to_point") {
      basePrice = baseRate + perKmRate * 25; // Estimated 25km
    } else if (serviceType === "special_events") {
      basePrice = baseRate + perHourRate * 4; // Minimum 4 hours
    }

    let supportVanPrice = 0;
    if (needsSupportVan && van) {
      const vanBase = parseFloat(van.baseRate ?? "50");
      const vanPerKm = parseFloat(van.perKmRate ?? "2.50");
      supportVanPrice = vanBase + vanPerKm * 25;
    }

    return {
      basePrice: Math.round(basePrice * 100) / 100,
      supportVanPrice: Math.round(supportVanPrice * 100) / 100,
      totalPrice: Math.round((basePrice + supportVanPrice) * 100) / 100,
    };
  }, [suv, van, serviceType, needsSupportVan]);

  const canProceed = () => {
    switch (step) {
      case 0: return serviceType !== "";
      case 1: return pickupAddress && pickupDate && pickupTime && passengerCount >= 1 &&
        (serviceType === "hourly_hire" || dropoffAddress);
      case 2: return !!suv;
      case 3: return clientName && clientEmail && clientPhone;
      case 4: return termsAccepted;
      default: return false;
    }
  };

  const handleSubmit = () => {
    if (!suv || !serviceType) return;

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
      basePrice: pricing.basePrice,
      totalPrice: pricing.totalPrice,
      specialRequests: specialRequests || undefined,
      termsAccepted,
    });
  };

  const passengerNote = passengerCount > SUV_CAPACITY.withLuggage
    ? "With limited check-in luggage allowance"
    : "With standard check-in luggage + personal belongings";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : setLocation("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step > 0 ? "Back" : "Home"}
          </button>
          <div className="flex items-center gap-3">
            <img src={LOGO_IMG} alt="All Ways Transfers" className="h-6 w-auto" />
            <span className="text-sm text-muted-foreground">Book a Ride</span>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="container py-8 max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
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
                  <div className={`hidden md:block w-8 lg:w-16 h-px ${i < step ? "bg-primary" : "bg-border"}`} />
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
                  return (
                    <Card
                      key={key}
                      className={`cursor-pointer transition-all duration-200 ${
                        selected
                          ? "ring-2 ring-primary shadow-lg"
                          : "hover:shadow-md border-border/50"
                      }`}
                      onClick={() => setServiceType(key)}
                    >
                      <CardContent className="p-6 space-y-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          selected ? "gold-gradient" : "bg-muted"
                        }`}>
                          <Icon className={`w-6 h-6 ${selected ? "text-gold-foreground" : "text-muted-foreground"}`} />
                        </div>
                        <h3 className="font-heading text-lg font-semibold">{svc.label}</h3>
                        <p className="text-sm text-muted-foreground">{svc.description}</p>
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
                    min={new Date().toISOString().split("T")[0]}
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
              <div className="space-y-2">
                <Label className="text-sm font-medium">Number of Passengers</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-background"
                    onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                    disabled={passengerCount <= 1}
                  >
                    -
                  </Button>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xl font-semibold w-8 text-center">{passengerCount}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-background"
                    onClick={() => setPassengerCount(Math.min(SUV_CAPACITY.limitedLuggage, passengerCount + 1))}
                    disabled={passengerCount >= SUV_CAPACITY.limitedLuggage}
                  >
                    +
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{passengerNote}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Vehicle & Options */}
        {step === 2 && suv && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-bold">Vehicle & Options</h2>
              <p className="text-muted-foreground">Your vehicle and any additional services.</p>
            </div>

            {/* SUV Card */}
            <Card className="border-2 border-primary shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-gold-foreground" />
                      </div>
                      <div>
                        <h3 className="font-heading text-xl font-semibold">{suv.name}</h3>
                        <p className="text-xs text-primary font-medium">Selected</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-md">{suv.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> Up to {SUV_CAPACITY.limitedLuggage} passengers
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-heading font-bold">${pricing.basePrice.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">estimated</p>
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

        {/* Step 4: Review & Confirm */}
        {step === 4 && (
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

                {/* Pricing */}
                <div className="space-y-3 border-t border-border/50 pt-4">
                  <p className="text-xs font-medium tracking-widest uppercase text-primary">Pricing</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Luxury SUV</span>
                      <span>${pricing.basePrice.toFixed(2)}</span>
                    </div>
                    {needsSupportVan && (
                      <div className="flex justify-between text-sm">
                        <span>Support Van</span>
                        <span>${pricing.supportVanPrice.toFixed(2)}</span>
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
              {createBooking.isPending ? "Submitting..." : "Confirm Booking"}
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
