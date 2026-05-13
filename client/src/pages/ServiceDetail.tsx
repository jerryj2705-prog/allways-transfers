import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { Plane, Clock, MapPin, Star, ArrowLeft, ArrowRight, Menu, X, Check, Shield, Users, Baby, PawPrint, DollarSign, Package, Truck } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";
const AIRPORT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/plane-tarmac_12935ebb.png";
const CHAUFFEUR_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/chauffeur_433d77f4.jpg";
const P2P_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/private-jet_ee739796.png";
const WEDDING_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/wedding_92293137.png";
const FREIGHT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/freight-van_bff50b19.jpg";

type ServiceKey = "airport_transfer" | "hourly_hire" | "point_to_point" | "special_events" | "freight";

const SERVICE_DATA: Record<ServiceKey, {
  title: string;
  tagline: string;
  icon: React.ElementType;
  image: string;
  priceKey: string;
  priceLabel?: string;
  minHoursKey?: string;
  heroDescription: string;
  sections: { title: string; content: string; icon?: React.ElementType }[];
  highlights: string[];
}> = {
  airport_transfer: {
    title: "Airport Transfer",
    tagline: "SEAMLESS AIRPORT CONNECTIONS",
    icon: Plane,
    image: AIRPORT_IMG,
    priceKey: "base_airport_transfer",
    heroDescription: "Reliable, stress-free pickup and drop-off to and from Sunshine Coast Airport and Brisbane Airport. We track your flight so we're always there when you land.",
    sections: [
      {
        title: "How It Works",
        icon: Check,
        content: "Book your transfer online with your flight details. We monitor your flight in real time — if your flight is delayed, we adjust automatically. Your chauffeur will be waiting in the arrivals hall with a name board, ready to assist with your luggage and escort you to your luxury vehicle. For departures, we pick you up from your door with plenty of time to spare.",
      },
      {
        title: "What's Included",
        icon: Shield,
        content: "Every airport transfer includes meet-and-greet service, flight tracking, luggage assistance, complimentary bottled water, phone chargers, and a clean, air-conditioned luxury SUV. There are no hidden fees — the price you see is the price you pay, regardless of traffic or delays.",
      },
      {
        title: "Coverage Area",
        icon: MapPin,
        content: "We service Sunshine Coast Airport (MCY) and Brisbane Airport (BNE) with transfers to and from all Sunshine Coast suburbs, Noosa, Hinterland areas, and Brisbane CBD. Long-distance transfers to the Gold Coast and beyond are also available on request.",
      },
      {
        title: "Perfect For",
        icon: Users,
        content: "Business travellers needing a reliable connection, families arriving with children and luggage, holiday-makers heading to Noosa or the Sunshine Coast, and anyone who values a calm, professional start or end to their journey.",
      },
    ],
    highlights: [
      "Real-time flight tracking",
      "Meet & greet at arrivals",
      "Luggage assistance included",
      "Fixed prices — no surge",
      "Child seats available",
      "Pet-friendly on request",
    ],
  },
  hourly_hire: {
    title: "Hourly Hire",
    tagline: "YOUR CHAUFFEUR, YOUR SCHEDULE",
    icon: Clock,
    image: CHAUFFEUR_IMG,
    priceKey: "base_hourly_hire",
    priceLabel: "per hour",
    minHoursKey: "min_hourly_hours",
    heroDescription: "Flexible chauffeur service by the hour. Whether it's business meetings, wine tours, shopping trips, or a day exploring the Sunshine Coast — your driver is at your disposal.",
    sections: [
      {
        title: "How It Works",
        icon: Check,
        content: "Book your chauffeur for a set number of hours. Your driver picks you up at the agreed time and stays with you for the entire duration. Make as many stops as you like — there's no per-stop charge. You direct the itinerary, and we handle the driving.",
      },
      {
        title: "Popular Uses",
        icon: Star,
        content: "Wine tours through the Sunshine Coast Hinterland, corporate meeting shuttles between venues, wedding day transport for the bridal party, shopping excursions, real estate inspections, medical appointment runs, or simply a relaxed day out without the stress of driving.",
      },
      {
        title: "What's Included",
        icon: Shield,
        content: "A professional chauffeur and luxury SUV for the entire booking period. Complimentary water, phone chargers, and climate-controlled comfort. Waiting time between stops is included — no extra charges for the driver to wait while you're at appointments or venues.",
      },
      {
        title: "Flexibility",
        icon: Clock,
        content: "Need to extend your hire? Just let your driver know, and we'll accommodate additional hours at the same hourly rate (subject to availability). Routes and stops can be changed on the fly — your chauffeur adapts to your schedule.",
      },
    ],
    highlights: [
      "Unlimited stops included",
      "No per-stop charges",
      "Extend hours on the day",
      "Professional chauffeur",
      "Luxury SUV comfort",
      "Flexible itinerary",
    ],
  },
  point_to_point: {
    title: "Point to Point",
    tagline: "DIRECT PRIVATE TRANSFERS",
    icon: MapPin,
    image: P2P_IMG,
    priceKey: "base_point_to_point",
    heroDescription: "Comfortable, direct transfers between any two locations. From short local trips to long-distance journeys — travel in style with a professional chauffeur.",
    sections: [
      {
        title: "How It Works",
        icon: Check,
        content: "Simply enter your pickup and drop-off locations when booking. We calculate the distance and provide a fixed quote upfront — no meters, no surprises. Your chauffeur arrives at the agreed time, helps with luggage, and takes the optimal route to your destination.",
      },
      {
        title: "Short & Long Distance",
        icon: MapPin,
        content: "Whether it's a 15-minute trip across town or a 2-hour drive to Brisbane, our point-to-point service covers it all. Popular routes include Sunshine Coast to Brisbane CBD, Noosa to airport, hotel to restaurant, and inter-suburb transfers throughout South East Queensland.",
      },
      {
        title: "What's Included",
        icon: Shield,
        content: "Fixed pricing with no surge or hidden fees. Luggage assistance, complimentary water, phone chargers, and a clean luxury SUV. For longer journeys, enjoy the spacious interior with climate control and a smooth, comfortable ride.",
      },
      {
        title: "Additional Stops",
        icon: Users,
        content: "Need to make a quick stop along the way? You can add additional pickup or drop-off points during booking. Each additional stop is clearly priced upfront so there are no surprises. Perfect for collecting friends, making a brief errand, or splitting a ride.",
      },
    ],
    highlights: [
      "Fixed upfront pricing",
      "No surge charges",
      "Additional stops available",
      "Short & long distance",
      "Door-to-door service",
      "Luggage assistance",
    ],
  },
  special_events: {
    title: "Special Events",
    tagline: "MAKING MOMENTS MEMORABLE",
    icon: Star,
    image: WEDDING_IMG,
    priceKey: "base_special_events",
    heroDescription: "Weddings, corporate functions, funerals, school formals, and other special occasions — arrive in style with impeccable, discreet chauffeur service tailored to your event.",
    sections: [
      {
        title: "Weddings",
        icon: Star,
        content: "Make your special day even more memorable with our wedding transfer service. We provide transport for the bride, groom, bridal party, and guests. Our luxury SUV is presented immaculately, and your chauffeur ensures everything runs on time. We coordinate with your wedding planner to align with your schedule perfectly.",
      },
      {
        title: "Corporate Events",
        icon: Shield,
        content: "Impress clients and colleagues with professional chauffeur transport to conferences, gala dinners, product launches, and corporate retreats. We offer multi-vehicle coordination for larger groups and can provide consistent, reliable service for recurring corporate needs.",
      },
      {
        title: "Funerals & Sensitive Occasions",
        icon: Users,
        content: "We understand the importance of dignity and punctuality during difficult times. Our chauffeurs provide respectful, discreet service for funeral transport, ensuring your family arrives comfortably and on time. We coordinate with funeral directors as needed.",
      },
      {
        title: "Other Occasions",
        icon: Clock,
        content: "School formals, milestone birthdays, anniversary celebrations, race days, sporting events — whatever the occasion, we provide a premium transport experience. Let us know your requirements, and we'll tailor the service to suit your event perfectly.",
      },
    ],
    highlights: [
      "Wedding specialist",
      "Corporate coordination",
      "Respectful funeral service",
      "Multi-vehicle available",
      "Tailored to your event",
      "Impeccable presentation",
    ],
  },
  freight: {
    title: "Freight",
    tagline: "RELIABLE GOODS DELIVERY",
    icon: Package,
    image: FREIGHT_IMG,
    priceKey: "base_freight",
    heroDescription: "Need to move goods, parcels, or oversized items across the Sunshine Coast or to Brisbane? Our Mercedes-Benz Vito cargo van provides reliable, professional freight delivery with the same premium service you expect from All Ways Transfers.",
    sections: [
      {
        title: "How It Works",
        icon: Check,
        content: "Book your freight delivery online with pickup and drop-off locations. Our driver arrives with the Mercedes-Benz Vito, carefully loads your items, and delivers them safely to the destination. You'll receive a fixed upfront quote based on distance — no hidden fees.",
      },
      {
        title: "What We Carry",
        icon: Truck,
        content: "Golf clubs, surfboards, business equipment, furniture, parcels, event supplies, and more. Our spacious van handles bulky and oversized items that won't fit in a standard vehicle. If you're unsure whether your items will fit, contact us and we'll advise.",
      },
      {
        title: "Coverage Area",
        icon: MapPin,
        content: "We service the entire Sunshine Coast region, Noosa, Hinterland areas, Brisbane, and the Gold Coast. Long-distance freight runs are available on request. Same-day delivery is subject to availability.",
      },
      {
        title: "Perfect For",
        icon: Users,
        content: "Businesses needing reliable local delivery, event organisers moving supplies between venues, travellers with oversized luggage or sporting equipment, and anyone who needs items moved professionally and on time.",
      },
    ],
    highlights: [
      "Mercedes-Benz Vito van",
      "Fixed upfront pricing",
      "Oversized items welcome",
      "Same-day available",
      "Professional handling",
      "Sunshine Coast & Brisbane",
    ],
  },
};

