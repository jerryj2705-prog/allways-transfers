import cron from "node-cron";
import { notifyOwner } from "./_core/notification";

/**
 * Quarterly Toll Price Review Reminder
 * Runs at 9:00 AM AEST on the 1st of January, April, July, and October.
 * Sends an email to the admin reminding them to review SEQ toll road prices.
 */
function startTollReviewReminder() {
  // Cron: minute hour day-of-month month day-of-week
  // "0 9 1 1,4,7,10 *" = 9:00 AM on 1st of Jan, Apr, Jul, Oct
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
 * Initialize all cron jobs
 */
export function initCronJobs() {
  startTollReviewReminder();
  console.log("[Cron] All cron jobs initialized");
}
