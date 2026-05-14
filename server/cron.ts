import cron from "node-cron";
import { notifyOwner } from "./_core/notification";
import { ENV } from "./_core/env";
import { getQuotesNeedingReminders, getQuotesToExpire, expireQuote, updateLastReminderSentAt, getVehicleById, getDirectDepositUnpaidBookings, updateLastPaymentReminderSentAt, getBankDetails } from "./db";
import { sendQuoteReminderEmail, sendQuoteExpiredEmail, sendDirectDepositPaymentReminderEmail } from "./email";

/**
 * Quarterly Toll Price Review Reminder
 * Runs at 9:00 AM AEST on the 1st of January, April, July, and October.
 * Sends an email to the admin reminding them to review SEQ toll road prices.
 */
function startTollReviewReminder() {
  cron.schedule("0 9 1 1,4,7,10 *", async () => {
    console.log("[Cron] Running quarterly toll price review reminder");
    try {
      await notifyOwner({
        title: "Quarterly Toll Price Review",
        content: `Hi Jerry,

This is your quarterly reminder to review and update the toll road prices on your All Ways Transfers admin pricing page.

SEQ toll prices may have changed. Please check:
• Linkt Toll Calculator: https://www.linkt.com.au/using-toll-roads/toll-calculator
• Your admin pricing page: /admin/pricing (Road Tolls & Airport Tolls sections)

Tolls to review:
- Gateway Motorway
- Logan Motorway
- Clem7 Tunnel
- Go Between Bridge
- Legacy Way
- Airport Link M7
- Toowoomba Bypass
- Sunshine Coast Airport (entry/exit)
- Brisbane Airport (entry/exit)

If prices have changed, update the amounts on the admin pricing page. The "Last Updated" date will automatically refresh when you save.

— All Ways Transfers System`,
      });
      console.log("[Cron] Toll review reminder sent successfully");
    } catch (error) {
      console.error("[Cron] Failed to send toll review reminder:", error);
    }
  }, {
    timezone: "Australia/Brisbane",
  });

  console.log("[Cron] Quarterly toll review reminder scheduled (1st of Jan/Apr/Jul/Oct at 9:00 AM AEST)");
}

/**
 * Quote Expiry Check
 * Runs every day at 8:00 AM AEST.
 * - Expires quotes where pickup is within 2 days (or past)
 * - Sends daily reminders for active quotes that haven't been reminded in 23+ hours
 */
function startQuoteExpiryCheck() {
  cron.schedule("0 8 * * *", async () => {
    console.log("[Cron] Running daily quote expiry check");
    const origin = ENV.siteUrl;

    try {
      // Step 1: Expire quotes where pickup is within 2 days
      const quotesToExpire = await getQuotesToExpire();
      for (const quote of quotesToExpire) {
        try {
          await expireQuote(quote.id);
          console.log(`[Cron] Expired quote ${quote.referenceNumber} (pickup: ${new Date(quote.pickupDate).toISOString()})`);

          // Send expiry notification to client
          await sendQuoteExpiredEmail({
            referenceNumber: quote.referenceNumber,
            clientName: quote.clientName,
            clientEmail: quote.clientEmail,
            serviceType: quote.serviceType,
            pickupDate: quote.pickupDate,
            origin,
          });
        } catch (err) {
          console.error(`[Cron] Failed to expire quote ${quote.referenceNumber}:`, err);
        }
      }
      if (quotesToExpire.length > 0) {
        console.log(`[Cron] Expired ${quotesToExpire.length} quote(s)`);
      }

      // Step 2: Send reminders for active quotes
      const quotesNeedingReminders = await getQuotesNeedingReminders();
      for (const quote of quotesNeedingReminders) {
        try {
          const now = Date.now();
          const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
          const expiryTime = quote.pickupDate - twoDaysMs;
          const daysUntilExpiry = Math.max(1, Math.ceil((expiryTime - now) / (24 * 60 * 60 * 1000)));

          // Get vehicle name
          const vehicle = quote.vehicleId ? await getVehicleById(quote.vehicleId) : null;
          const vehicleName = vehicle?.name ?? "Standard Vehicle";

          await sendQuoteReminderEmail({
            referenceNumber: quote.referenceNumber,
            clientName: quote.clientName,
            clientEmail: quote.clientEmail,
            serviceType: quote.serviceType,
            pickupAddress: quote.pickupAddress,
            dropoffAddress: quote.dropoffAddress,
            pickupDate: quote.pickupDate,
            totalPrice: String(quote.totalPrice),
            vehicleName,
            daysUntilExpiry,
            origin,
          });

          await updateLastReminderSentAt(quote.id);
          console.log(`[Cron] Sent reminder for quote ${quote.referenceNumber} (${daysUntilExpiry} days until expiry)`);
        } catch (err) {
          console.error(`[Cron] Failed to send reminder for quote ${quote.referenceNumber}:`, err);
        }
      }
      if (quotesNeedingReminders.length > 0) {
        console.log(`[Cron] Sent ${quotesNeedingReminders.length} quote reminder(s)`);
      }

      if (quotesToExpire.length === 0 && quotesNeedingReminders.length === 0) {
        console.log("[Cron] No quotes to expire or remind");
      }
    } catch (error) {
      console.error("[Cron] Quote expiry check failed:", error);
    }
  }, {
    timezone: "Australia/Brisbane",
  });

  console.log("[Cron] Daily quote expiry check scheduled (8:00 AM AEST)");
}

/**
 * Direct Deposit Payment Reminder
 * Runs every day at 9:00 AM AEST.
 * Sends payment reminders for direct deposit bookings that are unpaid after 24 hours.
 * Only sends one reminder per day per booking (tracked via lastPaymentReminderSentAt).
 */
function startPaymentReminderCheck() {
  cron.schedule("0 9 * * *", async () => {
    console.log("[Cron] Running daily payment reminder check");
    const origin = ENV.siteUrl;

    try {
      const unpaidBookings = await getDirectDepositUnpaidBookings();
      if (unpaidBookings.length === 0) {
        console.log("[Cron] No unpaid direct deposit bookings to remind");
        return;
      }

      // Fetch bank details once for all reminders
      const bankDetails = await getBankDetails();

      for (const booking of unpaidBookings) {
        try {
          await sendDirectDepositPaymentReminderEmail({
            referenceNumber: booking.referenceNumber,
            clientName: booking.clientName,
            clientEmail: booking.clientEmail,
            serviceType: booking.serviceType,
            pickupAddress: booking.pickupAddress,
            dropoffAddress: booking.dropoffAddress,
            pickupDate: booking.pickupDate,
            totalPrice: String(booking.totalPrice),
            vehicleName: booking.vehicleName,
            origin,
            bankDetails,
          });

          await updateLastPaymentReminderSentAt(booking.id);
          console.log(`[Cron] Sent payment reminder for booking ${booking.referenceNumber}`);
        } catch (err) {
          console.error(`[Cron] Failed to send payment reminder for ${booking.referenceNumber}:`, err);
        }
      }
      console.log(`[Cron] Sent ${unpaidBookings.length} payment reminder(s)`);
    } catch (error) {
      console.error("[Cron] Payment reminder check failed:", error);
    }
  }, {
    timezone: "Australia/Brisbane",
  });

  console.log("[Cron] Daily payment reminder check scheduled (9:00 AM AEST)");
}

/**
 * Initialize all cron jobs
 */
export function initCronJobs() {
  startTollReviewReminder();
  startQuoteExpiryCheck();
  startPaymentReminderCheck();
  console.log("[Cron] All cron jobs initialized");
}
