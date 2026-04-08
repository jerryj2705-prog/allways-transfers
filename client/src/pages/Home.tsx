import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Plane, Clock, MapPin, Star, Shield, Award, Phone } from "lucide-react";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/hero-suv_ee8b3ffa.jpg";
const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

const services = [
  {
    icon: Plane,
    title: "Airport Transfer",
    description: "Seamless pickup and drop-off to and from the airport with flight tracking.",
  },
  {
    icon: Clock,
    title: "Hourly Hire",
    description: "Flexible chauffeur service by the hour for meetings, tours, or errands.",
  },
  {
    icon: MapPin,
    title: "Point to Point",
    description: "Direct, comfortable transfer between any two locations in Queensland.",
  },
  {
    icon: Star,
    title: "Special Events",
    description: "Weddings, corporate events, funerals, and other special occasions.",
  },
];

const features = [
  {
    icon: Shield,
    title: "Professional & Discreet",
    description: "Experienced, licensed chauffeurs committed to your privacy and comfort.",
  },
  {
    icon: Award,
    title: "Luxury Fleet",
    description: "Premium SUV with leather interior, climate control, and complimentary amenities.",
  },
  {
    icon: Phone,
    title: "24/7 Availability",
    description: "Book anytime, day or night. We accommodate early flights and late events.",
  },
];

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={LOGO_IMG} alt="All Ways Transfers" className="h-8 w-auto" />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#services" className="hover:text-primary transition-colors">Services</a>
            <a href="#fleet" className="hover:text-primary transition-colors">Our Fleet</a>
            <a href="#why-us" className="hover:text-primary transition-colors">Why Us</a>
          </div>
          <Button
            onClick={() => setLocation("/book")}
            className="gold-gradient text-gold-foreground border-0 hover:opacity-90 transition-opacity font-medium"
          >
            Book Now
          </Button>
        </div>
      </nav>

      {/* Hero Section - Full Width */}
      <section className="relative pt-16 min-h-screen flex items-center">
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
                Premium Chauffeur Service
              </p>
              <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-white">
                Personalised
                <span className="gold-text block mt-2">Luxury</span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 max-w-lg leading-relaxed">
                Experience Queensland's finest chauffeur service. Luxury SUV transport
                for discerning travellers who expect nothing but the best.
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
                Available 24/7
              </div>
              <div>Queensland, Australia</div>
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
              Whether it's a business trip, airport transfer, or a special celebration,
              we provide the perfect transport solution.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <Card
                key={service.title}
                className="group hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 border-border/50 cursor-pointer bg-card hover:border-primary/30"
                onClick={() => setLocation("/book")}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg gold-gradient flex items-center justify-center group-hover:scale-110 transition-transform">
                    <service.icon className="w-6 h-6 text-gold-foreground" />
                  </div>
                  <h3 className="font-heading text-lg text-card-foreground">{service.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
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
                src={HERO_IMG}
                alt="Luxury SUV fleet"
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
                  Ideal for both business and leisure travel across Queensland.
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
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto">
                  <feature.icon className="w-7 h-7 text-gold-foreground" />
                </div>
                <h3 className="font-heading text-xl text-offwhite">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <div className="relative rounded-2xl overflow-hidden gold-gradient p-12 md:p-16 text-center">
            <div className="relative z-10 space-y-6">
              <h2 className="font-heading text-3xl md:text-4xl text-gold-foreground tracking-tight">
                Ready to Experience Luxury?
              </h2>
              <p className="text-gold-foreground/80 max-w-lg mx-auto">
                Book your premium chauffeur service today and travel in comfort and style
                across Queensland.
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

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={LOGO_IMG} alt="All Ways Transfers" className="h-6 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground">
              Premium chauffeur service — Queensland, Australia
            </p>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} All Ways Transfers. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
