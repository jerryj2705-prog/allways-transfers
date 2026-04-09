import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useState, useMemo, useRef, useEffect } from "react";
import { Plane, Clock, MapPin, Star, Shield, Award, Phone, Baby, PawPrint, DollarSign, Mail, Menu, X, Quote } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/hero-suv_ee8b3ffa.jpg";
const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";
const FLEET_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/fleet-kia-carnival_d4324bff.webp";
const AIRPORT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/plane-tarmac_12935ebb.png";
const CHAUFFEUR_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/chauffeur_433d77f4.jpg";
const WEDDING_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/wedding_92293137.png";
const P2P_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/private-jet_ee739796.png";
const CHILD_SEAT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/child-seat_8653269a.png";
const FIXED_PRICES_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/fixed-prices_5453b61b.jpg";
const DOG_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/dog-in-car_de4ab663.png";
const PRO_DRIVER_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/chauffeur3_288d11fa.jpg";
const LUXURY_VEHICLE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/kia-interior_5a5efadf.jpg";
const NIGHT_OUT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/night-out_4b4fa337.png";
const AREAS_MAP_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/areas-of-operation_8de5f5bd.jpg";

const services = [
  {
    icon: Plane,
    title: "Airport Transfer",
    description: "Seamless pickup and drop-off to and from Sunshine Coast and Brisbane airports with flight tracking.",
    image: AIRPORT_IMG,
    priceKey: "base_airport_transfer",
  },
  {
    icon: Clock,
    title: "Hourly Hire",
    description: "Flexible chauffeur service by the hour for meetings, tours, or errands across the region.",
    minHoursKey: "min_hourly_hours",
    image: CHAUFFEUR_IMG,
    priceKey: "base_hourly_hire",
    priceLabel: "per hour",
  },
  {
    icon: MapPin,
    title: "Point to Point",
    description: "Direct, comfortable transfers between any two locations \u2014 including long-distance rides.",
    image: P2P_IMG,
    priceKey: "base_point_to_point",
  },
  {
    icon: Star,
    title: "Special Events",
    description: "Weddings, corporate events, funerals, and other special occasions with impeccable service.",
    image: WEDDING_IMG,
    priceKey: "base_special_events",
  },
];

const features = [
  {
    icon: Shield,
    title: "Professional Drivers",
    description: "Experienced, licensed chauffeurs committed to your safety, privacy, and comfort.",
    image: PRO_DRIVER_IMG,
  },
  {
    icon: DollarSign,
    title: "Fixed Prices",
    description: "No surge pricing, no surprises. Know your fare upfront before you book.",
    image: FIXED_PRICES_IMG,
  },
  {
    icon: Award,
    title: "Luxury Vehicles",
    description: "Premium SUV with leather interior, climate control, and complimentary amenities.",
    image: LUXURY_VEHICLE_IMG,
  },
  {
    icon: Baby,
    title: "Child Seats Available",
    description: "Travel safely with your little ones. Child and booster seats provided on request.",
    image: CHILD_SEAT_IMG,
  },
  {
    icon: PawPrint,
    title: "Pet Friendly",
    description: "Your furry companions are welcome. We accommodate pets with care and comfort.",
    image: DOG_IMG,
  },
  {
    icon: Phone,
    title: "24/7 Availability*",
    description: "Prebook anytime, day or night. We accommodate early flights and late events.",
    image: NIGHT_OUT_IMG,
  },
];

