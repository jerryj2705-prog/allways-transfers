import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import BookingForm from "./pages/BookingForm";
import BookingConfirmation from "./pages/BookingConfirmation";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBookingDetail from "./pages/AdminBookingDetail";
import AdminPricing from "./pages/AdminPricing";
import MyBookings from "./pages/MyBookings";
import Contact from "./pages/Contact";
import AdminEnquiries from "./pages/AdminEnquiries";
import AdminCalendar from "./pages/AdminCalendar";
import AdminReviews from "./pages/AdminReviews";
import Terms from "./pages/Terms";
import ServiceDetail from "./pages/ServiceDetail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/book" component={BookingForm} />
      <Route path="/confirmation/:ref" component={BookingConfirmation} />
      <Route path="/my-bookings" component={MyBookings} />
      <Route path="/contact" component={Contact} />
      <Route path="/terms" component={Terms} />
      <Route path="/services/:serviceType" component={ServiceDetail} />
      <Route path="/booking/:ref" component={BookingConfirmation} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/booking/:id" component={AdminBookingDetail} />
      <Route path="/admin/pricing" component={AdminPricing} />
      <Route path="/admin/enquiries" component={AdminEnquiries} />
      <Route path="/admin/calendar" component={AdminCalendar} />
      <Route path="/admin/reviews" component={AdminReviews} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
