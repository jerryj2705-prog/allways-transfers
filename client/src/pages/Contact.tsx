import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, ArrowLeft, HelpCircle } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

export default function Contact() {
  const [, navigate] = useLocation();

  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const submitEnquiry = trpc.enquiries.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Thank you for your message. We'll get back to you shortly.");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send enquiry. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    submitEnquiry.mutate({ name, email, phone: phone || undefined, subject, message });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-amber-900/20">
        <div className="container flex items-center justify-between h-16">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={LOGO_IMG} alt="All Ways Transfers" className="h-10 w-auto" />
          </button>
          <nav className="flex items-center gap-6">
            <button onClick={() => navigate("/")} className="text-sm text-gray-300 hover:text-amber-400 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
            <Button onClick={() => navigate("/book")} className="bg-amber-600 hover:bg-amber-700 text-white">
              Book Now
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-black via-gray-950 to-background">
        <div className="container text-center">
          <p className="text-amber-400 tracking-widest text-sm font-medium mb-3">GET IN TOUCH</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Contact <span className="text-amber-400">Us</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Have a question about our services or need a custom quote? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container max-w-6xl">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Contact Info Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                <p className="text-muted-foreground mb-8">
                  Reach out to us through any of the channels below, or use the enquiry form and we'll respond within 24 hours.
                </p>
              </div>

              <Card className="bg-card border-border">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-600/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <a href="tel:+61400000000" className="text-muted-foreground hover:text-amber-400 transition-colors">
                      0400 000 000
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-600/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a href="mailto:info@allwaystransfers.com.au" className="text-muted-foreground hover:text-amber-400 transition-colors">
                      info@allwaystransfers.com.au
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-600/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Service Area</h3>
                    <p className="text-muted-foreground">
                      Sunshine Coast, Brisbane &amp; South East Queensland
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-600/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Availability</h3>
                    <p className="text-muted-foreground">
                      24/7 prebooked transfers<br />
                      <span className="text-xs text-gray-500">Response to enquiries within 24 hours</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enquiry Form */}
            <div className="lg:col-span-3">
              {submitted ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-600/10 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Enquiry Sent Successfully</h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Thank you for reaching out. We've received your enquiry and will get back to you within 24 hours.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={() => { setSubmitted(false); setName(""); setEmail(""); setPhone(""); setSubject(""); setMessage(""); }}>
                        Send Another Enquiry
                      </Button>
                      <Button onClick={() => navigate("/")} className="bg-amber-600 hover:bg-amber-700 text-white">
                        Back to Home
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-card border-border">
                  <CardContent className="p-6 md:p-8">
                    <h2 className="text-2xl font-bold mb-2">Send Us an Enquiry</h2>
                    <p className="text-muted-foreground mb-6">
                      Fill out the form below and we'll respond as soon as possible. Fields marked with <span className="text-red-400">*</span> are required.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Full Name <span className="text-red-400">*</span>
                          </label>
                          <Input
                            placeholder="Your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Email Address <span className="text-red-400">*</span>
                          </label>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Phone Number
                          </label>
                          <Input
                            type="tel"
                            placeholder="04XX XXX XXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Subject <span className="text-red-400">*</span>
                          </label>
                          <Input
                            placeholder="What is your enquiry about?"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Message <span className="text-red-400">*</span>
                        </label>
                        <Textarea
                          placeholder="Please provide details about your enquiry, including any specific dates, destinations, or requirements..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={6}
                          required
                          className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">Minimum 10 characters</p>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 text-base"
                        disabled={submitEnquiry.isPending}
                      >
                        {submitEnquiry.isPending ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Send className="w-4 h-4" />
                            Send Enquiry
                          </span>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gradient-to-b from-background to-gray-950">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-600/10 border border-amber-600/20 rounded-full px-4 py-1.5 mb-4">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">FAQ</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Frequently Asked <span className="text-amber-400">Questions</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about our chauffeur transfer service.
            </p>
          </div>

          {/* Services */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-amber-400 mb-3 tracking-wide uppercase text-sm">Our Services</h3>
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="px-5">
                  <AccordionItem value="services-1" className="border-gray-800">
                    <AccordionTrigger className="text-base">What types of transfer services do you offer?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      We offer four main services: <strong className="text-foreground">Airport Transfers</strong> for reliable pickup and drop-off to and from airports, <strong className="text-foreground">Hourly Hire</strong> for flexible chauffeur service charged by the hour, <strong className="text-foreground">Point to Point</strong> for direct transfers between any two locations, and <strong className="text-foreground">Special Events</strong> for weddings, corporate events, funerals, and other special occasions.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="services-2" className="border-gray-800">
                    <AccordionTrigger className="text-base">Are you available 24/7?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Yes, we operate 24/7 for prebooked transfers. All bookings must be made in advance through our website. Please note that pickups between 7:00 PM and 7:00 AM attract an out-of-hours surcharge, which is clearly displayed during the booking process.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="services-3" className="border-gray-800">
                    <AccordionTrigger className="text-base">What is the minimum hire for Hourly Hire?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Hourly Hire has a minimum booking duration which is displayed on the service card and during the booking process. This minimum is set by the operator and may vary. You'll see the exact minimum and hourly rate when selecting the Hourly Hire service.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Pricing & Payment */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-amber-400 mb-3 tracking-wide uppercase text-sm">Pricing & Payment</h3>
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="px-5">
                  <AccordionItem value="pricing-1" className="border-gray-800">
                    <AccordionTrigger className="text-base">How is the price calculated?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Our prices are fixed and transparent. The total is calculated from a base service price plus any applicable surcharges. These may include a distance surcharge (calculated in 50 km blocks), an out-of-hours surcharge for pickups between 7:00 PM and 7:00 AM, an out-of-area surcharge for transfers outside the Sunshine Coast and Noosa region, and a fuel levy if applicable. The full price breakdown is shown before you confirm your booking — no hidden fees.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="pricing-2" className="border-gray-800">
                    <AccordionTrigger className="text-base">What payment methods do you accept?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      We offer three payment options: <strong className="text-foreground">Pre-pay by Credit Card</strong> — pay securely online via Stripe when you book, <strong className="text-foreground">Pay Driver by Card</strong> — pay the driver directly by credit card on the day (a 2% card processing surcharge applies), or <strong className="text-foreground">Pay Driver by Cash</strong> — pay the driver in cash on the day. Please have the correct amount ready, as the driver is not required to carry change.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="pricing-3" className="border-gray-800">
                    <AccordionTrigger className="text-base">Are there any hidden fees or surcharges?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      No. All surcharges are calculated and displayed transparently during the booking process before you confirm. You'll see a complete price breakdown including the base fare, distance surcharge, and any applicable out-of-hours or out-of-area surcharges. The price you see at checkout is the price you pay.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Areas of Operation */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-amber-400 mb-3 tracking-wide uppercase text-sm">Areas of Operation</h3>
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="px-5">
                  <AccordionItem value="area-1" className="border-gray-800">
                    <AccordionTrigger className="text-base">Where do you operate?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Our primary service area covers the <strong className="text-foreground">Sunshine Coast</strong> and <strong className="text-foreground">Noosa</strong> regions. We also service a wider area across South East Queensland including Brisbane, Gold Coast, Moreton Bay, Logan, Ipswich, Scenic Rim, Redland, Somerset, Gympie, and Fraser Coast. Transfers to and from these extended areas may attract an out-of-area surcharge.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="area-2" className="border-gray-800">
                    <AccordionTrigger className="text-base">Which airports do you service?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      We provide transfers to and from all major airports in South East Queensland, including Brisbane Airport (BNE), Sunshine Coast Airport (MCY), and Gold Coast Airport (OOL). Simply enter your airport terminal as the pickup or drop-off address when booking.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="area-3" className="border-gray-800">
                    <AccordionTrigger className="text-base">Can I book a transfer outside your listed service area?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      For transfers outside our listed service area, please contact us directly via the enquiry form above or call us on 0466 544 068. We'll do our best to accommodate your request or suggest an alternative arrangement.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Cancellation & Modifications */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-amber-400 mb-3 tracking-wide uppercase text-sm">Cancellations & Modifications</h3>
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="px-5">
                  <AccordionItem value="cancel-1" className="border-gray-800">
                    <AccordionTrigger className="text-base">What is your cancellation policy?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Our cancellation policy has three tiers based on how far in advance you cancel: <strong className="text-foreground">More than 24 hours before pickup</strong> — free cancellation, no charge. <strong className="text-foreground">Less than 24 hours but more than 4 hours before pickup</strong> — a late cancellation fee applies (a percentage of the booking total, displayed at the time of cancellation). <strong className="text-foreground">Less than 4 hours before pickup</strong> — no refund is available. You can cancel directly from your My Bookings page.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="cancel-2" className="border-gray-800">
                    <AccordionTrigger className="text-base">Can I modify my booking after it's been submitted?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Yes. You can modify the pickup date, time, address, and passenger count for pending or confirmed bookings directly from your <strong className="text-foreground">My Bookings</strong> page. Simply log in, find your booking, and click the modify button. The admin will be notified of any changes. Completed or cancelled bookings cannot be modified.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="cancel-3" className="border-gray-800">
                    <AccordionTrigger className="text-base">Will I receive confirmation of my cancellation?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Yes. When you cancel a booking, you'll receive a cancellation confirmation email that includes your booking reference, the cancellation policy tier that was applied, any applicable charges, and a link to your My Bookings page where you can view all your bookings including cancelled ones.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle & Extras */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-amber-400 mb-3 tracking-wide uppercase text-sm">Vehicle & Extras</h3>
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="px-5">
                  <AccordionItem value="vehicle-1" className="border-gray-800">
                    <AccordionTrigger className="text-base">How many passengers can you accommodate?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Our luxury SUV accommodates up to <strong className="text-foreground">5 passengers with standard check-in luggage</strong>, or up to <strong className="text-foreground">7 passengers with limited luggage</strong>. For larger groups, a support van can be added for additional luggage and freight. If you need transport for more than 7 passengers, please contact us and we'll arrange additional vehicles.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="vehicle-2" className="border-gray-800">
                    <AccordionTrigger className="text-base">Do you provide child seats?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Yes. We provide <strong className="text-foreground">rear-facing</strong>, <strong className="text-foreground">forward-facing</strong>, and <strong className="text-foreground">booster</strong> child seats at no extra charge. You can select the type and quantity of child seats you need during the booking process (up to 2 of each type). All child seats comply with Australian safety standards.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="vehicle-3" className="border-gray-800">
                    <AccordionTrigger className="text-base">Are you pet-friendly?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Yes, we welcome well-behaved pets. When booking, simply tick the pet-friendly option and provide a brief description of your pet (breed, size, and whether they'll be in a crate or carrier). This helps us prepare the vehicle appropriately for your journey.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Booking Management */}
          <div>
            <h3 className="text-lg font-semibold text-amber-400 mb-3 tracking-wide uppercase text-sm">Managing Your Booking</h3>
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="px-5">
                  <AccordionItem value="manage-1" className="border-gray-800">
                    <AccordionTrigger className="text-base">How do I view or manage my bookings?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Log in to your account and visit the <strong className="text-foreground">My Bookings</strong> page (accessible from the navigation menu). There you can view all your upcoming and past bookings, see their current status, modify booking details, or cancel if needed. You'll also receive a booking confirmation email with a direct link to your bookings.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="manage-2" className="border-gray-800">
                    <AccordionTrigger className="text-base">I didn't receive my confirmation email. What should I do?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      First, check your spam or junk folder. If you still can't find it, log in to your account and visit the My Bookings page — your booking will be listed there with all the details. You can also look up your booking using the reference number on the confirmation page. If you need further assistance, contact us via the enquiry form above or call 0466 544 068.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="manage-3" className="border-gray-800">
                    <AccordionTrigger className="text-base">What does my booking reference number look like?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Your booking reference is a unique code starting with <strong className="text-foreground">AWT-</strong> followed by a combination of letters and numbers (e.g., AWT-A1B2C3). You'll see it on the confirmation page after booking, in your confirmation email, and on your My Bookings page. Keep this reference handy for any communication with us.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Still have questions? */}
          <div className="text-center mt-12 p-8 bg-card border border-border rounded-xl">
            <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for? Send us an enquiry using the form above, or get in touch directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="tel:0466544068" className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors font-medium">
                <Phone className="w-4 h-4" /> 0466 544 068
              </a>
              <span className="hidden sm:inline text-gray-600">|</span>
              <a href="mailto:bookings@allwaystransfers.com.au" className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors font-medium">
                <Mail className="w-4 h-4" /> bookings@allwaystransfers.com.au
              </a>
            </div>
          </div>
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
