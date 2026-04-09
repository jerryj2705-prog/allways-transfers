import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useState } from "react";
import { ArrowLeft, FileText, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

export default function Terms() {
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <Button onClick={() => navigate("/book")} className="bg-amber-600 hover:bg-amber-700 text-white">
              Book Now
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
                  <a href="/contact#faq" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors">FAQ</a>
                  <a href="/terms" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-amber-400 bg-secondary/50">Terms</a>
                  <a href="/my-bookings" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors">My Bookings</a>
                </nav>
                <div className="p-4 border-t border-border/50">
                  <Button
                    onClick={() => { setMobileMenuOpen(false); navigate("/book"); }}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-black via-gray-950 to-background">
        <div className="container text-center">
          <div className="inline-flex items-center gap-2 bg-amber-600/10 border border-amber-600/20 rounded-full px-4 py-1.5 mb-4">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">LEGAL</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Terms & <span className="text-amber-400">Conditions</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Please read these terms carefully before making a booking with All Ways Transfers.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container max-w-4xl space-y-8">

          {/* 1. About Our Service */}
          <Card className="bg-card border-border">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-amber-400 mb-4">1. About Our Service</h2>
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <p>
                  All Ways Transfers provides prebooked private chauffeur transfer services across the Sunshine Coast, Brisbane, and South East Queensland. All transfers must be booked in advance through our website. We do not operate as a taxi or ride-share service and do not accept unbooked or on-demand requests.
                </p>
                <p>
                  Our services include Airport Transfers, Hourly Hire, Point to Point transfers, and Special Events (weddings, corporate functions, funerals, and other occasions). Service availability and pricing are subject to the operator's discretion and may change without prior notice.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 2. Booking & Confirmation */}
          <Card className="bg-card border-border">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-amber-400 mb-4">2. Booking & Confirmation</h2>
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <p>
                  By submitting a booking through our website, you confirm that all information provided is accurate and complete. You agree to be bound by these Terms and Conditions at the time of booking.
                </p>
                <p>
                  Upon successful submission, you will receive a booking reference number (e.g., AWT-XXXXXX) and a confirmation email. Your booking status will be visible on the <strong className="text-foreground">My Bookings</strong> page after logging in. Bookings are initially set to "Pending" and will be confirmed by the operator.
                </p>
                <p>
                  It is your responsibility to ensure you are available at the designated pickup location at the agreed time. If you are not present within a reasonable timeframe, the driver may depart and the full fare may still apply.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 3. Pricing & Payment */}
          <Card className="bg-card border-border">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-amber-400 mb-4">3. Pricing & Payment</h2>
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <p>
                  All prices are quoted in Australian Dollars (AUD) and include GST where applicable. The quoted price is calculated from a base service fare plus any applicable surcharges, which may include:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong className="text-foreground">Distance surcharge</strong> — calculated in 50 km blocks for longer transfers</li>
                  <li><strong className="text-foreground">Out-of-hours surcharge</strong> — for pickups between 7:00 PM and 7:00 AM</li>
                  <li><strong className="text-foreground">Out-of-area surcharge</strong> — for transfers outside the Sunshine Coast and Noosa region</li>
                  <li><strong className="text-foreground">Fuel levy</strong> — if applicable, as set by the operator</li>
                  <li><strong className="text-foreground">Card processing surcharge</strong> — a 2% surcharge applies when paying the driver by credit card</li>
                </ul>
                <p>
                  The full price breakdown is displayed before you confirm your booking. The quoted price is an estimate and the final amount may vary based on actual conditions (e.g., route changes, tolls, waiting time).
                </p>
                <p>
                  We accept three payment methods: <strong className="text-foreground">Pre-pay by Credit Card</strong> (via Stripe at the time of booking), <strong className="text-foreground">Pay Driver by Card</strong> (on the day, with a 2% surcharge), or <strong className="text-foreground">Pay Driver by Cash</strong> (on the day — please have the correct amount ready, as the driver is not required to carry change).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 4. Cancellation Policy */}
          <Card className="bg-card border-border">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-amber-400 mb-4">4. Cancellation Policy</h2>
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <p>
                  You may cancel a booking at any time through the <strong className="text-foreground">My Bookings</strong> page. The following cancellation tiers apply based on how far in advance you cancel relative to the scheduled pickup time:
                </p>
                <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">More than 24 hours before pickup</p>
                      <p className="text-sm">Free cancellation — no charge applies.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Less than 24 hours but more than 4 hours before pickup</p>
                      <p className="text-sm">A late cancellation fee applies. The charge is a percentage of the total booking price (as configured by the operator, typically 50%).</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Less than 4 hours before pickup</p>
                      <p className="text-sm">No refund is available. The full booking amount is payable.</p>
                    </div>
                  </div>
                </div>
                <p>
                  Cancellation confirmation will be sent to your registered email address. You can also view the cancellation status on your My Bookings page. Refunds for pre-paid bookings (where applicable) will be processed to the original payment method.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 5. Modifications */}
          <Card className="bg-card border-border">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-amber-400 mb-4">5. Booking Modifications</h2>
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <p>
                  You may modify certain details of a pending or confirmed booking through the <strong className="text-foreground">My Bookings</strong> page, including the pickup date, time, address, and passenger count. Modifications are not available for completed or cancelled bookings.
                </p>
                <p>
                  The operator will be notified of any modifications. Please note that significant changes (e.g., a different destination or service type) may require cancelling the existing booking and creating a new one.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 6. Vehicle & Capacity */}
          <Card className="bg-card border-border">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-amber-400 mb-4">6. Vehicle & Capacity</h2>
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <p>
                  Our luxury SUV accommodates up to 5 passengers with standard check-in luggage, or up to 7 passengers with limited luggage. A support van may be added for additional luggage and freight at the operator's discretion.
                </p>
                <p>
                  We provide rear-facing, forward-facing, and booster child seats at no extra charge. All child seats comply with Australian safety standards. You can select the type and quantity during the booking process (up to 2 of each type).
                </p>
                <p>
                  Well-behaved pets are welcome. Please indicate that your booking is pet-friendly and provide a description of your pet (breed, size, and whether they will be in a crate or carrier) when booking.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 7. Passenger Responsibilities */}
          <Card className="bg-card border-border">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-amber-400 mb-4">7. Passenger Responsibilities</h2>
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <p>
                  Passengers are expected to behave in a respectful and lawful manner at all times during the transfer. The driver reserves the right to refuse or terminate a journey if a passenger's behaviour is deemed unsafe, threatening, or damaging to the vehicle.
                </p>
                <p>
                  Passengers are responsible for any damage to the vehicle caused by their actions, including but not limited to soiling, staining, or physical damage. A cleaning or repair fee may be charged at the operator's discretion.
                </p>
                <p>
                  Seatbelts must be worn by all passengers at all times in accordance with Queensland road safety laws. Children must be secured in the appropriate child restraint as required by law.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 8. Liability */}
          <Card className="bg-card border-border">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-amber-400 mb-4">8. Limitation of Liability</h2>
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <p>
                  All Ways Transfers will make every reasonable effort to ensure timely and safe transfers. However, we accept no liability for delays caused by traffic, road conditions, weather, accidents, or other circumstances beyond our control.
                </p>
                <p>
                  We are not liable for any consequential losses arising from delays, including but not limited to missed flights, appointments, or events. We recommend allowing adequate buffer time for airport transfers and time-sensitive journeys.
                </p>
                <p>
                  Personal belongings left in the vehicle are the responsibility of the passenger. While we will make reasonable efforts to return lost items, we accept no liability for loss or damage to personal property.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 9. Privacy */}
          <Card className="bg-card border-border">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-amber-400 mb-4">9. Privacy & Data</h2>
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <p>
                  We collect personal information (name, email, phone number, pickup and drop-off addresses) solely for the purpose of providing our transfer service. Your information will not be shared with third parties except as required to fulfil your booking (e.g., payment processing via Stripe).
                </p>
                <p>
                  Payment card details are processed securely by Stripe and are never stored on our servers. We retain booking records for operational and legal purposes in accordance with Australian privacy legislation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 10. Changes to Terms */}
          <Card className="bg-card border-border">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-amber-400 mb-4">10. Changes to These Terms</h2>
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <p>
                  All Ways Transfers reserves the right to update or modify these Terms and Conditions at any time without prior notice. The most current version will always be available on this page. By continuing to use our service after changes are published, you agree to be bound by the updated terms.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-card border-amber-900/30">
            <CardContent className="p-6 md:p-8 text-center">
              <h2 className="text-xl font-bold mb-2">Questions About These Terms?</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions or concerns about these Terms and Conditions, please don't hesitate to contact us.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/contact")} className="border-amber-600/30 hover:bg-amber-600/10 text-amber-400">
                  Contact Us
                </Button>
                <Button onClick={() => navigate("/book")} className="bg-amber-600 hover:bg-amber-700 text-white">
                  Book Now
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/80 border-t border-gray-800 py-8">
        <div className="container text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} All Ways Transfers. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
