import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, ArrowLeft } from "lucide-react";

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

      {/* Footer */}
      <footer className="bg-black/80 border-t border-gray-800 py-8">
        <div className="container text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} All Ways Transfers. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
