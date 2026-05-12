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
} from "./db";
import { makeRequest, type PlaceDetailsResult } from "./_core/map";
import { createCheckoutSession } from "./stripe";
import { notifyOwner } from "./_core/notification";
import { sendBookingConfirmationEmail, sendCancellationConfirmationEmail, sendAdminNewBookingNotification, sendAdminCancellationNotification, sendPasswordResetEmail } from "./email";
import crypto from "crypto";
import { lookupSuburb, estimateDistance, isOutOfArea, getAllSuburbNames } from "@shared/suburbs";

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
          serviceType: z.enum(["airport_transfer", "hourly_hire", "point_to_point", "special_events"]),
          pickupAddress: z.string().min(1, "Pickup address is required"),
          dropoffAddress: z.string().optional(),
          pickupDate: z.number().min(1, "Pickup date is required"),
          passengerCount: z.number().min(1).max(7),
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
          const minHoursSetting = settings.find(s => s.settingKey === "min_hourly_hours");
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
        })
      )
      .mutation(async ({ input }) => {
        const booking = await getBookingById(input.id);
        if (!booking) throw new Error("Booking not found");
        return updateBookingPaymentStatus(input.id, input.paymentStatus);
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
        passengerCount: z.number().min(1).max(7).optional(),
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
        passengerCount: z.number().min(1).max(7).optional(),
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
        const chargeSetting = settings.find(s => s.settingKey === "late_cancel_charge_pct");
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
        const chargeSetting = settings.find(s => s.settingKey === "late_cancel_charge_pct");
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
        })
      )
      .query(async ({ input }) => {
        // Auto-detect out-of-area from suburbs
        const outOfArea = input.pickupSuburb && input.destinationSuburb
          ? isOutOfArea(input.pickupSuburb, input.destinationSuburb)
          : input.pickupSuburb
            ? isOutOfArea(input.pickupSuburb, input.pickupSuburb)
            : false;

        // Auto-estimate distance from suburbs
        let distanceKm = input.distanceKm ?? 0;
        if (input.pickupSuburb && input.destinationSuburb) {
          const estimated = estimateDistance(input.pickupSuburb, input.destinationSuburb);
          if (estimated !== null) {
            distanceKm = estimated;
          }
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
        });

        return {
          ...breakdown,
          distanceKm,
          isOutOfArea: outOfArea,
          pickupArea: lookupSuburb(input.pickupSuburb)?.area ?? "other",
          destinationArea: input.destinationSuburb ? (lookupSuburb(input.destinationSuburb)?.area ?? "other") : null,
        };
      }),

    // Public: lookup suburb info
    lookupSuburb: publicProcedure
      .input(z.object({ suburb: z.string() }))
      .query(({ input }) => {
        return lookupSuburb(input.suburb);
      }),

    // Public: get all suburb names for autocomplete
    suburbs: publicProcedure.query(() => {
      return getAllSuburbNames();
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
        const avgRating = cached.length > 0 ? Math.round(cached.reduce((sum, r) => sum + r.rating, 0) / cached.length * 10) / 10 : 0;
        return {
          reviews: cached.map(r => ({
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
          const avgRating = cached.length > 0 ? Math.round(cached.reduce((sum, r) => sum + r.rating, 0) / cached.length * 10) / 10 : 0;
          return {
            reviews: cached.map(r => ({
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
          reviews: googleReviews.map((r, i) => ({
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
        const avgRating = cached.length > 0 ? Math.round(cached.reduce((sum, r) => sum + r.rating, 0) / cached.length * 10) / 10 : 0;
        return {
          reviews: cached.map(r => ({
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
      .input(z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
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
});

export type AppRouter = typeof appRouter;
