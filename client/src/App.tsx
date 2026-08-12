import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
// Home is kept eager so the landing page paints without a loading flash.
import Home from "./pages/Home";

// All other routes are code-split so the initial bundle stays small.
// The admin dashboard and its sub-pages are only loaded when an admin visits them.
const BookingForm = lazy(() => import("./pages/BookingForm"));
const BookingConfirmation = lazy(() => import("./pages/BookingConfirmation"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminBookingDetail = lazy(() => import("./pages/AdminBookingDetail"));
const AdminCreateQuote = lazy(() => import("./pages/AdminCreateQuote"));
const AdminPricing = lazy(() => import("./pages/AdminPricing"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const Contact = lazy(() => import("./pages/Contact"));
const AdminEnquiries = lazy(() => import("./pages/AdminEnquiries"));
const AdminCalendar = lazy(() => import("./pages/AdminCalendar"));
const AdminReviews = lazy(() => import("./pages/AdminReviews"));
const Terms = lazy(() => import("./pages/Terms"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Receipt = lazy(() => import("./pages/Receipt"));
const AdminLandmarks = lazy(() => import("./pages/AdminLandmarks"));
const AdminEmailLogs = lazy(() => import("./pages/AdminEmailLogs"));
const AdminBankDetails = lazy(() => import("./pages/AdminBankDetails"));
const AdminInvoiceSettings = lazy(() => import("./pages/AdminInvoiceSettings"));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/" component={Home} />
        <Route path="/book" component={BookingForm} />
        <Route path="/confirmation/:ref" component={BookingConfirmation} />
        <Route path="/my-bookings" component={MyBookings} />
        <Route path="/contact" component={Contact} />
        <Route path="/terms" component={Terms} />
        <Route path="/services/:serviceType" component={ServiceDetail} />
        <Route path="/booking/:ref" component={BookingConfirmation} />
        <Route path="/receipt/:ref" component={Receipt} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/booking/:id" component={AdminBookingDetail} />
        <Route path="/admin/create-quote" component={AdminCreateQuote} />
        <Route path="/admin/pricing" component={AdminPricing} />
        <Route path="/admin/enquiries" component={AdminEnquiries} />
        <Route path="/admin/calendar" component={AdminCalendar} />
        <Route path="/admin/reviews" component={AdminReviews} />
        <Route path="/admin/landmarks" component={AdminLandmarks} />
        <Route path="/admin/email-logs" component={AdminEmailLogs} />
        <Route path="/admin/bank-details" component={AdminBankDetails} />
        <Route path="/admin/invoice-settings" component={AdminInvoiceSettings} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
