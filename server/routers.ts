import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getActiveVehicles,
  getVehicleById,
  createBooking,
  getBookingByReference,
  getBookingById,
  listBookings,
  updateBookingStatus,
  updateBookingStripeSession,
  getBookingStats,
} from "./db";
import { createCheckoutSession } from "./stripe";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  vehicles: router({
    list: publicProcedure.query(async () => {
      return getActiveVehicles();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getVehicleById(input.id);
      }),
  }),

  bookings: router({
    create: publicProcedure
      .input(
        z.object({
          clientName: z.string().min(1, "Name is required"),
          clientEmail: z.string().email("Valid email is required"),
          clientPhone: z.string().min(1, "Phone is required"),
          serviceType: z.enum(["airport_transfer", "hourly_hire", "point_to_point", "special_events"]),
          pickupAddress: z.string().min(1, "Pickup address is required"),
          dropoffAddress: z.string().optional(),
          pickupDate: z.number().min(1, "Pickup date is required"),
          passengerCount: z.number().min(1).max(7),
          vehicleId: z.number(),
          vehicleName: z.string(),
          needsSupportVan: z.boolean().default(false),
          supportVanPrice: z.number().default(0),
          estimatedDistance: z.number().optional(),
          estimatedDuration: z.number().optional(),
          basePrice: z.number(),
          totalPrice: z.number(),
          specialRequests: z.string().optional(),
          termsAccepted: z.boolean(),
          paymentMethod: z.enum(["stripe_prepay", "square_postpay", "cash_postpay"]),
          origin: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        if (!input.termsAccepted) {
          throw new Error("You must accept the terms and conditions");
        }

        const vehicle = await getVehicleById(input.vehicleId);
        if (!vehicle) {
          throw new Error("Selected vehicle not found");
        }

        const booking = await createBooking({
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          clientPhone: input.clientPhone,
          serviceType: input.serviceType,
          pickupAddress: input.pickupAddress,
          dropoffAddress: input.dropoffAddress ?? null,
          pickupDate: input.pickupDate,
          passengerCount: input.passengerCount,
          vehicleId: input.vehicleId,
          vehicleName: input.vehicleName,
          needsSupportVan: input.needsSupportVan ? 1 : 0,
          supportVanPrice: input.supportVanPrice.toFixed(2),
          estimatedDistance: input.estimatedDistance?.toFixed(2) ?? null,
          estimatedDuration: input.estimatedDuration ?? null,
          basePrice: input.basePrice.toFixed(2),
          totalPrice: input.totalPrice.toFixed(2),
          paymentMethod: input.paymentMethod,
          paymentStatus: "unpaid",
          specialRequests: input.specialRequests ?? null,
          adminNotes: null,
          termsAccepted: 1,
        });

        // Notify owner about new booking
        try {
          await notifyOwner({
            title: `New Booking: ${booking.referenceNumber}`,
            content: `New booking from ${input.clientName}\nService: ${input.serviceType.replace(/_/g, " ")}\nPickup: ${input.pickupAddress}\nDate: ${new Date(input.pickupDate).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })}\nPassengers: ${input.passengerCount}\nTotal: $${input.totalPrice.toFixed(2)}${input.needsSupportVan ? "\n+ Support Van required" : ""}`,
          });
        } catch (e) {
          console.warn("Failed to send owner notification:", e);
        }

        // If Stripe pre-pay, create checkout session
        let checkoutUrl: string | null = null;
        if (input.paymentMethod === "stripe_prepay" && input.origin) {
          try {
            const serviceLabel = input.serviceType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
            checkoutUrl = await createCheckoutSession({
              bookingReference: booking.referenceNumber,
              bookingId: booking.id,
              amount: input.totalPrice,
              customerEmail: input.clientEmail,
              customerName: input.clientName,
              serviceDescription: serviceLabel,
              origin: input.origin,
            });
            await updateBookingStripeSession(booking.id, checkoutUrl.split('/').pop()?.split('?')[0] ?? "");
          } catch (e) {
            console.warn("Failed to create Stripe checkout session:", e);
          }
        }

        return { ...booking, checkoutUrl };
      }),

    getByReference: publicProcedure
      .input(z.object({ referenceNumber: z.string() }))
      .query(async ({ input }) => {
        return getBookingByReference(input.referenceNumber);
      }),

    // Admin routes
    list: adminProcedure
      .input(
        z.object({
          status: z.string().optional(),
          search: z.string().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return listBookings(input);
      }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getBookingById(input.id);
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
          adminNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return updateBookingStatus(input.id, input.status, input.adminNotes);
      }),

    stats: adminProcedure.query(async () => {
      return getBookingStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;
