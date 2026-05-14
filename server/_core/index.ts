import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./auth-routes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { constructWebhookEvent } from "../stripe";
import { getBookingById, getBookingByStripeSession, updateBookingPaymentStatus, convertQuoteToBooking, getBookingByReference, getAppSetting } from "../db";
import { sendPaymentReceiptEmail, sendBookingConfirmationEmail, sendAdminNewBookingNotification } from "../email";
import { generateInvoicePDF } from "../invoice";
import { initCronJobs } from "../cron";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Stripe webhook must be registered BEFORE express.json() for raw body access
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;
    try {
      const event = constructWebhookEvent(req.body, signature);

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as any;
          const bookingId = session.metadata?.booking_id;
          const bookingReference = session.metadata?.booking_reference;
          const isQuotePayment = session.metadata?.is_quote_payment === "true";
          const paymentStatus = session.payment_status;

          if (bookingId && paymentStatus === "paid") {
            // If this is a quote payment from email, auto-convert quote to booking first
            if (isQuotePayment && bookingReference) {
              try {
                const existingBooking = await getBookingById(parseInt(bookingId));
                if (existingBooking && (existingBooking.status === "quote" || existingBooking.status === "expired")) {
                  await convertQuoteToBooking(bookingReference, "stripe_prepay");
                  console.log(`[Webhook] Auto-converted quote ${bookingReference} to booking via Stripe payment`);

                  // Send booking confirmation email to client
                  const updatedBooking = await getBookingById(parseInt(bookingId));
                  if (updatedBooking) {
                    try {
                      // Generate invoice PDF for attachment
                      let webhookInvoicePdf: Buffer | null = null;
                      try {
                        const [footerMsg, abnVal] = await Promise.all([
                          getAppSetting("invoice_footer_message"),
                          getAppSetting("invoice_abn"),
                        ]);
                        webhookInvoicePdf = await generateInvoicePDF(updatedBooking, { footerMessage: footerMsg, abn: abnVal });
                      } catch (pdfErr) {
                        console.warn(`[Webhook] Failed to generate invoice PDF:`, pdfErr);
                      }

                      await sendBookingConfirmationEmail({
                        referenceNumber: updatedBooking.referenceNumber,
                        clientName: updatedBooking.clientName,
                        clientEmail: updatedBooking.clientEmail,
                        serviceType: updatedBooking.serviceType,
                        pickupAddress: updatedBooking.pickupAddress,
                        dropoffAddress: updatedBooking.dropoffAddress,
                        pickupDate: updatedBooking.pickupDate,
                        passengerCount: updatedBooking.passengerCount,
                        vehicleName: updatedBooking.vehicleName,
                        totalPrice: updatedBooking.totalPrice ?? "0",
                        paymentMethod: "stripe_prepay",
                        isPetFriendly: updatedBooking.isPetFriendly === 1,
                        numberOfPets: updatedBooking.numberOfPets,
                        petDescription: updatedBooking.petDescription,
                        publicHolidayName: updatedBooking.publicHolidayName,
                        publicHolidaySurcharge: updatedBooking.publicHolidaySurcharge,
                        routePreference: updatedBooking.routePreference ?? undefined,
                        invoicePdf: webhookInvoicePdf,
                      });
                      // Notify admin of new booking from quote
                      await sendAdminNewBookingNotification({
                        referenceNumber: updatedBooking.referenceNumber,
                        clientName: updatedBooking.clientName,
                        clientEmail: updatedBooking.clientEmail,
                        clientPhone: updatedBooking.clientPhone ?? "",
                        serviceType: updatedBooking.serviceType,
                        pickupAddress: updatedBooking.pickupAddress,
                        dropoffAddress: updatedBooking.dropoffAddress,
                        pickupDate: updatedBooking.pickupDate,
                        passengerCount: updatedBooking.passengerCount,
                        vehicleName: updatedBooking.vehicleName,
                        totalPrice: updatedBooking.totalPrice ?? "0",
                        paymentMethod: "stripe_prepay",
                      });
                    } catch (emailErr) {
                      console.warn(`[Webhook] Failed to send confirmation emails for quote conversion ${bookingReference}:`, emailErr);
                    }
                  }
                }
              } catch (convErr) {
                console.error(`[Webhook] Failed to auto-convert quote ${bookingReference}:`, convErr);
              }
            }

            await updateBookingPaymentStatus(parseInt(bookingId), "paid");
            console.log(`[Webhook] Payment completed for booking ${bookingId}`);

            // Send payment receipt email
            try {
              const booking = await getBookingById(parseInt(bookingId));
              if (booking) {
                // Generate invoice PDF for receipt attachment
                let receiptPdf: Buffer | null = null;
                try {
                  const [footerMsg, abnVal] = await Promise.all([
                    getAppSetting("invoice_footer_message"),
                    getAppSetting("invoice_abn"),
                  ]);
                  receiptPdf = await generateInvoicePDF(booking, { footerMessage: footerMsg, abn: abnVal });
                } catch (pdfErr) {
                  console.warn(`[Webhook] Failed to generate invoice PDF for receipt:`, pdfErr);
                }

                await sendPaymentReceiptEmail({
                  referenceNumber: booking.referenceNumber,
                  clientName: booking.clientName,
                  clientEmail: booking.clientEmail,
                  serviceType: booking.serviceType,
                  pickupAddress: booking.pickupAddress,
                  dropoffAddress: booking.dropoffAddress,
                  pickupDate: booking.pickupDate,
                  passengerCount: booking.passengerCount,
                  vehicleName: booking.vehicleName,
                  totalPrice: booking.totalPrice ?? "0",
                  paymentMethod: booking.paymentMethod ?? "stripe_prepay",
                  isPetFriendly: booking.isPetFriendly === 1,
                  numberOfPets: booking.numberOfPets,
                  petDescription: booking.petDescription,
                  publicHolidayName: booking.publicHolidayName,
                  publicHolidaySurcharge: booking.publicHolidaySurcharge,
                  routePreference: booking.routePreference ?? undefined,
                  invoicePdf: receiptPdf,
                });
              }
            } catch (emailErr) {
              console.warn(`[Webhook] Failed to send payment receipt email for booking ${bookingId}:`, emailErr);
            }
          }
          break;
        }
        case "checkout.session.expired": {
          const session = event.data.object as any;
          const bookingId = session.metadata?.booking_id;
          if (bookingId) {
            console.log(`[Webhook] Checkout session expired for booking ${bookingId}`);
          }
          break;
        }
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as any;
          const failureMessage = paymentIntent.last_payment_error?.message ?? "Unknown error";
          console.log(`[Webhook] Payment failed: ${failureMessage}`);
          break;
        }
        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[Webhook] Error:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Health check endpoint for diagnostics
  app.get("/api/health", async (req, res) => {
    const { getDb } = await import("../db");
    try {
      const db = await getDb();
      if (!db) {
        return res.json({ status: "error", message: "Database not initialized", dbUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET' });
      }
      const { sql } = await import("drizzle-orm");
      const result = await db.execute(sql`SELECT 1 as ok`);
      return res.json({ status: "ok", db: "connected" });
    } catch (err: any) {
      return res.json({ status: "error", message: err.message, code: err.code });
    }
  });

  // Standalone auth routes (login, register)
  registerAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    initCronJobs();
  });
}

startServer().catch(console.error);