function StarRating({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${star <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

// Google logo SVG for attribution
function GoogleLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

type UnifiedReview = {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  source: "inapp" | "google";
  serviceType?: string;
  date?: string;
};

const INITIAL_REVIEWS = 3;
const LOAD_MORE_COUNT = 3;

function TestimonialsSection() {
  const { data: approvedReviews } = trpc.reviews.approved.useQuery();
  const { data: reviewStats } = trpc.reviews.publicStats.useQuery();
  const { data: googleData } = trpc.googleReviews.get.useQuery();
  const [visibleCount, setVisibleCount] = useState(INITIAL_REVIEWS);
  const prevVisibleCount = useRef(INITIAL_REVIEWS);
  const [animatingFrom, setAnimatingFrom] = useState(-1);

  // Track when visibleCount changes to trigger animation on new cards
  useEffect(() => {
    if (visibleCount > prevVisibleCount.current) {
      setAnimatingFrom(prevVisibleCount.current);
      // Clear animation state after animations complete
      const timer = setTimeout(() => setAnimatingFrom(-1), 600);
      prevVisibleCount.current = visibleCount;
      return () => clearTimeout(timer);
    }
    prevVisibleCount.current = visibleCount;
  }, [visibleCount]);

  // Merge in-app and Google reviews into a unified list
  const allReviews = useMemo(() => {
    const unified: UnifiedReview[] = [];

    // Add in-app approved reviews
    if (approvedReviews) {
      for (const r of approvedReviews) {
        unified.push({
          id: `inapp-${r.id}`,
          reviewerName: r.reviewerName,
          rating: r.rating,
          comment: r.comment,
          source: "inapp",
          serviceType: r.serviceType,
          date: new Date(r.createdAt).toLocaleDateString("en-AU", { month: "short", year: "numeric" }),
        });
      }
    }

    // Add Google reviews
    if (googleData?.reviews) {
      for (const r of googleData.reviews) {
        unified.push({
          id: `google-${r.id}`,
          reviewerName: r.authorName,
          rating: r.rating,
          comment: r.text ?? null,
          source: "google",
          date: r.publishTime ? new Date(r.publishTime).toLocaleDateString("en-AU", { month: "short", year: "numeric" }) : undefined,
        });
      }
    }

    // Sort by rating descending
    return unified.sort((a, b) => b.rating - a.rating);
  }, [approvedReviews, googleData]);

  // Compute combined stats
  const combinedStats = useMemo(() => {
    const inAppCount = reviewStats?.approved ?? 0;
    const inAppAvg = reviewStats?.averageRating ?? 0;
    const googleCount = googleData?.totalRatings ?? 0;
    const googleAvg = googleData?.rating ?? 0;

    const totalCount = inAppCount + googleCount;
    if (totalCount === 0) return { average: 0, count: 0 };

    const weightedAvg = ((inAppAvg * inAppCount) + (googleAvg * googleCount)) / totalCount;
    return {
      average: Math.round(weightedAvg * 10) / 10,
      count: totalCount,
    };
  }, [reviewStats, googleData]);

  if (!allReviews.length) {
    return null;
  }

  const serviceLabel = (type: string) => {
    const map: Record<string, string> = {
      airport_transfer: "Airport Transfer",
      hourly_hire: "Hourly Hire",
      point_to_point: "Point to Point",
      special_events: "Special Events",
    };
    return map[type] || type;
  };

  const displayReviews = allReviews.slice(0, visibleCount);
  const hasMore = visibleCount < allReviews.length;
  const remaining = allReviews.length - visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, allReviews.length));
  };

  return (
    <section id="testimonials" className="py-24 charcoal-panel">
      <div className="container">
        <div className="text-center mb-16 space-y-4">
          <p className="text-sm font-medium tracking-[0.25em] uppercase text-primary">
            Testimonials
          </p>
          <h2 className="font-heading text-3xl md:text-4xl tracking-tight text-offwhite">
            What Our Clients Say
          </h2>
          {combinedStats.count > 0 && (
            <div className="flex items-center justify-center gap-3">
              <StarRating rating={Math.round(combinedStats.average)} size="w-5 h-5" />
              <span className="text-lg font-semibold text-offwhite">{combinedStats.average}</span>
              <span className="text-muted-foreground">from {combinedStats.count} review{combinedStats.count !== 1 ? "s" : ""}</span>
            </div>
          )}
          {googleData?.configured && googleData.totalRatings > 0 && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <GoogleLogo className="w-3.5 h-3.5" />
              <span>Includes Google reviews</span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {displayReviews.map((review, idx) => {
            const isNew = animatingFrom >= 0 && idx >= animatingFrom;
            const staggerDelay = isNew ? (idx - animatingFrom) * 120 : 0;
            return (
            <Card
              key={`${review.id}-${idx}`}
              className={`bg-card border-border/50 hover:border-primary/30 transition-all duration-300 ${
                isNew ? "animate-review-in" : ""
              }`}
              style={isNew ? { animationDelay: `${staggerDelay}ms` } : undefined}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Quote className="w-8 h-8 text-primary/30" />
                  {review.source === "google" && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50 border border-border/30">
                      <GoogleLogo className="w-3 h-3" />
                      <span className="text-[10px] font-medium text-muted-foreground">Google</span>
                    </div>
                  )}
                </div>
                <StarRating rating={review.rating} />
                {review.comment && (
                  <p className="text-muted-foreground leading-relaxed italic line-clamp-4">
                    "{review.comment}"
                  </p>
                )}
                <div className="pt-2 border-t border-border/30">
                  <p className="font-semibold text-offwhite">{review.reviewerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {review.source === "inapp" && review.serviceType
                      ? `${serviceLabel(review.serviceType)}${review.date ? ` \u00B7 ${review.date}` : ""}`
                      : review.date ?? ""}
                  </p>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center mt-10">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              className="bg-transparent border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 px-8 py-2.5 text-sm font-medium transition-all"
            >
              Load More Reviews ({remaining} remaining)
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: pricingSettings } = trpc.pricing.getAll.useQuery();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getBasePrice = (key: string) => {
    const setting = pricingSettings?.find(s => s.settingKey === key);
    if (!setting) return null;
    const val = parseFloat(setting.settingValue);
    return val % 1 === 0 ? val.toFixed(0) : val.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <img src={LOGO_IMG} alt="All Ways Transfers" className="h-16 w-auto" />
          </div>
          <div className="hidden md:flex items-center justify-center gap-8 text-sm text-muted-foreground flex-1">
            <a href="#services" className="hover:text-primary transition-colors">Services</a>
            <a href="#fleet" className="hover:text-primary transition-colors">Our Fleet</a>
            <a href="#why-us" className="hover:text-primary transition-colors">Why Us</a>
            <a href="/contact" className="hover:text-primary transition-colors">Contact</a>
            <a href="/contact#faq" className="hover:text-primary transition-colors">FAQ</a>
            <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
            {user && (
              <a href="/my-bookings" className="hover:text-primary transition-colors">My Bookings</a>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setLocation("/book")}
              className="gold-gradient text-gold-foreground border-0 hover:opacity-90 transition-opacity font-medium hidden sm:inline-flex"
            >
              Book Now
            </Button>
            {/* Mobile hamburger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors" aria-label="Open menu">
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
                    <a href="#services" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors">Services</a>
                    <a href="#fleet" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors">Our Fleet</a>
                    <a href="#why-us" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors">Why Us</a>
                    <a href="/contact" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors">Contact</a>
                    <a href="/contact#faq" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors">FAQ</a>
                    <a href="/terms" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors">Terms</a>
                    {user && (
                      <a href="/my-bookings" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors">My Bookings</a>
                    )}
                  </nav>
                  <div className="p-4 border-t border-border/50">
                    <Button
                      onClick={() => { setMobileMenuOpen(false); setLocation("/book"); }}
                      className="w-full gold-gradient text-gold-foreground border-0 hover:opacity-90 transition-opacity font-medium"
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Width */}
      <section className="relative pt-20 min-h-screen flex items-center">
        {/* Full-width background image */}
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="Premium chauffeur service"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-2xl space-y-8 py-20">
            <div className="space-y-6">
              <p className="text-sm font-medium tracking-[0.3em] uppercase text-[oklch(0.82_0.11_85)]">
                Prebooked Private Transfers
              </p>
              <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-white">
                Personalised
                <span className="gold-text block mt-2">Luxury</span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 max-w-lg leading-relaxed">
                24/7* prebooked private transfers across the Sunshine Coast and Brisbane.
                Fixed prices, luxury vehicles, child seats, and pet-friendly options.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={() => setLocation("/book")}
                className="gold-gradient text-gold-foreground border-0 hover:opacity-90 transition-opacity text-base px-8 py-6 font-semibold"
              >
                Book Your Ride
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
                className="text-base px-8 py-6 border-white/30 text-white hover:border-white/60 hover:bg-white/10 transition-colors bg-transparent"
              >
                Explore Services
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Available 24/7*
              </div>
              <div>Sunshine Coast &amp; Brisbane</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 charcoal-panel">
        <div className="container">
          <div className="text-center mb-16 space-y-4">
            <p className="text-sm font-medium tracking-[0.25em] uppercase text-primary">
              Our Services
            </p>
            <h2 className="font-heading text-3xl md:text-4xl tracking-tight text-offwhite">
              Tailored to Your Journey
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From airport pickups to corporate events, hotel transfers to long-distance rides —
              we provide the perfect transport solution across the Sunshine Coast and Brisbane.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <Card
                key={service.title}
                className="group hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 border-border/50 cursor-pointer bg-card hover:border-primary/30 overflow-hidden"
                onClick={() => setLocation("/book")}
              >
                {service.image && (
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg gold-gradient flex items-center justify-center group-hover:scale-110 transition-transform">
                    <service.icon className="w-6 h-6 text-gold-foreground" />
                  </div>
                  <h3 className="font-heading text-lg text-card-foreground">{service.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                  {getBasePrice(service.priceKey) && (
                    <div className="pt-2 border-t border-border/30">
                      <span className="text-primary font-heading text-lg font-bold">
                        From ${getBasePrice(service.priceKey)}
                      </span>
                      {service.priceLabel && (
                        <span className="text-xs text-muted-foreground ml-1">/{service.priceLabel}</span>
                      )}
                      {(service as any).minHoursKey && (() => {
                        const minSetting = pricingSettings?.find(s => s.settingKey === (service as any).minHoursKey);
                        const minHrs = minSetting ? parseInt(minSetting.settingValue, 10) : null;
                        return minHrs ? (
                          <p className="text-xs text-muted-foreground mt-1">Minimum {minHrs} hour{minHrs !== 1 ? "s" : ""}</p>
                        ) : null;
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Fleet Section */}
      <section id="fleet" className="py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-border/30">
              <img
                src={FLEET_IMG}
                alt="Kia Carnival - All Ways Transfers fleet"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white font-heading text-xl">Luxury SUV</p>
                <p className="text-white/80 text-sm mt-1">Premium comfort for every journey</p>
              </div>
            </div>
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-sm font-medium tracking-[0.25em] uppercase text-primary">
                  Our Fleet
                </p>
                <h2 className="font-heading text-3xl md:text-4xl tracking-tight">
                  Luxury SUV
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our premium luxury SUV offers the perfect blend of comfort, style, and space.
                  Ideal for both business and leisure travel across the Sunshine Coast and Brisbane.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="charcoal-panel rounded-lg p-4 border border-border/30">
                  <p className="text-2xl font-heading gold-text">5</p>
                  <p className="text-sm text-muted-foreground">Passengers + luggage</p>
                </div>
                <div className="charcoal-panel rounded-lg p-4 border border-border/30">
                  <p className="text-2xl font-heading gold-text">7</p>
                  <p className="text-sm text-muted-foreground">Passengers, limited luggage</p>
                </div>
                <div className="charcoal-panel rounded-lg p-4 col-span-2 border border-border/30">
                  <p className="text-sm font-medium text-offwhite">Support Van Available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    For large or oversized luggage and freight, an additional support van
                    can be arranged at a separate charge.
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => setLocation("/book")}
                className="gold-gradient text-gold-foreground border-0 hover:opacity-90 transition-opacity font-semibold"
              >
                Book This Vehicle
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section id="why-us" className="py-24 charcoal-panel">
        <div className="container">
          <div className="text-center mb-16 space-y-4">
            <p className="text-sm font-medium tracking-[0.25em] uppercase text-primary">
              Why Choose Us
            </p>
            <h2 className="font-heading text-3xl md:text-4xl tracking-tight text-offwhite">
              The Gold Standard
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="group text-center space-y-4 rounded-xl border border-border/50 overflow-hidden bg-card hover:border-primary/30 transition-all duration-300">
                {feature.image ? (
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                  </div>
                ) : null}
                <div className="px-6 pb-6 space-y-3">
                  <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center mx-auto -mt-7 relative z-10 shadow-lg">
                    <feature.icon className="w-6 h-6 text-gold-foreground" />
                  </div>
                  <h3 className="font-heading text-xl text-offwhite">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Areas of Operation Section */}
      <section id="areas" className="py-24">
        <div className="container">
          <div className="text-center mb-16 space-y-4">
            <p className="text-sm font-medium tracking-[0.25em] uppercase text-primary">
              Coverage
            </p>
            <h2 className="font-heading text-3xl md:text-4xl tracking-tight text-offwhite">
              Areas of Operation
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Servicing South-East Queensland with primary coverage across the Sunshine Coast and Noosa,
              and secondary coverage extending to Brisbane, Moreton Bay, and the Fraser Coast region.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
              <img
                src={AREAS_MAP_IMG}
                alt="Areas of Operation - South-East Queensland"
                className="w-full h-auto"
              />
            </div>
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500" />
                  <h3 className="font-heading text-xl text-offwhite">Primary Area</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-7">
                  Sunshine Coast and Noosa — our home base. Regular daily services including
                  airport transfers, hourly hire, and event transport.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <h3 className="font-heading text-xl text-offwhite">Secondary Area</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-7">
                  Brisbane, Moreton Bay, Fraser Coast, and Gympie regions. Available for
                  prebooked transfers, airport runs, and long-distance rides.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-primary" />
                  <h3 className="font-heading text-xl text-offwhite">Other Areas</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-7">
                  Additional regions considered upon request. Contact us for long-distance
                  transfers to Gold Coast, Toowoomba, Bundaberg, and beyond.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => setLocation("/book")}
                className="gold-gradient text-gold-foreground border-0 hover:opacity-90 transition-opacity font-semibold"
              >
                Book a Transfer
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <div className="relative rounded-2xl overflow-hidden gold-gradient p-12 md:p-16 text-center">
            <div className="relative z-10 space-y-6">
              <h2 className="font-heading text-3xl md:text-4xl text-gold-foreground tracking-tight">
                Ready to Experience Luxury?
              </h2>
              <p className="text-gold-foreground/80 max-w-lg mx-auto">
                Prebook your private transfer today. Fixed prices, professional drivers,
                and luxury comfort across the Sunshine Coast and Brisbane.
              </p>
              <Button
                size="lg"
                onClick={() => setLocation("/book")}
                className="bg-background text-foreground hover:bg-background/90 text-base px-8 py-6 font-semibold"
              >
                Book Your Ride Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Out-of-hours footnote */}
      <section className="pb-8 pt-0">
        <div className="container">
          <p className="text-xs text-muted-foreground leading-relaxed">
            * An out-of-hours surcharge
            {(() => {
              const setting = pricingSettings?.find(s => s.settingKey === "surcharge_out_of_hours");
              if (setting && setting.isActive) {
                return ` of $${parseFloat(setting.settingValue).toFixed(2)}`;
              }
              return "";
            })()}{" "}
            applies to pickups between 19:00 and 07:00.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div className="space-y-4">
              <img src={LOGO_IMG} alt="All Ways Transfers" className="h-12 w-auto" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Prebooked private transfers across the Sunshine Coast and Brisbane. Fixed prices, luxury vehicles, child seats, and pet-friendly options.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="font-heading text-sm font-bold tracking-widest uppercase text-primary">Quick Links</h4>
              <div className="space-y-2">
                <a href="#services" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Our Services</a>
                <a href="#fleet" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Our Fleet</a>
                <a href="#why-us" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Why Choose Us</a>
                <a href="/book" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Book a Transfer</a>
                <a href="/contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Contact Us</a>
                {user && (
                  <a href="/my-bookings" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">My Bookings</a>
                )}
                {user?.role === "admin" && (
                  <a href="/admin" className="block text-sm text-amber-400 hover:text-amber-300 transition-colors">Admin Dashboard</a>
                )}
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="font-heading text-sm font-bold tracking-widest uppercase text-primary">Contact Us</h4>
              <div className="space-y-3">
                <a href="tel:0466544068" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  0466 544 068
                </a>
                <a href="mailto:bookings@allwaystransfers.com.au" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span>bookings@allwaystransfers.com.au</span>
                </a>
                <a href="mailto:admin@allwaystransfers.com.au" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span>admin@allwaystransfers.com.au</span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} All Ways Transfers. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              ABN 18 715 944 056 &middot; Queensland, Australia
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
