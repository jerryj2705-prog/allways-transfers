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
import { getBookingById, getBookingByStripeSession, updateBookingPaymentStatus } from "../db";
import { sendPaymentReceiptEmail } from "../email";

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
          const paymentStatus = session.payment_status;
          if (bookingId && paymentStatus === "paid") {
            await updateBookingPaymentStatus(parseInt(bookingId), "paid");
            console.log(`[Webhook] Payment completed for booking ${bookingId}`);

            // Send payment receipt email
            try {
              const booking = await getBookingById(parseInt(bookingId));
              if (booking) {
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
  });
}

startServer().catch(console.error);
