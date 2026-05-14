import { COOKIE_NAME, SESSION_SHORT_MS, SESSION_LONG_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { hashPassword, verifyPassword, createSessionToken } from "./_core/standalone-auth";
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
  getAllPricingSettings,
  updatePricingSetting,
  calculatePrice,
  getBookingsByEmail,
  updateBookingDetails,
  createEnquiry,
  listEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  getEnquiryStats,
  updateBookingPaymentStatus,
  getBookingsByDateRange,
  getAllPublicHolidays,
  getActivePublicHolidays,
  createPublicHoliday,
  updatePublicHoliday,
  deletePublicHoliday,
  createReview,
  getApprovedReviews,
  getReviewStats,
  listReviews,
  getReviewById,
  updateReviewStatus,
  deleteReview,
  getReviewByBookingId,
  getCachedGoogleReviews,
  getGoogleReviewsCacheAge,
  clearGoogleReviewsCache,
  insertGoogleReviews,
  getAppSetting,
  setAppSetting,
  getUserByEmail,
  createUserWithPassword,
  getUserByGoogleId,
  createUserWithGoogle,
  linkGoogleAccount,
  createPasswordResetToken,
  getPasswordResetToken,
  markPasswordResetTokenUsed,
  updateUserPassword,
  invalidateUserResetTokens,
  getUserById,
  getActiveLandmarks,
  getAllLandmarks,
  getLandmarkById,
  createLandmark,
  updateLandmark,
  toggleLandmarkActive,
  deleteLandmark,
  getLandmarkStats,
  deleteBooking,
  markTollsAsReviewed,
  createQuote,
  convertQuoteToBooking,
  cancelQuote,
  adminConvertQuoteToBooking,
  listEmailLogs,
  getEmailLogStats,
} from "./db";
import { makeRequest, type PlaceDetailsResult } from "./_core/map";
import { createCheckoutSession } from "./stripe";
import { notifyOwner } from "./_core/notification";
import { sendBookingConfirmationEmail, sendCancellationConfirmationEmail, sendAdminNewBookingNotification, sendAdminCancellationNotification, sendPasswordResetEmail, sendQuoteEmail, sendQuoteReminderEmail } from "./email";
import crypto from "crypto";
import { lookupSuburb, estimateDistance, isOutOfArea, getAllSuburbNames, getAllLocationsWithType, calculateDistance, classifyLGA } from "@shared/suburbs";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({
        email: z.string().email("Valid email is required"),
        password: z.string().min(1, "Password is required"),
        rememberMe: z.boolean().optional().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }
        const valid = await verifyPassword(input.password, user.passwordHash);
        if (!valid) {
          throw new Error("Invalid email or password");
        }
        const sessionDuration = input.rememberMe ? SESSION_LONG_MS : SESSION_SHORT_MS;
        const token = await createSessionToken({
          id: user.id,
          email: user.email!,
          role: user.role,
        }, { expiresInMs: sessionDuration });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: sessionDuration });
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),
    register: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Valid email is required"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }))
      .mutation(async ({ input, ctx }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new Error("An account with this email already exists");
        }
        const passwordHash = await hashPassword(input.password);
        const user = await createUserWithPassword({
          name: input.name,
          email: input.email,
          passwordHash,
        });
        if (!user) {
          throw new Error("Failed to create account");
        }
        const token = await createSessionToken({
          id: user.id,
          email: user.email!,
          role: user.role,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_SHORT_MS });
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),
    googleLogin: publicProcedure
      .input(z.object({
        credential: z.string().min(1, "Google credential is required"),
        rememberMe: z.boolean().optional().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const { ENV } = await import("./_core/env");
        const { OAuth2Client } = await import("google-auth-library");

        const clientId = ENV.googleClientId;
        if (!clientId) {
          throw new Error("Google Sign-In is not configured");
        }

        const client = new OAuth2Client(clientId);
        let ticket;
        try {
          ticket = await client.verifyIdToken({
            idToken: input.credential,
            audience: clientId,
          });
        } catch {
          throw new Error("Invalid Google credential");
        }

        const payload = ticket.getPayload();
        if (!payload || !payload.email || !payload.sub) {
          throw new Error("Invalid Google token payload");
        }

        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name || email.split("@")[0];

        // 1. Check if user exists by Google ID
        let user = await getUserByGoogleId(googleId);

        if (!user) {
          // 2. Check if user exists by email (link accounts)
          user = await getUserByEmail(email);
          if (user) {
            // Link existing email account to Google
            user = (await linkGoogleAccount(user.id, googleId)) ?? undefined;
          } else {
            // 3. Create new user with Google
            user = (await createUserWithGoogle({ name, email, googleId })) ?? undefined;
          }
        }

        if (!user) {
          throw new Error("Failed to create or find user account");
        }

        const sessionDuration = input.rememberMe ? SESSION_LONG_MS : SESSION_LONG_MS; // Google users get long sessions by default
        const token = await createSessionToken({
          id: user.id,
          email: user.email!,
          role: user.role,
        }, { expiresInMs: sessionDuration });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: sessionDuration });
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),
    forgotPassword: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email address"),
        origin: z.string().min(1, "Origin is required"),
      }))
      .mutation(async ({ input }) => {
        // Always return success to prevent email enumeration
        const user = await getUserByEmail(input.email);
        if (!user) {
          return { success: true, message: "If an account with that email exists, a password reset link has been sent." };
        }

        // Generate a secure random token
        const token = crypto.randomBytes(32).toString("hex");
        const RESET_EXPIRY_MINUTES = 30;
        const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000);

        // Invalidate any existing tokens for this user
        await invalidateUserResetTokens(user.id);

        // Store the token
        await createPasswordResetToken(user.id, token, expiresAt);

        // Build the reset URL
        const resetUrl = `${input.origin}/reset-password?token=${token}`;

        // Send the email
        await sendPasswordResetEmail({
          name: user.name || "Customer",
          email: user.email!,
          resetUrl,
          expiresInMinutes: RESET_EXPIRY_MINUTES,
        });

        return { success: true, message: "If an account with that email exists, a password reset link has been sent." };
      }),
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string().min(1, "Reset token is required"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }))
      .mutation(async ({ input }) => {
        // Look up the token
        const resetToken = await getPasswordResetToken(input.token);
        if (!resetToken) {
          throw new Error("Invalid or expired reset link. Please request a new one.");
        }

        // Check if already used
        if (resetToken.usedAt) {
          throw new Error("This reset link has already been used. Please request a new one.");
        }

        // Check if expired
        if (new Date() > resetToken.expiresAt) {
          throw new Error("This reset link has expired. Please request a new one.");
        }

        // Verify user still exists
        const user = await getUserById(resetToken.userId);
        if (!user) {
          throw new Error("User account not found.");
        }

        // Hash the new password and update
        const newHash = await hashPassword(input.password);
        await updateUserPassword(user.id, newHash);

        // Mark token as used
        await markPasswordResetTokenUsed(resetToken.id);

        // Invalidate all other reset tokens for this user
        await invalidateUserResetTokens(user.id);

        return { success: true, message: "Your password has been reset successfully. You can now sign in with your new password." };
      }),
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
          serviceType: z.enum(["airport_transfer", "hourly_hire", "point_to_point", "special_events", "freight"]),
          pickupAddress: z.string().min(1, "Pickup address is required"),
          dropoffAddress: z.string().optional(),
          pickupDate: z.number().min(1, "Pickup date is required"),
          passengerCount: z.number().min(0).max(7),
          vehicleId: z.number(),
          vehicleName: z.string(),
          needsSupportVan: z.boolean().default(false),
          supportVanPrice: z.number().default(0),
          rearFacingSeats: z.number().min(0).max(2).default(0),
          forwardFacingSeats: z.number().min(0).max(2).default(0),
          boosterSeats: z.number().min(0).max(2).default(0),
          isPetFriendly: z.boolean().default(false),
          numberOfPets: z.number().min(1).max(10).optional(),
          petDescription: z.string().optional(),
          // Freight-specific fields
          freightDescription: z.string().optional(),
          freightWeight: z.string().optional(),
          freightItemCount: z.number().min(1).max(100).optional(),
          freightSpecialHandling: z.string().optional(),
          routePreference: z.enum(["fastest", "toll_free"]).default("fastest"),
          estimatedDistance: z.number().optional(),
          estimatedDuration: z.number().optional(),
          basePrice: z.number(),
          totalPrice: z.number(),
          additionalPickupCount: z.number().min(0).max(5).default(0),
          additionalDropoffCount: z.number().min(0).max(5).default(0),
          additionalPickupAddresses: z.array(z.string()).default([]),
          additionalDropoffAddresses: z.array(z.string()).default([]),
          additionalStopsSurcharge: z.number().default(0),
          publicHolidaySurcharge: z.number().default(0),
          publicHolidayName: z.string().optional(),
          airportTollSurcharge: z.number().default(0),
          airportTollDetails: z.array(z.object({ airport: z.string(), direction: z.string(), amount: z.number() })).default([]),
          roadTollSurcharge: z.number().default(0),
          roadTollDetails: z.array(z.object({ road: z.string(), amount: z.number() })).default([]),
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

        // Enforce minimum hours for hourly hire
        if (input.serviceType === "hourly_hire") {
          const settings = await getAllPricingSettings();
          const minHoursSetting = settings.find((s: any) => s.settingKey === "min_hourly_hours");
          const minHours = minHoursSetting ? parseInt(minHoursSetting.settingValue, 10) : 3;
          const bookingHours = input.estimatedDuration ? Math.round(input.estimatedDuration / 60) : 0;
          if (bookingHours < minHours) {
            throw new Error(`Hourly Hire requires a minimum of ${minHours} hours`);
          }
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
          rearFacingSeats: input.rearFacingSeats,
          forwardFacingSeats: input.forwardFacingSeats,
          boosterSeats: input.boosterSeats,
          isPetFriendly: input.isPetFriendly ? 1 : 0,
          numberOfPets: input.isPetFriendly ? (input.numberOfPets ?? 1) : null,
          petDescription: input.isPetFriendly ? (input.petDescription ?? null) : null,
          // Freight fields
          freightDescription: input.serviceType === "freight" ? (input.freightDescription ?? null) : null,
          freightWeight: input.serviceType === "freight" ? (input.freightWeight ?? null) : null,
          freightItemCount: input.serviceType === "freight" ? (input.freightItemCount ?? null) : null,
          freightSpecialHandling: input.serviceType === "freight" ? (input.freightSpecialHandling ?? null) : null,
          routePreference: input.routePreference ?? "fastest",
          estimatedDistance: input.estimatedDistance?.toFixed(2) ?? null,
          estimatedDuration: input.estimatedDuration ?? null,
          basePrice: input.basePrice.toFixed(2),
          totalPrice: input.totalPrice.toFixed(2),
          additionalPickupCount: input.additionalPickupCount,
          additionalDropoffCount: input.additionalDropoffCount,
          additionalPickupAddresses: input.additionalPickupAddresses.length > 0 ? JSON.stringify(input.additionalPickupAddresses) : null,
          additionalDropoffAddresses: input.additionalDropoffAddresses.length > 0 ? JSON.stringify(input.additionalDropoffAddresses) : null,
          additionalStopsSurcharge: input.additionalStopsSurcharge.toFixed(2),
          publicHolidaySurcharge: input.publicHolidaySurcharge.toFixed(2),
          publicHolidayName: input.publicHolidayName ?? null,
          airportTollSurcharge: input.airportTollSurcharge.toFixed(2),
          airportTollDetails: input.airportTollDetails.length > 0 ? JSON.stringify(input.airportTollDetails) : null,
          roadTollSurcharge: input.roadTollSurcharge.toFixed(2),
          roadTollDetails: input.roadTollDetails.length > 0 ? JSON.stringify(input.roadTollDetails) : null,
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
            const { url, sessionId } = await createCheckoutSession({
              bookingReference: booking.referenceNumber,
              bookingId: booking.id,
              amount: input.totalPrice,
              customerEmail: input.clientEmail,
              customerName: input.clientName,
              serviceDescription: serviceLabel,
              origin: input.origin,
            });
            checkoutUrl = url;
            await updateBookingStripeSession(booking.id, sessionId);
          } catch (e) {
            console.warn("Failed to create Stripe checkout session:", e);
          }
        }

        // Send booking confirmation email
        if (input.origin) {
          try {
            await sendBookingConfirmationEmail({
              referenceNumber: booking.referenceNumber,
              clientName: input.clientName,
              clientEmail: input.clientEmail,
              serviceType: input.serviceType,
              pickupAddress: input.pickupAddress,
              dropoffAddress: input.dropoffAddress ?? null,
              pickupDate: input.pickupDate,
              passengerCount: input.passengerCount,
              vehicleName: input.vehicleName,
              rearFacingSeats: input.rearFacingSeats,
              forwardFacingSeats: input.forwardFacingSeats,
              boosterSeats: input.boosterSeats,
              isPetFriendly: input.isPetFriendly,
              numberOfPets: input.numberOfPets ?? null,
              petDescription: input.petDescription ?? null,
              freightDescription: input.freightDescription ?? null,
              freightWeight: input.freightWeight ?? null,
              freightItemCount: input.freightItemCount ?? null,
              freightSpecialHandling: input.freightSpecialHandling ?? null,
              routePreference: input.routePreference ?? "fastest",
              totalPrice: input.totalPrice.toFixed(2),
              paymentMethod: input.paymentMethod,
              paymentStatus: input.paymentMethod === "stripe_prepay" ? "unpaid" : "unpaid",
              specialRequests: input.specialRequests ?? null,
              additionalPickupCount: input.additionalPickupCount ?? 0,
              additionalDropoffCount: input.additionalDropoffCount ?? 0,
              additionalPickupAddresses: input.additionalPickupAddresses ?? [],
              additionalDropoffAddresses: input.additionalDropoffAddresses ?? [],
              publicHolidaySurcharge: input.publicHolidaySurcharge ?? 0,
              publicHolidayName: input.publicHolidayName ?? null,
              airportTollSurcharge: input.airportTollSurcharge ?? 0,
              airportTollDetails: input.airportTollDetails ?? [],
              roadTollSurcharge: input.roadTollSurcharge ?? 0,
              roadTollDetails: input.roadTollDetails ?? [],
              origin: input.origin,
            });
          } catch (emailError) {
            console.warn("[Booking] Failed to send confirmation email:", emailError);
          }

          // Send admin notification
          try {
            await sendAdminNewBookingNotification({
              referenceNumber: booking.referenceNumber,
              clientName: input.clientName,
              clientEmail: input.clientEmail,
              serviceType: input.serviceType,
              pickupAddress: input.pickupAddress,
              dropoffAddress: input.dropoffAddress ?? null,
              pickupDate: input.pickupDate,
              passengerCount: input.passengerCount,
              vehicleName: input.vehicleName,
              rearFacingSeats: input.rearFacingSeats,
              forwardFacingSeats: input.forwardFacingSeats,
              boosterSeats: input.boosterSeats,
              isPetFriendly: input.isPetFriendly,
              numberOfPets: input.numberOfPets ?? null,
              petDescription: input.petDescription ?? null,
              freightDescription: input.freightDescription ?? null,
              freightWeight: input.freightWeight ?? null,
              freightItemCount: input.freightItemCount ?? null,
              freightSpecialHandling: input.freightSpecialHandling ?? null,
              routePreference: input.routePreference ?? "fastest",
              totalPrice: input.totalPrice.toFixed(2),
              paymentMethod: input.paymentMethod,
              paymentStatus: input.paymentMethod === "stripe_prepay" ? "unpaid" : "unpaid",
              specialRequests: input.specialRequests ?? null,
              additionalPickupCount: input.additionalPickupCount ?? 0,
              additionalDropoffCount: input.additionalDropoffCount ?? 0,
              additionalPickupAddresses: input.additionalPickupAddresses ?? [],
              additionalDropoffAddresses: input.additionalDropoffAddresses ?? [],
              publicHolidaySurcharge: input.publicHolidaySurcharge ?? 0,
              publicHolidayName: input.publicHolidayName ?? null,
              airportTollSurcharge: input.airportTollSurcharge ?? 0,
              airportTollDetails: input.airportTollDetails ?? [],
              roadTollSurcharge: input.roadTollSurcharge ?? 0,
              roadTollDetails: input.roadTollDetails ?? [],
              origin: input.origin,
            });
          } catch (e) {
            console.warn("Failed to send admin new booking notification:", e);
          }
        }

        return { ...booking, checkoutUrl };
      }),

    createQuote: publicProcedure
      .input(
        z.object({
          clientName: z.string().min(1),
          clientEmail: z.string().email(),
          clientPhone: z.string().min(1),
          serviceType: z.enum(["airport_transfer", "hourly_hire", "point_to_point", "special_events", "freight"]),
          pickupAddress: z.string().min(1),
          dropoffAddress: z.string().optional(),
          pickupDate: z.number().min(1),
          passengerCount: z.number().min(0).max(7),
          vehicleId: z.number(),
          vehicleName: z.string(),
          needsSupportVan: z.boolean().default(false),
          supportVanPrice: z.number().default(0),
          rearFacingSeats: z.number().min(0).max(2).default(0),
          forwardFacingSeats: z.number().min(0).max(2).default(0),
          boosterSeats: z.number().min(0).max(2).default(0),
          isPetFriendly: z.boolean().default(false),
          numberOfPets: z.number().min(1).max(10).optional(),
          petDescription: z.string().optional(),
          freightDescription: z.string().optional(),
          freightWeight: z.string().optional(),
          freightItemCount: z.number().min(1).max(100).optional(),
          freightSpecialHandling: z.string().optional(),
          routePreference: z.enum(["fastest", "toll_free"]).default("fastest"),
          estimatedDistance: z.number().optional(),
          estimatedDuration: z.number().optional(),
          basePrice: z.number(),
          totalPrice: z.number(),
          additionalPickupCount: z.number().min(0).max(5).default(0),
          additionalDropoffCount: z.number().min(0).max(5).default(0),
          additionalPickupAddresses: z.array(z.string()).default([]),
          additionalDropoffAddresses: z.array(z.string()).default([]),
          additionalStopsSurcharge: z.number().default(0),
          publicHolidaySurcharge: z.number().default(0),
          publicHolidayName: z.string().optional(),
          airportTollSurcharge: z.number().default(0),
          airportTollDetails: z.array(z.object({ airport: z.string(), direction: z.string(), amount: z.number() })).default([]),
          roadTollSurcharge: z.number().default(0),
          roadTollDetails: z.array(z.object({ road: z.string(), amount: z.number() })).default([]),
          specialRequests: z.string().optional(),
          origin: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const quote = await createQuote({
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
          rearFacingSeats: input.rearFacingSeats,
          forwardFacingSeats: input.forwardFacingSeats,
          boosterSeats: input.boosterSeats,
          isPetFriendly: input.isPetFriendly ? 1 : 0,
          numberOfPets: input.isPetFriendly ? (input.numberOfPets ?? 1) : null,
          petDescription: input.isPetFriendly ? (input.petDescription ?? null) : null,
          freightDescription: input.serviceType === "freight" ? (input.freightDescription ?? null) : null,
          freightWeight: input.serviceType === "freight" ? (input.freightWeight ?? null) : null,
          freightItemCount: input.serviceType === "freight" ? (input.freightItemCount ?? null) : null,
          freightSpecialHandling: input.serviceType === "freight" ? (input.freightSpecialHandling ?? null) : null,
          routePreference: input.routePreference ?? "fastest",
          estimatedDistance: input.estimatedDistance?.toFixed(2) ?? null,
          estimatedDuration: input.estimatedDuration ?? null,
          basePrice: input.basePrice.toFixed(2),
          totalPrice: input.totalPrice.toFixed(2),
          additionalPickupCount: input.additionalPickupCount,
          additionalDropoffCount: input.additionalDropoffCount,
          additionalPickupAddresses: input.additionalPickupAddresses.length > 0 ? JSON.stringify(input.additionalPickupAddresses) : null,
          additionalDropoffAddresses: input.additionalDropoffAddresses.length > 0 ? JSON.stringify(input.additionalDropoffAddresses) : null,
          additionalStopsSurcharge: input.additionalStopsSurcharge.toFixed(2),
          publicHolidaySurcharge: input.publicHolidaySurcharge.toFixed(2),
          publicHolidayName: input.publicHolidayName ?? null,
          airportTollSurcharge: input.airportTollSurcharge.toFixed(2),
          airportTollDetails: input.airportTollDetails.length > 0 ? JSON.stringify(input.airportTollDetails) : null,
          roadTollSurcharge: input.roadTollSurcharge.toFixed(2),
          roadTollDetails: input.roadTollDetails.length > 0 ? JSON.stringify(input.roadTollDetails) : null,
          paymentMethod: "cash_postpay",
          paymentStatus: "unpaid",
          specialRequests: input.specialRequests ?? null,
          adminNotes: null,
          termsAccepted: 0,
        });

        // Send quote email to client
        if (input.origin) {
          try {
            await sendQuoteEmail({
              referenceNumber: quote.referenceNumber,
              clientName: input.clientName,
              clientEmail: input.clientEmail,
              serviceType: input.serviceType,
              pickupAddress: input.pickupAddress,
              dropoffAddress: input.dropoffAddress ?? null,
              pickupDate: input.pickupDate,
              passengerCount: input.passengerCount,
              vehicleName: input.vehicleName,
              totalPrice: input.totalPrice.toFixed(2),
              specialRequests: input.specialRequests ?? null,
              additionalPickupCount: input.additionalPickupCount ?? 0,
              additionalDropoffCount: input.additionalDropoffCount ?? 0,
              additionalPickupAddresses: input.additionalPickupAddresses ?? [],
              additionalDropoffAddresses: input.additionalDropoffAddresses ?? [],
              publicHolidaySurcharge: input.publicHolidaySurcharge ?? 0,
              publicHolidayName: input.publicHolidayName ?? null,
              airportTollSurcharge: input.airportTollSurcharge ?? 0,
              airportTollDetails: input.airportTollDetails ?? [],
              roadTollSurcharge: input.roadTollSurcharge ?? 0,
              roadTollDetails: input.roadTollDetails ?? [],
              origin: input.origin,
            });
          } catch (emailError) {
            console.warn("[Quote] Failed to send quote email:", emailError);
          }

          // Notify admin about new quote
          try {
            await notifyOwner({
              title: `New Quote: ${quote.referenceNumber}`,
              content: `Quote request from ${input.clientName}\nService: ${input.serviceType.replace(/_/g, " ")}\nPickup: ${input.pickupAddress}\nDate: ${new Date(input.pickupDate).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })}\nTotal: $${input.totalPrice.toFixed(2)}`,
            });
          } catch (e) {
            console.warn("Failed to send owner notification:", e);
          }
        }

        return { referenceNumber: quote.referenceNumber };
      }),

    convertQuote: publicProcedure
      .input(
        z.object({
          referenceNumber: z.string(),
          paymentMethod: z.enum(["stripe_prepay", "square_postpay", "cash_postpay"]),
          origin: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const booking = await convertQuoteToBooking(input.referenceNumber, input.paymentMethod);
        if (!booking) {
          throw new Error("Quote not found or already converted");
        }

        // If Stripe pre-pay, create checkout session
        let checkoutUrl: string | null = null;
        if (input.paymentMethod === "stripe_prepay" && input.origin) {
          try {
            const serviceLabel = booking.serviceType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
            const { url, sessionId } = await createCheckoutSession({
              bookingReference: booking.referenceNumber,
              bookingId: booking.id,
              amount: parseFloat(booking.totalPrice),
              customerEmail: booking.clientEmail,
              customerName: booking.clientName,
              serviceDescription: serviceLabel,
              origin: input.origin,
            });
            checkoutUrl = url;
            await updateBookingStripeSession(booking.id, sessionId);
          } catch (e) {
            console.warn("Failed to create Stripe checkout session:", e);
          }
        }

        // Send booking confirmation email
        if (input.origin) {
          try {
            await sendBookingConfirmationEmail({
              referenceNumber: booking.referenceNumber,
              clientName: booking.clientName,
              clientEmail: booking.clientEmail,
              serviceType: booking.serviceType,
              pickupAddress: booking.pickupAddress,
              dropoffAddress: booking.dropoffAddress ?? null,
              pickupDate: typeof booking.pickupDate === 'number' ? booking.pickupDate : new Date(booking.pickupDate).getTime(),
              passengerCount: booking.passengerCount,
              vehicleName: booking.vehicleName,
              rearFacingSeats: booking.rearFacingSeats ?? 0,
              forwardFacingSeats: booking.forwardFacingSeats ?? 0,
              boosterSeats: booking.boosterSeats ?? 0,
              isPetFriendly: !!booking.isPetFriendly,
              numberOfPets: booking.numberOfPets ?? null,
              petDescription: booking.petDescription ?? null,
              freightDescription: booking.freightDescription ?? null,
              freightWeight: booking.freightWeight ?? null,
              freightItemCount: booking.freightItemCount ?? null,
              freightSpecialHandling: booking.freightSpecialHandling ?? null,
              routePreference: booking.routePreference ?? "fastest",
              totalPrice: booking.totalPrice,
              paymentMethod: input.paymentMethod,
              paymentStatus: "unpaid",
              specialRequests: booking.specialRequests ?? null,
              origin: input.origin,
            });
          } catch (emailError) {
            console.warn("[Booking] Failed to send confirmation email:", emailError);
          }

          // Send admin notification
          try {
            await sendAdminNewBookingNotification({
              referenceNumber: booking.referenceNumber,
              clientName: booking.clientName,
              clientEmail: booking.clientEmail,
              serviceType: booking.serviceType,
              pickupAddress: booking.pickupAddress,
              dropoffAddress: booking.dropoffAddress ?? null,
              pickupDate: typeof booking.pickupDate === 'number' ? booking.pickupDate : new Date(booking.pickupDate).getTime(),
              passengerCount: booking.passengerCount,
              vehicleName: booking.vehicleName,
              totalPrice: booking.totalPrice,
              paymentMethod: input.paymentMethod,
              paymentStatus: "unpaid",
              specialRequests: booking.specialRequests ?? null,
              origin: input.origin,
            });
          } catch (e) {
            console.warn("Failed to send admin new booking notification:", e);
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
          paymentStatus: z.string().optional(),
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

    updatePaymentStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          paymentStatus: z.enum(["unpaid", "paid", "refunded"]),
          paymentNote: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const booking = await getBookingById(input.id);
        if (!booking) throw new Error("Booking not found");
        return updateBookingPaymentStatus(input.id, input.paymentStatus, input.paymentNote);
      }),

    stats: adminProcedure.query(async () => {
      return getBookingStats();
    }),

    calendarBookings: adminProcedure
      .input(z.object({
        startMs: z.number(),
        endMs: z.number(),
      }))
      .query(async ({ input }) => {
        return getBookingsByDateRange(input.startMs, input.endMs);
      }),

    // Admin: modify any booking's details
    adminModify: adminProcedure
      .input(z.object({
        bookingId: z.number(),
        pickupAddress: z.string().optional(),
        dropoffAddress: z.string().nullable().optional(),
        pickupDate: z.number().optional(),
        passengerCount: z.number().min(0).max(7).optional(),
        specialRequests: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new Error("Booking not found");

        // If changing pickup date, must be in the future
        if (input.pickupDate && input.pickupDate < Date.now()) {
          throw new Error("New pickup date must be in the future");
        }

        const changes: string[] = [];
        if (input.pickupAddress && input.pickupAddress !== booking.pickupAddress) {
          changes.push(`Pickup: ${booking.pickupAddress} → ${input.pickupAddress}`);
        }
        if (input.dropoffAddress !== undefined && input.dropoffAddress !== booking.dropoffAddress) {
          changes.push(`Drop-off: ${booking.dropoffAddress ?? "N/A"} → ${input.dropoffAddress ?? "N/A"}`);
        }
        if (input.pickupDate && input.pickupDate !== booking.pickupDate) {
          const oldDate = new Date(booking.pickupDate).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" });
          const newDate = new Date(input.pickupDate).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" });
          changes.push(`Date/Time: ${oldDate} → ${newDate}`);
        }
        if (input.passengerCount && input.passengerCount !== booking.passengerCount) {
          changes.push(`Passengers: ${booking.passengerCount} → ${input.passengerCount}`);
        }
        if (input.specialRequests !== undefined && input.specialRequests !== booking.specialRequests) {
          changes.push(`Special requests updated`);
        }

        if (changes.length === 0) {
          return booking;
        }

        const updated = await updateBookingDetails(input.bookingId, {
          pickupAddress: input.pickupAddress,
          dropoffAddress: input.dropoffAddress ?? undefined,
          pickupDate: input.pickupDate,
          passengerCount: input.passengerCount,
          specialRequests: input.specialRequests,
        });

        return updated;
      }),

    // Admin: delete a booking
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteBooking(input.id);
        return { success: true };
      }),

    // Authenticated user: get my bookings by email
    myBookings: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.email) {
        return [];
      }
      return getBookingsByEmail(ctx.user.email);
    }),

    // Authenticated user: modify their own upcoming booking
    modify: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        pickupAddress: z.string().optional(),
        dropoffAddress: z.string().optional(),
        pickupDate: z.number().optional(),
        passengerCount: z.number().min(0).max(7).optional(),
        specialRequests: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new Error("Booking not found");
        if (booking.clientEmail !== ctx.user?.email) throw new Error("Unauthorized");
        if (booking.status === "cancelled") throw new Error("Cannot modify a cancelled booking");
        if (booking.status === "completed") throw new Error("Cannot modify a completed booking");

        // Must be in the future
        if (booking.pickupDate < Date.now()) {
          throw new Error("Cannot modify a past booking");
        }

        // If changing pickup date, must be in the future
        if (input.pickupDate && input.pickupDate < Date.now()) {
          throw new Error("New pickup date must be in the future");
        }

        const changes: string[] = [];
        if (input.pickupAddress && input.pickupAddress !== booking.pickupAddress) {
          changes.push(`Pickup: ${booking.pickupAddress} → ${input.pickupAddress}`);
        }
        if (input.dropoffAddress && input.dropoffAddress !== booking.dropoffAddress) {
          changes.push(`Drop-off: ${booking.dropoffAddress ?? "N/A"} → ${input.dropoffAddress}`);
        }
        if (input.pickupDate && input.pickupDate !== booking.pickupDate) {
          const oldDate = new Date(booking.pickupDate).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" });
          const newDate = new Date(input.pickupDate).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" });
          changes.push(`Date/Time: ${oldDate} → ${newDate}`);
        }
        if (input.passengerCount && input.passengerCount !== booking.passengerCount) {
          changes.push(`Passengers: ${booking.passengerCount} → ${input.passengerCount}`);
        }
        if (input.specialRequests !== undefined && input.specialRequests !== booking.specialRequests) {
          changes.push(`Special requests updated`);
        }

        if (changes.length === 0) {
          return booking;
        }

        const updated = await updateBookingDetails(input.bookingId, {
          pickupAddress: input.pickupAddress,
          dropoffAddress: input.dropoffAddress,
          pickupDate: input.pickupDate,
          passengerCount: input.passengerCount,
          specialRequests: input.specialRequests,
        });

        // Notify owner about modification
        try {
          await notifyOwner({
            title: `Booking Modified: ${booking.referenceNumber}`,
            content: `Booking ${booking.referenceNumber} modified by ${booking.clientName}.\nChanges:\n${changes.join("\n")}`,
          });
        } catch (e) {
          console.warn("Failed to send modification notification:", e);
        }

        return updated;
      }),

    // Authenticated user: get cancellation policy for a booking
    cancellationPolicy: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ input, ctx }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new Error("Booking not found");
        if (booking.clientEmail !== ctx.user?.email) throw new Error("Unauthorized");

        // Fetch the configured late cancellation charge percentage
        const settings = await getAllPricingSettings();
        const chargeSetting = settings.find((s: any) => s.settingKey === "late_cancel_charge_pct");
        const chargePercent = chargeSetting ? parseFloat(chargeSetting.settingValue) : 50;

        const now = Date.now();
        const hoursUntilPickup = (booking.pickupDate - now) / (1000 * 60 * 60);

        if (hoursUntilPickup < 4) {
          return { tier: "no_refund" as const, hoursUntilPickup, chargePercent, message: "Cancellations less than 4 hours before pickup are not eligible for a refund." };
        } else if (hoursUntilPickup < 24) {
          return { tier: "partial_charge" as const, hoursUntilPickup, chargePercent, message: `Cancellations less than 24 hours before pickup will incur a ${chargePercent}% charge of the booking fee.` };
        } else {
          return { tier: "free" as const, hoursUntilPickup, chargePercent: 0, message: "Free cancellation — more than 24 hours before pickup." };
        }
      }),

    // Authenticated user: cancel their own booking
    cancel: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        reason: z.string().optional(),
        termsAccepted: z.boolean(),
        origin: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!input.termsAccepted) {
          throw new Error("You must accept the cancellation terms");
        }

        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new Error("Booking not found");
        if (booking.clientEmail !== ctx.user?.email) throw new Error("Unauthorized");
        if (booking.status === "cancelled") throw new Error("Booking is already cancelled");
        if (booking.status === "completed") throw new Error("Cannot cancel a completed booking");

        // Fetch the configured late cancellation charge percentage
        const settings = await getAllPricingSettings();
        const chargeSetting = settings.find((s: any) => s.settingKey === "late_cancel_charge_pct");
        const chargePercent = chargeSetting ? parseFloat(chargeSetting.settingValue) : 50;

        const now = Date.now();
        const hoursUntilPickup = (booking.pickupDate - now) / (1000 * 60 * 60);
        let cancellationNote = "Cancelled by client.";
        if (hoursUntilPickup < 4) {
          cancellationNote = "Cancelled by client (less than 4 hours before pickup — no refund).";
        } else if (hoursUntilPickup < 24) {
          cancellationNote = `Cancelled by client (less than 24 hours before pickup — ${chargePercent}% charge applies).`;
        } else {
          cancellationNote = "Cancelled by client (free cancellation).";
        }
        if (input.reason) {
          cancellationNote += ` Reason: ${input.reason}`;
        }

        const updated = await updateBookingStatus(input.bookingId, "cancelled", cancellationNote);

        // Notify owner
        try {
          await notifyOwner({
            title: `Booking Cancelled: ${booking.referenceNumber}`,
            content: `Booking ${booking.referenceNumber} cancelled by ${booking.clientName}.\n${cancellationNote}\nPickup was: ${new Date(booking.pickupDate).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })}`,
          });
        } catch (e) {
          console.warn("Failed to send cancellation notification:", e);
        }

        // Send cancellation confirmation email
        if (input.origin) {
          try {
            const cancellationTier = hoursUntilPickup < 4 ? "no_refund" as const : hoursUntilPickup < 24 ? "partial_charge" as const : "free" as const;
            await sendCancellationConfirmationEmail({
              referenceNumber: booking.referenceNumber,
              clientName: booking.clientName,
              clientEmail: booking.clientEmail,
              serviceType: booking.serviceType,
              pickupAddress: booking.pickupAddress,
              dropoffAddress: booking.dropoffAddress,
              pickupDate: booking.pickupDate,
              totalPrice: booking.totalPrice,
              cancellationTier,
              chargePercent,
              reason: input.reason ?? null,
              origin: input.origin,
            });
          } catch (e) {
            console.warn("Failed to send cancellation confirmation email:", e);
          }

          // Send admin cancellation notification
          try {
            const cancellationTier = hoursUntilPickup < 4 ? "no_refund" as const : hoursUntilPickup < 24 ? "partial_charge" as const : "free" as const;
            await sendAdminCancellationNotification({
              referenceNumber: booking.referenceNumber,
              clientName: booking.clientName,
              clientEmail: booking.clientEmail,
              serviceType: booking.serviceType,
              pickupAddress: booking.pickupAddress,
              dropoffAddress: booking.dropoffAddress,
              pickupDate: booking.pickupDate,
              totalPrice: booking.totalPrice,
              cancellationTier,
              chargePercent,
              reason: input.reason ?? null,
              origin: input.origin,
            });
          } catch (e) {
            console.warn("Failed to send admin cancellation notification:", e);
          }
        }

        return updated;
      }),

    // Public: retry payment for an unpaid Stripe booking
    retryPayment: publicProcedure
      .input(z.object({
        referenceNumber: z.string(),
        origin: z.string(),
      }))
      .mutation(async ({ input }) => {
        const booking = await getBookingByReference(input.referenceNumber);
        if (!booking) throw new Error("Booking not found");
        if (booking.paymentMethod !== "stripe_prepay") throw new Error("This booking does not use Stripe payment");
        if (booking.paymentStatus === "paid") throw new Error("This booking has already been paid");
        if (booking.status === "cancelled") throw new Error("Cannot pay for a cancelled booking");

        const serviceLabel = booking.serviceType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        const { url, sessionId } = await createCheckoutSession({
          bookingReference: booking.referenceNumber,
          bookingId: booking.id,
          amount: parseFloat(booking.totalPrice ?? "0"),
          customerEmail: booking.clientEmail,
          customerName: booking.clientName,
          serviceDescription: serviceLabel,
          origin: input.origin,
        });
        await updateBookingStripeSession(booking.id, sessionId);
        return { checkoutUrl: url };
      }),

    // Authenticated user: cancel their own quote
    cancelQuote: protectedProcedure
      .input(z.object({
        referenceNumber: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.email) throw new Error("Unauthorized");
        const booking = await getBookingByReference(input.referenceNumber);
        if (!booking) throw new Error("Quote not found");
        if (booking.clientEmail !== ctx.user.email) throw new Error("Unauthorized");
        if (booking.status !== "quote") throw new Error("Only active quotes can be cancelled");

        const result = await cancelQuote(input.referenceNumber, ctx.user.email);
        if (!result || result.status !== "cancelled") {
          throw new Error("Failed to cancel quote");
        }

        // Notify owner
        try {
          await notifyOwner({
            title: `Quote Cancelled: ${booking.referenceNumber}`,
            content: `Quote ${booking.referenceNumber} cancelled by client ${booking.clientName} (${booking.clientEmail}).\nService: ${booking.serviceType}\nPickup: ${new Date(booking.pickupDate).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })}`,
          });
        } catch (e) {
          console.warn("Failed to send quote cancellation notification:", e);
        }

        return result;
      }),

    // Admin: convert a quote (or expired quote) to a booking
    adminConvertQuote: adminProcedure
      .input(z.object({
        bookingId: z.number(),
        paymentMethod: z.enum(["stripe_prepay", "square_postpay", "cash_postpay"]),
        origin: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const booking = await adminConvertQuoteToBooking(input.bookingId, input.paymentMethod);
        if (!booking || (booking.status !== "pending")) {
          throw new Error("Quote not found or already converted");
        }

        // Send booking confirmation email
        if (input.origin) {
          try {
            await sendBookingConfirmationEmail({
              referenceNumber: booking.referenceNumber,
              clientName: booking.clientName,
              clientEmail: booking.clientEmail,
              serviceType: booking.serviceType,
              pickupAddress: booking.pickupAddress,
              dropoffAddress: booking.dropoffAddress ?? null,
              pickupDate: typeof booking.pickupDate === 'number' ? booking.pickupDate : new Date(booking.pickupDate).getTime(),
              passengerCount: booking.passengerCount,
              vehicleName: booking.vehicleName,
              rearFacingSeats: booking.rearFacingSeats ?? 0,
              forwardFacingSeats: booking.forwardFacingSeats ?? 0,
              boosterSeats: booking.boosterSeats ?? 0,
              isPetFriendly: !!booking.isPetFriendly,
              numberOfPets: booking.numberOfPets ?? null,
              petDescription: booking.petDescription ?? null,
              freightDescription: booking.freightDescription ?? null,
              freightWeight: booking.freightWeight ?? null,
              freightItemCount: booking.freightItemCount ?? null,
              freightSpecialHandling: booking.freightSpecialHandling ?? null,
              routePreference: booking.routePreference ?? "fastest",
              totalPrice: booking.totalPrice,
              paymentMethod: input.paymentMethod,
              paymentStatus: "unpaid",
              specialRequests: booking.specialRequests ?? null,
              origin: input.origin,
            });
          } catch (emailError) {
            console.warn("[Admin] Failed to send confirmation email for converted quote:", emailError);
          }

          // Send admin notification
          try {
            await sendAdminNewBookingNotification({
              referenceNumber: booking.referenceNumber,
              clientName: booking.clientName,
              clientEmail: booking.clientEmail,
              serviceType: booking.serviceType,
              pickupAddress: booking.pickupAddress,
              dropoffAddress: booking.dropoffAddress ?? null,
              pickupDate: typeof booking.pickupDate === 'number' ? booking.pickupDate : new Date(booking.pickupDate).getTime(),
              passengerCount: booking.passengerCount,
              vehicleName: booking.vehicleName,
              totalPrice: booking.totalPrice,
              paymentMethod: input.paymentMethod,
              paymentStatus: "unpaid",
              specialRequests: booking.specialRequests ?? null,
              origin: input.origin,
            });
          } catch (e) {
            console.warn("[Admin] Failed to send admin notification for converted quote:", e);
          }
        }

        return booking;
      }),
  }),

  // ─── Email Logs (Admin) ───
  emailLogs: router({
    list: adminProcedure
      .input(z.object({
        emailType: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return listEmailLogs(input);
      }),

    stats: adminProcedure.query(async () => {
      return getEmailLogStats();
    }),
  }),

  pricing: router({
    // Public: get all pricing settings (for displaying base prices on cards)
    getAll: publicProcedure.query(async () => {
      return getAllPricingSettings();
    }),

    // Public: calculate price for a booking (suburb-based)
    calculate: publicProcedure
      .input(
        z.object({
          serviceType: z.string(),
          pickupSuburb: z.string(),
          destinationSuburb: z.string().optional(),
          distanceKm: z.number().min(0).optional(),
          pickupHour: z.number().min(0).max(23),
          pickupDateStr: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/).optional().default(""),
          needsSupportVan: z.boolean().default(false),
          paymentMethod: z.string().default("cash_postpay"),
          hireHours: z.number().min(0).optional(),
          additionalPickupCount: z.number().min(0).max(5).default(0),
          additionalDropoffCount: z.number().min(0).max(5).default(0),
          isPetFriendly: z.boolean().default(false),
          numberOfPets: z.number().min(0).default(0),
          freightWeight: z.string().optional(),
          preferTollFree: z.boolean().default(false),
        })
      )
      .query(async ({ input }) => {
        // Helper: resolve location from static data or DB landmarks
        const dbLandmarks = await getActiveLandmarks();
        const resolveLocation = (name: string) => {
          const staticResult = lookupSuburb(name);
          if (staticResult) return staticResult;
          const cleaned = name.trim().toLowerCase();
          const match = dbLandmarks.find((lm: any) => lm.name.toLowerCase() === cleaned);
          if (match) {
            return {
              name: match.name,
              lga: match.lga,
              area: classifyLGA(match.lga),
              lat: parseFloat(String(match.lat)),
              lng: parseFloat(String(match.lng)),
              isLandmark: true,
            };
          }
          return null;
        };

        const pickupResolved = input.pickupSuburb ? resolveLocation(input.pickupSuburb) : null;
        const destResolved = input.destinationSuburb ? resolveLocation(input.destinationSuburb) : null;

        // Auto-detect out-of-area
        const pickupArea = pickupResolved?.area ?? "other";
        const destArea = destResolved?.area ?? pickupArea;
        const outOfArea = pickupArea === "secondary" || destArea === "secondary" ||
                          pickupArea === "other" || destArea === "other";

        // Auto-estimate distance
        let distanceKm = input.distanceKm ?? 0;
        if (pickupResolved && destResolved) {
          distanceKm = calculateDistance(pickupResolved.lat, pickupResolved.lng, destResolved.lat, destResolved.lng);
        } else if (input.pickupSuburb && input.destinationSuburb) {
          const estimated = estimateDistance(input.pickupSuburb, input.destinationSuburb);
          if (estimated !== null) distanceKm = estimated;
        }

        const breakdown = await calculatePrice({
          serviceType: input.serviceType,
          distanceKm,
          pickupHour: input.pickupHour,
          pickupDateStr: input.pickupDateStr || "",
          isOutOfArea: outOfArea,
          needsSupportVan: input.needsSupportVan,
          paymentMethod: input.paymentMethod,
          hireHours: input.hireHours,
          additionalPickupCount: input.additionalPickupCount,
          additionalDropoffCount: input.additionalDropoffCount,
          isPetFriendly: input.isPetFriendly,
          numberOfPets: input.numberOfPets,
          freightWeight: input.freightWeight,
          pickupSuburb: input.pickupSuburb,
          destinationSuburb: input.destinationSuburb,
          preferTollFree: input.preferTollFree,
        });

        return {
          ...breakdown,
          distanceKm,
          isOutOfArea: outOfArea,
          pickupArea,
          destinationArea: input.destinationSuburb ? destArea : null,
        };
      }),

    // Public: lookup suburb info (checks static data first, then DB landmarks)
    lookupSuburb: publicProcedure
      .input(z.object({ suburb: z.string() }))
      .query(async ({ input }) => {
        // Try static lookup first
        const staticResult = lookupSuburb(input.suburb);
        if (staticResult) return staticResult;
        // Fall back to DB landmarks
        const dbLandmarks = await getActiveLandmarks();
        const cleaned = input.suburb.trim().toLowerCase();
        const match = dbLandmarks.find((lm: any) => lm.name.toLowerCase() === cleaned);
        if (match) {
          return {
            name: match.name,
            lga: match.lga,
            area: classifyLGA(match.lga),
            lat: parseFloat(String(match.lat)),
            lng: parseFloat(String(match.lng)),
            isLandmark: true,
          };
        }
        return null;
      }),

    // Public: get all suburb names for autocomplete (includes DB landmarks)
    suburbs: publicProcedure.query(async () => {
      const staticNames = getAllSuburbNames();
      const dbLandmarks = await getActiveLandmarks();
      const nameSet = new Set(staticNames.map(n => n.toLowerCase()));
      const merged = [...staticNames];
      for (const lm of dbLandmarks) {
        if (!nameSet.has(lm.name.toLowerCase())) {
          merged.push(lm.name);
          nameSet.add(lm.name.toLowerCase());
        }
      }
      return merged.sort();
    }),

    // Get all locations (suburbs + landmarks) with type info
    // Merges static SUBURB_DATA with active DB landmarks
    locationsWithType: publicProcedure.query(async () => {
      const staticLocations = getAllLocationsWithType();
      // Fetch active DB landmarks and merge
      let dbLandmarks: Awaited<ReturnType<typeof getActiveLandmarks>> = [];
      try {
        dbLandmarks = await getActiveLandmarks();
        console.log(`[locationsWithType] DB returned ${dbLandmarks.length} landmarks`);
        if (dbLandmarks.length > 0) {
          console.log(`[locationsWithType] First landmark: ${dbLandmarks[0].name}, address: ${dbLandmarks[0].address || 'NONE'}`);
        }
      } catch (err: any) {
        console.error(`[locationsWithType] Failed to fetch landmarks:`, err?.message || err);
      }
      const existingNames = new Set(staticLocations.map(l => l.name.toLowerCase()));
      const merged: Array<{ name: string; isLandmark?: boolean; address?: string | null }> = [...staticLocations];
      let addressCount = 0;
      for (const lm of dbLandmarks) {
        if (!existingNames.has(lm.name.toLowerCase())) {
          merged.push({ name: lm.name, isLandmark: true, address: lm.address || null });
          existingNames.add(lm.name.toLowerCase());
          if (lm.address) addressCount++;
        } else {
          // Update existing entry with address from DB if available
          const existing = merged.find(m => m.name.toLowerCase() === lm.name.toLowerCase());
          if (existing && lm.address) {
            existing.address = lm.address;
            addressCount++;
          }
        }
      }
      console.log(`[locationsWithType] Merged ${merged.length} locations, ${addressCount} with addresses`);
      return merged.sort((a, b) => a.name.localeCompare(b.name));
    }),

    // Admin: update a pricing setting
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          value: z.string(),
          isActive: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return updatePricingSetting(input.id, input.value, input.isActive);
      }),

    markAsReviewed: adminProcedure
      .input(z.object({ tollType: z.enum(["airport", "road"]) }))
      .mutation(async ({ input }) => {
        await markTollsAsReviewed(input.tollType);
        return { success: true };
      }),
  }),

  publicHolidays: router({
    // Public: get active holidays (for booking form to show holiday indicator)
    active: publicProcedure.query(async () => {
      return getActivePublicHolidays();
    }),

    // Admin: list all holidays (including inactive)
    list: adminProcedure.query(async () => {
      return getAllPublicHolidays();
    }),

    // Admin: create a new holiday
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1, "Holiday name is required"),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
        isRecurring: z.number().min(0).max(1).default(0),
        isActive: z.number().min(0).max(1).default(1),
      }))
      .mutation(async ({ input }) => {
        return createPublicHoliday(input);
      }),

    // Admin: update a holiday
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        isRecurring: z.number().min(0).max(1).optional(),
        isActive: z.number().min(0).max(1).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updatePublicHoliday(id, data);
      }),

    // Admin: delete a holiday
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePublicHoliday(input.id);
        return { success: true };
      }),
  }),

  reviews: router({
    // Public: get approved reviews for homepage testimonials
    approved: publicProcedure.query(async () => {
      return getApprovedReviews();
    }),

    // Public: get aggregate stats (average rating + count of approved reviews)
    publicStats: publicProcedure.query(async () => {
      return getReviewStats();
    }),

    // Public: check if a booking already has a review
    checkBooking: publicProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ input }) => {
        const review = await getReviewByBookingId(input.bookingId);
        return { hasReview: !!review, review };
      }),

    // Protected: submit a review (logged-in users only, for completed bookings)
    submit: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().max(1000).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verify the booking exists and belongs to this user
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new Error("Booking not found");
        if (booking.clientEmail !== ctx.user.email) throw new Error("You can only review your own bookings");
        if (booking.status !== "completed") throw new Error("You can only review completed bookings");

        // Check if already reviewed
        const existing = await getReviewByBookingId(input.bookingId);
        if (existing) throw new Error("You have already reviewed this booking");

        const review = await createReview({
          bookingId: input.bookingId,
          bookingReference: booking.referenceNumber,
          userId: ctx.user.id,
          reviewerName: booking.clientName,
          rating: input.rating,
          comment: input.comment ?? null,
          serviceType: booking.serviceType,
        });

        // Notify owner
        try {
          await notifyOwner({
            title: `New Review: ${input.rating} stars`,
            content: `${booking.clientName} left a ${input.rating}-star review for booking ${booking.referenceNumber}.\n${input.comment ? `Comment: ${input.comment}` : "No comment."}\n\nReview is pending approval.`,
          });
        } catch (e) {
          console.warn("Failed to send review notification:", e);
        }

        return { success: true, review };
      }),

    // Admin: list all reviews
    list: adminProcedure
      .input(z.object({
        status: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return listReviews(input);
      }),

    // Admin: get review stats
    stats: adminProcedure.query(async () => {
      return getReviewStats();
    }),

    // Admin: get single review
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getReviewById(input.id);
      }),

    // Admin: update review status (approve/reject)
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "approved", "rejected"]),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return updateReviewStatus(input.id, input.status, input.adminNotes);
      }),

    // Admin: delete a review
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteReview(input.id);
        return { success: true };
      }),
  }),

  googleReviews: router({
    // Public: get Google reviews (cached, auto-refreshes every 24h)
    get: publicProcedure.query(async () => {
      const placeId = await getAppSetting("google_place_id");
      if (!placeId) return { reviews: [], rating: 0, totalRatings: 0, configured: false };

      const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
      const cacheAge = await getGoogleReviewsCacheAge(placeId);

      // If cache is fresh, return cached data
      if (cacheAge !== null && cacheAge < CACHE_TTL) {
        const cached = await getCachedGoogleReviews(placeId);
        const avgRating = cached.length > 0 ? Math.round(cached.reduce((sum: number, r: any) => sum + r.rating, 0) / cached.length * 10) / 10 : 0;
        return {
          reviews: cached.map((r: any) => ({
            id: r.id,
            authorName: r.authorName,
            rating: r.rating,
            text: r.text,
            relativeTimeDescription: r.relativeTimeDescription,
            publishTime: r.publishTime,
            profilePhotoUrl: r.profilePhotoUrl,
            source: "google" as const,
          })),
          rating: avgRating,
          totalRatings: cached.length,
          configured: true,
        };
      }

      // Fetch fresh reviews from Google Places API
      try {
        const result = await makeRequest<PlaceDetailsResult>(
          "/maps/api/place/details/json",
          { place_id: placeId, fields: "reviews,rating,user_ratings_total" }
        );

        if (result.status !== "OK" || !result.result) {
          // Return stale cache if available
          const cached = await getCachedGoogleReviews(placeId);
          const avgRating = cached.length > 0 ? Math.round(cached.reduce((sum: number, r: any) => sum + r.rating, 0) / cached.length * 10) / 10 : 0;
          return {
            reviews: cached.map((r: any) => ({
              id: r.id,
              authorName: r.authorName,
              rating: r.rating,
              text: r.text,
              relativeTimeDescription: r.relativeTimeDescription,
              publishTime: r.publishTime,
              profilePhotoUrl: r.profilePhotoUrl,
              source: "google" as const,
            })),
            rating: avgRating,
            totalRatings: cached.length,
            configured: true,
          };
        }

        const googleReviews = result.result.reviews ?? [];

        // Clear old cache and insert new
        await clearGoogleReviewsCache(placeId);
        if (googleReviews.length > 0) {
          await insertGoogleReviews(googleReviews.map((r: any) => ({
            placeId,
            authorName: r.author_name || "Anonymous",
            rating: r.rating,
            text: r.text || null,
            relativeTimeDescription: null,
            publishTime: r.time ? r.time * 1000 : null,
            profilePhotoUrl: null,
          })));
        }

        return {
          reviews: googleReviews.map((r: any, i: number) => ({
            id: i + 1,
            authorName: r.author_name || "Anonymous",
            rating: r.rating,
            text: r.text || null,
            relativeTimeDescription: null,
            publishTime: r.time ? r.time * 1000 : null,
            profilePhotoUrl: null,
            source: "google" as const,
          })),
          rating: result.result.rating ?? 0,
          totalRatings: result.result.user_ratings_total ?? 0,
          configured: true,
        };
      } catch (error) {
        console.error("[GoogleReviews] Failed to fetch:", error);
        // Return stale cache on error
        const cached = await getCachedGoogleReviews(placeId);
        const avgRating = cached.length > 0 ? Math.round(cached.reduce((sum: number, r: any) => sum + r.rating, 0) / cached.length * 10) / 10 : 0;
        return {
          reviews: cached.map((r: any) => ({
            id: r.id,
            authorName: r.authorName,
            rating: r.rating,
            text: r.text,
            relativeTimeDescription: r.relativeTimeDescription,
            publishTime: r.publishTime,
            profilePhotoUrl: r.profilePhotoUrl,
            source: "google" as const,
          })),
          rating: avgRating,
          totalRatings: cached.length,
          configured: true,
        };
      }
    }),

    // Admin: get current Google Place ID setting
    getPlaceId: adminProcedure.query(async () => {
      const placeId = await getAppSetting("google_place_id");
      return { placeId: placeId ?? "" };
    }),

    // Admin: update Google Place ID
    setPlaceId: adminProcedure
      .input(z.object({ placeId: z.string() }))
      .mutation(async ({ input }) => {
        await setAppSetting("google_place_id", input.placeId);
        // Clear cache so reviews are fetched fresh
        if (input.placeId) {
          await clearGoogleReviewsCache(input.placeId);
        }
        return { success: true };
      }),

    // Admin: force refresh Google reviews cache
    refresh: adminProcedure.mutation(async () => {
      const placeId = await getAppSetting("google_place_id");
      if (!placeId) throw new Error("Google Place ID not configured");

      const result = await makeRequest<PlaceDetailsResult>(
        "/maps/api/place/details/json",
        { place_id: placeId, fields: "reviews,rating,user_ratings_total" }
      );

      if (result.status !== "OK" || !result.result) {
        throw new Error("Failed to fetch reviews from Google");
      }

      const googleReviews = result.result.reviews ?? [];
      await clearGoogleReviewsCache(placeId);
      if (googleReviews.length > 0) {
        await insertGoogleReviews(googleReviews.map(r => ({
          placeId,
          authorName: r.author_name || "Anonymous",
          rating: r.rating,
          text: r.text || null,
          relativeTimeDescription: null,
          publishTime: r.time ? r.time * 1000 : null,
          profilePhotoUrl: null,
        })));
      }

      return {
        success: true,
        count: googleReviews.length,
        rating: result.result.rating ?? 0,
        totalRatings: result.result.user_ratings_total ?? 0,
      };
    }),
  }),

  enquiries: router({
    // Public: submit an enquiry (no login required)
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Valid email is required"),
        phone: z.string().optional(),
        subject: z.string().min(1, "Subject is required"),
        message: z.string().min(10, "Message must be at least 10 characters"),
      }))
      .mutation(async ({ input }) => {
        const enquiry = await createEnquiry({
          name: input.name,
          email: input.email,
          phone: input.phone ?? null,
          subject: input.subject,
          message: input.message,
        });

        // Notify owner about new enquiry
        try {
          await notifyOwner({
            title: `New Enquiry: ${input.subject}`,
            content: `New enquiry from ${input.name} (${input.email})\nSubject: ${input.subject}\n\n${input.message}`,
          });
        } catch (e) {
          console.warn("Failed to send enquiry notification:", e);
        }

        return { success: true, id: enquiry.id };
      }),

    // Admin: list all enquiries
    list: adminProcedure
      .input(
        z.object({
          status: z.string().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return listEnquiries(input);
      }),

    // Admin: get single enquiry
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const enquiry = await getEnquiryById(input.id);
        // Auto-mark as read when admin views it
        if (enquiry && enquiry.status === "new") {
          return updateEnquiryStatus(input.id, "read");
        }
        return enquiry;
      }),

    // Admin: update enquiry status
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "read", "replied", "archived"]),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return updateEnquiryStatus(input.id, input.status, input.adminNotes);
      }),

    // Admin: get enquiry stats
    stats: adminProcedure.query(async () => {
      return getEnquiryStats();
    }),
  }),

  landmarks: router({
    // Public: get active landmarks for autocomplete
    active: publicProcedure.query(async () => {
      return getActiveLandmarks();
    }),

    // Admin: list all landmarks (including inactive)
    list: adminProcedure.query(async () => {
      return getAllLandmarks();
    }),

    // Admin: get landmark stats
    stats: adminProcedure.query(async () => {
      return getLandmarkStats();
    }),

    // Admin: get single landmark by ID
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getLandmarkById(input.id);
      }),

    // Admin: create a new landmark
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1, "Landmark name is required"),
        lat: z.string().regex(/^-?\d+\.\d+$/, "Latitude must be a decimal number"),
        lng: z.string().regex(/^-?\d+\.\d+$/, "Longitude must be a decimal number"),
        lga: z.string().min(1, "LGA is required"),
        category: z.enum(["resort", "golf_course", "venue", "hospital", "university", "airport", "shopping", "stadium", "theme_park", "attraction", "other"]),
        address: z.string().max(500).optional(),
        isActive: z.number().min(0).max(1).default(1),
      }))
      .mutation(async ({ input }) => {
        return createLandmark(input);
      }),

    // Admin: update a landmark
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        lat: z.string().optional(),
        lng: z.string().optional(),
        lga: z.string().optional(),
        category: z.enum(["resort", "golf_course", "venue", "hospital", "university", "airport", "shopping", "stadium", "theme_park", "attraction", "other"]).optional(),
        address: z.string().max(500).optional(),
        isActive: z.number().min(0).max(1).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateLandmark(id, data);
      }),

    // Admin: toggle landmark active/inactive
    toggleActive: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return toggleLandmarkActive(input.id);
      }),

    // Admin: delete a landmark
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteLandmark(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
