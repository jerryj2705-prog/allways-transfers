import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ChevronLeft, FileText, Loader2 } from "lucide-react";
import { SERVICE_TYPES } from "@shared/types";
import type { ServiceType } from "@shared/types";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

// Parse an AEST (UTC+10) datetime-local value into a UTC millisecond timestamp.
function fromLocalDateTimeValue(value: string): number {
  const d = new Date(value + ":00.000Z");
  return d.getTime() - 10 * 60 * 60 * 1000;
}

export default function AdminCreateQuote() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType | "">("");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [passengerCount, setPassengerCount] = useState<string>("1");
  const [luggageCount, setLuggageCount] = useState<string>("0");
  const [totalPrice, setTotalPrice] = useState<string>("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  const { data: vehicles } = trpc.vehicles.list.useQuery();

  const createQuote = trpc.bookings.adminCreateQuote.useMutation({
    onSuccess: (data) => {
      toast.success(`Quote ${data.referenceNumber} created${sendEmail ? " and emailed to the client" : ""}`);
      setLocation(`/admin/booking/${data.id}`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create quote");
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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

  const handleSubmit = () => {
    if (!clientName.trim()) return toast.error("Client name is required");
    if (!clientEmail.trim()) return toast.error("Client email is required");
    if (!clientPhone.trim()) return toast.error("Client phone is required");
    if (!serviceType) return toast.error("Please select a service type");
    if (!vehicleId) return toast.error("Please select a vehicle");
    if (!pickupAddress.trim()) return toast.error("Pickup address is required");
    if (!pickupDate) return toast.error("Pickup date/time is required");
    if (fromLocalDateTimeValue(pickupDate) < Date.now())
      return toast.error("Pickup date must be in the future");

    const price = parseFloat(totalPrice);
    if (Number.isNaN(price) || price < 0) return toast.error("Please enter a valid total price");

    const selectedVehicle = (vehicles ?? []).find((v) => v.id === parseInt(vehicleId, 10));
    if (!selectedVehicle) return toast.error("Selected vehicle not found");

    createQuote.mutate({
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      serviceType,
      pickupAddress: pickupAddress.trim(),
      dropoffAddress: dropoffAddress.trim() || null,
      pickupDate: fromLocalDateTimeValue(pickupDate),
      passengerCount: parseInt(passengerCount, 10) || 0,
      luggageCount: parseInt(luggageCount, 10) || 0,
      vehicleId: selectedVehicle.id,
      vehicleName: selectedVehicle.name,
      totalPrice: price,
      specialRequests: specialRequests.trim() || null,
      sendEmail,
      origin: window.location.origin,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-20">
          <button
            onClick={() => setLocation("/admin")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <img src={LOGO_IMG} alt="All Ways Transfers" className="h-10" />
        </div>
      </div>

      <div className="container py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">Create Quote</h1>
            <p className="text-sm text-muted-foreground">
              Manually create a quote with a custom price. The client can accept it to convert it into a booking.
            </p>
          </div>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-6 space-y-5">
            {/* Client details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-name">Client Name *</Label>
                <Input id="client-name" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-phone">Client Phone *</Label>
                <Input id="client-phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="04xx xxx xxx" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-email">Client Email *</Label>
              <Input id="client-email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@example.com" />
            </div>

            {/* Service + vehicle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-type">Service Type *</Label>
                <Select value={serviceType} onValueChange={(v) => setServiceType(v as ServiceType)}>
                  <SelectTrigger id="service-type"><SelectValue placeholder="Select service" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SERVICE_TYPES).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle *</Label>
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger id="vehicle"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    {(vehicles ?? []).map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Addresses */}
            <div className="space-y-2">
              <Label htmlFor="pickup-address">Pickup Address *</Label>
              <Input id="pickup-address" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="Pickup location" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dropoff-address">Drop-off Address</Label>
              <Input id="dropoff-address" value={dropoffAddress} onChange={(e) => setDropoffAddress(e.target.value)} placeholder="Drop-off location (optional)" />
            </div>

            {/* Date + counts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup-date">Pickup Date &amp; Time *</Label>
                <Input id="pickup-date" type="datetime-local" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passengers">Passengers</Label>
                <Input id="passengers" type="number" min="0" max="7" value={passengerCount} onChange={(e) => setPassengerCount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="luggage">Luggage</Label>
                <Input id="luggage" type="number" min="0" max="20" value={luggageCount} onChange={(e) => setLuggageCount(e.target.value)} />
              </div>
            </div>

            {/* Custom price */}
            <div className="space-y-2">
              <Label htmlFor="total-price">Total Price (AUD) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input id="total-price" type="number" min="0" step="0.01" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} placeholder="0.00" className="pl-7" />
              </div>
              <p className="text-xs text-muted-foreground">
                Your custom/negotiated price. This exact amount appears on the quote PDF and is carried over when the quote is converted to a booking.
              </p>
            </div>

            {/* Special requests */}
            <div className="space-y-2">
              <Label htmlFor="special-requests">Special Requests / Notes</Label>
              <Textarea id="special-requests" value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} placeholder="Any special requirements..." rows={3} />
            </div>

            {/* Send email */}
            <div className="flex items-center gap-2">
              <Checkbox id="send-email" checked={sendEmail} onCheckedChange={(c) => setSendEmail(c === true)} />
              <Label htmlFor="send-email" className="cursor-pointer font-normal">
                Email this quote to the client now
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setLocation("/admin")} className="bg-transparent">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createQuote.isPending}
                className="gap-2 gold-gradient text-gold-foreground border-0 hover:opacity-90"
              >
                {createQuote.isPending ? (<><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>) : "Create Quote"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