const VALID_KEYS = new Set<string>(["airport_transfer", "hourly_hire", "point_to_point", "special_events", "freight"]);

export default function ServiceDetail() {
  const params = useParams<{ serviceType: string }>();
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const serviceKey = params.serviceType as ServiceKey;
  const service = VALID_KEYS.has(serviceKey) ? SERVICE_DATA[serviceKey] : null;

  // Fetch pricing
  const { data: pricingSettings } = trpc.pricing.getAll.useQuery();

  const getBasePrice = (key: string) => {
    const setting = pricingSettings?.find((s: any) => s.settingKey === key);
    if (!setting) return null;
    const val = parseFloat(setting.settingValue);
    return isNaN(val) ? null : val.toFixed(0);
  };

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Service Not Found</h1>
          <p className="text-muted-foreground">The service you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/")} className="gold-gradient text-gold-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const Icon = service.icon;
  const basePrice = getBasePrice(service.priceKey);
  const minHours = service.minHoursKey
    ? (() => {
        const s = pricingSettings?.find((p: any) => p.settingKey === service.minHoursKey);
        return s ? parseInt(s.settingValue, 10) : null;
      })()
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-amber-900/20">
        <div className="container flex items-center justify-between h-16">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={LOGO_IMG} alt="All Ways Transfers" className="h-10 w-auto" />
          </button>
          <nav className="hidden sm:flex items-center gap-6">
            <button onClick={() => navigate("/")} className="text-sm text-gray-300 hover:text-amber-400 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
            <Button
              onClick={() => navigate(`/book?service=${serviceKey}`)}
              className="gold-gradient text-gold-foreground border-0 hover:opacity-90"
            >
              Book This Service
            </Button>
          </nav>
          {/* Mobile hamburger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="sm:hidden p-2 text-gray-300 hover:text-amber-400 transition-colors" aria-label="Open menu">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background border-l border-border p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                  <img src={LOGO_IMG} alt="All Ways Transfers" className="h-10 w-auto" />
                  <SheetClose asChild>
                    <button className="p-2 text-muted-foreground hover:text-primary transition-colors" aria-label="Close menu">
                      <X className="w-5 h-5" />
                    </button>
                  </SheetClose>
                </div>
                <nav className="flex flex-col gap-1 p-4 flex-1">
                  <a href="/" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors">Home</a>
                  <a href="/contact" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors">Contact</a>
                  <a href="/terms" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors">Terms</a>
                  <a href="/my-bookings" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors">My Bookings</a>
                </nav>
                <div className="p-4 border-t border-border/50">
                  <Button
                    onClick={() => { setMobileMenuOpen(false); navigate(`/book?service=${serviceKey}`); }}
                    className="w-full gold-gradient text-gold-foreground border-0 hover:opacity-90"
                  >
                    Book This Service
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16">
        <div className="relative h-[340px] md:h-[400px] overflow-hidden">
          <img
            src={service.image}
            alt={service.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
          <div className="absolute inset-0 flex items-end">
            <div className="container pb-10 space-y-4">
              <div className="inline-flex items-center gap-2 bg-amber-600/10 border border-amber-600/20 rounded-full px-4 py-1.5">
                <Icon className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-sm font-medium tracking-wider">{service.tagline}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {service.title}
              </h1>
              <p className="text-white/70 max-w-2xl text-lg leading-relaxed">
                {service.heroDescription}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {minHours && (
                  <span className="text-sm text-amber-400/80 border border-amber-400/30 rounded-full px-3 py-0.5">
                    Minimum {minHours} hour{minHours !== 1 ? "s" : ""}
                  </span>
                )}
                <a
                  href={`/book?service=${serviceKey}&mode=quote`}
                  className="inline-flex items-center gap-2 gold-gradient text-gold-foreground font-medium px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm"
                >
                  Get a Quote
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Bar */}
      <section className="bg-card border-y border-border/50">
        <div className="container py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {service.highlights.map((highlight) => (
              <div key={highlight} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground">{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detail Sections */}
      <section className="py-16">
        <div className="container max-w-4xl space-y-8">
          {service.sections.map((section) => {
            const SectionIcon = section.icon || Check;
            return (
              <Card key={section.title} className="bg-card border-border/50 overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center shrink-0 mt-0.5">
                      <SectionIcon className="w-5 h-5 text-gold-foreground" />
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-xl font-bold text-amber-400">{section.title}</h2>
                      <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 charcoal-panel">
        <div className="container max-w-2xl text-center space-y-6">
          <h2 className="font-heading text-3xl md:text-4xl tracking-tight text-offwhite">
            Ready to Book?
          </h2>
          <p className="text-muted-foreground text-lg">
            Secure your {service.title.toLowerCase()} now with fixed pricing and no hidden fees.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="gap-2 bg-transparent border-border/50 hover:border-primary/40 text-muted-foreground hover:text-primary px-8 py-6 text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            <Button
              onClick={() => navigate(`/book?service=${serviceKey}`)}
              className="gap-2 gold-gradient text-gold-foreground border-0 hover:opacity-90 px-8 py-6 text-base font-semibold"
            >
              Continue to Booking
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer spacer */}
      <div className="h-8" />
    </div>
  );
}
