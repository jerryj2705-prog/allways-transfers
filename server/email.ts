import { Resend } from "resend";
import { ENV } from "./_core/env";
import { logEmail } from "./db";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!ENV.resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    _resend = new Resend(ENV.resendApiKey);
  }
  return _resend;
}

/**
 * Send an email via Resend and log the result to the email_logs table.
 */
async function sendAndLog(params: {
  emailType: string;
  from: string;
  to: string[];
  bcc?: string[];
  subject: string;
  html: string;
  bookingReference?: string;
}): Promise<{ success: boolean; id?: string }> {
  const resend = getResend();
  try {
    const result = await resend.emails.send({
      from: params.from,
      to: params.to,
      bcc: params.bcc,
      subject: params.subject,
      html: params.html,
    });

    if (result.error) {
      console.warn(`[Email] Failed to send ${params.emailType}:`, result.error);
      // Log each recipient
      for (const recipient of params.to) {
        await logEmail({
          emailType: params.emailType,
          toEmail: recipient,
          fromEmail: params.from,
          subject: params.subject,
          status: "failed",
          error: JSON.stringify(result.error),
          bookingReference: params.bookingReference ?? null,
        });
      }
      return { success: false };
    }

    const emailId = result.data?.id;
    console.log(`[Email] ${params.emailType} sent to ${params.to.join(", ")} (ID: ${emailId})`);
    for (const recipient of params.to) {
      await logEmail({
        emailType: params.emailType,
        toEmail: recipient,
        fromEmail: params.from,
        subject: params.subject,
        status: "sent",
        resendId: emailId ?? null,
        bookingReference: params.bookingReference ?? null,
      });
    }
    return { success: true, id: emailId };
  } catch (error) {
    console.warn(`[Email] Error sending ${params.emailType}:`, error);
    for (const recipient of params.to) {
      await logEmail({
        emailType: params.emailType,
        toEmail: recipient,
        fromEmail: params.from,
        subject: params.subject,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        bookingReference: params.bookingReference ?? null,
      });
    }
    return { success: false };
  }
}

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

// ─── Helpers ───

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Australia/Brisbane",
  });
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Australia/Brisbane",
  });
}

function formatServiceType(serviceType: string): string {
  return serviceType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPaymentMethod(method: string): string {
  const labels: Record<string, string> = {
    stripe_prepay: "Pre-pay by Credit Card",
    square_postpay: "Pay Driver by Card",
    cash_postpay: "Pay Driver by Cash",
    direct_deposit: "Direct Bank Transfer",
  };
  return labels[method] ?? method;
}

function formatPaymentStatus(status: string): string {
  const labels: Record<string, string> = {
    paid: "Paid",
    unpaid: "Unpaid",
    refunded: "Refunded",
  };
  return labels[status] ?? status;
}

// ─── Email Template Wrapper ───

function wrapInTemplate(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>All Ways Transfers</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#e5e5e5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:24px 0 16px;">
              <img src="${LOGO_URL}" alt="All Ways Transfers" width="180" style="display:block;max-width:180px;height:auto;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#1a1a1a;border-radius:12px;padding:32px 28px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0 8px;font-size:13px;color:#737373;">
              <p style="margin:0 0 4px;">All Ways Transfers</p>
              <p style="margin:0 0 4px;">Phone: 0466 544 068</p>
              <p style="margin:0 0 4px;">Email: bookings@allwaystransfers.com.au</p>
              <p style="margin:0;color:#525252;font-size:11px;">ABN 18 715 944 056</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Booking Confirmation Email ───

export interface BookingEmailData {
  referenceNumber: string;
  clientName: string;
  clientEmail: string;
  serviceType: string;
  pickupAddress: string;
  dropoffAddress: string | null;
  pickupDate: number;
  passengerCount: number;
  vehicleName: string;
  rearFacingSeats?: number;
  forwardFacingSeats?: number;
  boosterSeats?: number;
  isPetFriendly?: boolean;
  numberOfPets?: number | null;
  petDescription?: string | null;
  // Freight fields
  freightDescription?: string | null;
  freightWeight?: string | null;
  freightItemCount?: number | null;
  freightSpecialHandling?: string | null;
  routePreference?: string;
  totalPrice: string;
  paymentMethod: string;
  paymentStatus: string;
  specialRequests?: string | null;
  additionalPickupCount?: number;
  additionalDropoffCount?: number;
  additionalPickupAddresses?: string[];
  additionalDropoffAddresses?: string[];
  publicHolidaySurcharge?: number;
  publicHolidayName?: string | null;
  airportTollSurcharge?: number;
  airportTollDetails?: { airport: string; direction: string; amount: number }[];
  roadTollSurcharge?: number;
  roadTollDetails?: { road: string; amount: number }[];
  origin: string;
  bankDetails?: {
    bankName: string;
    bsb: string;
    accountNumber: string;
    accountName: string;
    referenceInstructions?: string;
  } | null;
}

function buildAdditionalStopsHtml(data: BookingEmailData): string {
  let html = "";
  if ((data.additionalPickupCount ?? 0) > 0) {
    html += `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Additional Pickups (${data.additionalPickupCount})</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${(data.additionalPickupAddresses ?? []).join("<br/>")}</span>
        </td>
      </tr>`;
  }
  if ((data.additionalDropoffCount ?? 0) > 0) {
    html += `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Additional Drop-offs (${data.additionalDropoffCount})</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${(data.additionalDropoffAddresses ?? []).join("<br/>")}</span>
        </td>
      </tr>`;
  }
  return html;
}

function buildPublicHolidayHtml(data: BookingEmailData): string {
  if (!data.publicHolidayName) return "";
  const surcharge = (data.publicHolidaySurcharge ?? 0) > 0
    ? ` — $${data.publicHolidaySurcharge!.toFixed(2)} surcharge`
    : "";
  return `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #333;">
        <span style="color:#a3a3a3;font-size:13px;">Public Holiday</span><br/>
        <span style="color:#d4a843;font-size:15px;">&#127881; ${data.publicHolidayName}${surcharge}</span>
      </td>
    </tr>`;
}

function buildTollsHtml(data: BookingEmailData): string {
  let html = "";
  if ((data.airportTollSurcharge ?? 0) > 0 && data.airportTollDetails && data.airportTollDetails.length > 0) {
    for (const toll of data.airportTollDetails) {
      html += `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">${toll.airport} ${toll.direction} toll</span><br/>
          <span style="color:#d4a843;font-size:15px;">+$${toll.amount.toFixed(2)}</span>
        </td>
      </tr>`;
    }
  } else if ((data.airportTollSurcharge ?? 0) > 0) {
    html += `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #333;">
        <span style="color:#a3a3a3;font-size:13px;">Airport Tolls</span><br/>
        <span style="color:#d4a843;font-size:15px;">+$${data.airportTollSurcharge!.toFixed(2)}</span>
      </td>
    </tr>`;
  }
  if ((data.roadTollSurcharge ?? 0) > 0 && data.roadTollDetails && data.roadTollDetails.length > 0) {
    for (const toll of data.roadTollDetails) {
      html += `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">${toll.road} Toll</span><br/>
          <span style="color:#d4a843;font-size:15px;">+$${toll.amount.toFixed(2)}</span>
        </td>
      </tr>`;
    }
  } else if ((data.roadTollSurcharge ?? 0) > 0) {
    html += `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #333;">
        <span style="color:#a3a3a3;font-size:13px;">Road Tolls</span><br/>
        <span style="color:#d4a843;font-size:15px;">+$${data.roadTollSurcharge!.toFixed(2)}</span>
      </td>
    </tr>`;
  }
  return html;
}

export async function sendBookingConfirmationEmail(data: BookingEmailData): Promise<boolean> {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    console.log(`[Email] Skipping email send in test environment for ${data.referenceNumber}`);
    return true;
  }
  const resend = getResend();

  const myBookingsUrl = `${data.origin}/my-bookings`;
  const confirmationUrl = `${data.origin}/confirmation/${data.referenceNumber}`;

  // Build child seat info
  const childSeats: string[] = [];
  if (data.rearFacingSeats && data.rearFacingSeats > 0) childSeats.push(`${data.rearFacingSeats}× Rear-facing`);
  if (data.forwardFacingSeats && data.forwardFacingSeats > 0) childSeats.push(`${data.forwardFacingSeats}× Forward-facing`);
  if (data.boosterSeats && data.boosterSeats > 0) childSeats.push(`${data.boosterSeats}× Booster`);

  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#d4a843;font-weight:700;">Booking Confirmed</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;">Thank you for booking with All Ways Transfers, ${data.clientName}.</p>

    <!-- Reference Number -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#262626;border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Booking Reference</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#d4a843;letter-spacing:2px;">${data.referenceNumber}</p>
        </td>
      </tr>
    </table>

    <!-- Booking Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Service</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatServiceType(data.serviceType)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Date &amp; Time</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatDate(data.pickupDate)} at ${formatTime(data.pickupDate)} (AEST)</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pickup</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.pickupAddress}</span>
        </td>
      </tr>
      ${data.dropoffAddress ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Drop-off</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.dropoffAddress}</span>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Passengers</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.passengerCount}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Vehicle</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.vehicleName}</span>
        </td>
      </tr>
      ${childSeats.length > 0 ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Child Seats</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${childSeats.join(", ")}</span>
        </td>
      </tr>` : ""}
      ${data.isPetFriendly && data.numberOfPets ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Number of Pets</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.numberOfPets}</span>
        </td>
      </tr>` : ""}
      ${data.isPetFriendly ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pet(s) Description</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.petDescription ?? "Yes"}</span>
        </td>
      </tr>` : ""}
      ${data.freightDescription ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Freight — Item Description</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.freightDescription}</span>
        </td>
      </tr>` : ""}
      ${data.freightWeight ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Freight — Estimated Weight</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${{under_10kg:"Under 10 kg","10_25kg":"10–25 kg","25_50kg":"25–50 kg","50_100kg":"50–100 kg","100_plus":"100+ kg"}[data.freightWeight] || data.freightWeight}</span>
        </td>
      </tr>` : ""}
      ${data.freightItemCount ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Freight — Number of Items</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.freightItemCount}</span>
        </td>
      </tr>` : ""}
      ${data.freightSpecialHandling ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Freight — Special Handling</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.freightSpecialHandling}</span>
        </td>
      </tr>` : ""}
      ${data.routePreference && data.routePreference !== "fastest" ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Route Preference</span><br/>
          <span style="color:#22c55e;font-size:15px;">&#x1F6E3;&#xFE0F; Toll-Free Route</span>
        </td>
      </tr>` : data.routePreference === "fastest" ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Route Preference</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">&#x1F6E3;&#xFE0F; Fastest Route (may include toll roads)</span>
        </td>
      </tr>` : ""}
      ${buildAdditionalStopsHtml(data)}
      ${buildPublicHolidayHtml(data)}
      ${buildTollsHtml(data)}
      ${data.specialRequests ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Special Requests</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.specialRequests}</span>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Payment</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatPaymentMethod(data.paymentMethod)} — ${formatPaymentStatus(data.paymentStatus)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;">
          <span style="color:#a3a3a3;font-size:13px;">Total</span><br/>
          <span style="color:#d4a843;font-size:22px;font-weight:700;">$${data.totalPrice}</span>
        </td>
      </tr>
    </table>

    ${data.paymentMethod === "direct_deposit" && data.bankDetails ? `
    <!-- Bank Transfer Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#1a2318;border:1px solid #16a34a40;border-radius:8px;padding:16px;">
          <p style="margin:0 0 10px;font-size:14px;color:#4ade80;font-weight:600;">Bank Transfer Details</p>
          <p style="margin:0 0 12px;font-size:13px;color:#a3a3a3;">Please transfer the total amount to the following account using your booking reference as the payment description.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#262626;border-radius:6px;">
            <tr><td style="padding:8px 14px;border-bottom:1px solid #333;"><span style="color:#a3a3a3;font-size:12px;">Bank</span><br/><span style="color:#e5e5e5;font-size:14px;font-weight:600;">${data.bankDetails.bankName}</span></td></tr>
            <tr><td style="padding:8px 14px;border-bottom:1px solid #333;"><span style="color:#a3a3a3;font-size:12px;">BSB</span><br/><span style="color:#e5e5e5;font-size:14px;font-weight:600;font-family:monospace;">${data.bankDetails.bsb}</span></td></tr>
            <tr><td style="padding:8px 14px;border-bottom:1px solid #333;"><span style="color:#a3a3a3;font-size:12px;">Account Number</span><br/><span style="color:#e5e5e5;font-size:14px;font-weight:600;font-family:monospace;">${data.bankDetails.accountNumber}</span></td></tr>
            <tr><td style="padding:8px 14px;border-bottom:1px solid #333;"><span style="color:#a3a3a3;font-size:12px;">Account Name</span><br/><span style="color:#e5e5e5;font-size:14px;font-weight:600;">${data.bankDetails.accountName}</span></td></tr>
            <tr><td style="padding:8px 14px;"><span style="color:#a3a3a3;font-size:12px;">Payment Reference</span><br/><span style="color:#d4a843;font-size:14px;font-weight:700;font-family:monospace;">${data.referenceNumber}</span></td></tr>
          </table>
          ${data.bankDetails.referenceInstructions ? `<p style="margin:10px 0 0;font-size:12px;color:#a3a3a3;font-style:italic;">${data.bankDetails.referenceInstructions}</p>` : ""}
        </td>
      </tr>
    </table>
    ` : ""}

    <!-- My Bookings CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td align="center" style="padding:16px 0;">
          <a href="${myBookingsUrl}" style="display:inline-block;background-color:#d4a843;color:#0a0a0a;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">View My Bookings</a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#737373;text-align:center;">
      You can view, modify, or cancel your booking at any time by visiting your
      <a href="${myBookingsUrl}" style="color:#d4a843;text-decoration:underline;">My Bookings</a> page.
      You can also view this booking's details at your
      <a href="${confirmationUrl}" style="color:#d4a843;text-decoration:underline;">confirmation page</a>.
    </p>
  `;

  const { success } = await sendAndLog({
    emailType: "booking_confirmation",
    from: `All Ways Transfers <${ENV.resendFromEmail}>`,
    to: [data.clientEmail],
    subject: `Booking Confirmed — ${data.referenceNumber}`,
    html: wrapInTemplate(bodyContent),
    bookingReference: data.referenceNumber,
  });
  return success;
}

// ─── Quote Email ───

export interface QuoteEmailData {
  referenceNumber: string;
  clientName: string;
  clientEmail: string;
  serviceType: string;
  pickupAddress: string;
  dropoffAddress: string | null;
  pickupDate: number;
  passengerCount: number;
  vehicleName: string;
  totalPrice: string;
  specialRequests?: string | null;
  additionalPickupCount?: number;
  additionalDropoffCount?: number;
  additionalPickupAddresses?: string[];
  additionalDropoffAddresses?: string[];
  publicHolidaySurcharge?: number;
  publicHolidayName?: string | null;
  airportTollSurcharge?: number;
  airportTollDetails?: { airport: string; direction: string; amount: number }[];
  roadTollSurcharge?: number;
  roadTollDetails?: { road: string; amount: number }[];
  origin: string;
  stripePaymentUrl?: string;
  bankDetails?: {
    bankName: string;
    bsb: string;
    accountNumber: string;
    accountName: string;
    referenceInstructions?: string;
  } | null;
}

export async function sendQuoteEmail(data: QuoteEmailData): Promise<boolean> {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    console.log(`[Email] Skipping email send in test environment for ${data.referenceNumber}`);
    return true;
  }
  const resend = getResend();

  const bookNowUrl = `${data.origin}/book?quote=${data.referenceNumber}`;

  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#d4a843;font-weight:700;">Your Quote</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;">Hi ${data.clientName}, here is your quote from All Ways Transfers.</p>

    <!-- Reference Number -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#262626;border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Quote Reference</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#d4a843;letter-spacing:2px;">${data.referenceNumber}</p>
        </td>
      </tr>
    </table>

    <!-- Quote Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Service</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatServiceType(data.serviceType)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Date &amp; Time</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatDate(data.pickupDate)} at ${formatTime(data.pickupDate)} (AEST)</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pickup</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.pickupAddress}</span>
        </td>
      </tr>
      ${data.dropoffAddress ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Drop-off</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.dropoffAddress}</span>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Passengers</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.passengerCount}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Vehicle</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.vehicleName}</span>
        </td>
      </tr>
      ${buildTollsHtml(data as any)}
      ${buildPublicHolidayHtml(data as any)}
      ${data.specialRequests ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Special Requests</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.specialRequests}</span>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:12px 0 0;">
          <span style="color:#a3a3a3;font-size:13px;">Estimated Total</span><br/>
          <span style="color:#d4a843;font-size:22px;font-weight:700;">$${data.totalPrice}</span>
        </td>
      </tr>
    </table>

    <!-- Time Slot Disclaimer -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#2a2318;border-left:3px solid #d4a843;border-radius:4px;padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:#d4a843;font-weight:600;margin-bottom:6px;">Please Note</p>
          <p style="margin:0;font-size:13px;color:#a3a3a3;line-height:1.5;">This quote is provided for your convenience and does not constitute a confirmed reservation. The requested time slot remains subject to availability and may be allocated to another client prior to booking confirmation. To secure your preferred date and time, we recommend confirming your booking at your earliest convenience. Should your requested time slot become unavailable, our team will work with you to arrange a suitable alternative.</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px;font-size:14px;color:#a3a3a3;text-align:center;">This quote expires 2 days before your pickup date. Ready to proceed?</p>

    <!-- Payment Options Header -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="padding:12px 0;text-align:center;">
          <p style="margin:0;font-size:16px;color:#e5e5e5;font-weight:600;">Choose How to Proceed</p>
        </td>
      </tr>
    </table>

    ${data.stripePaymentUrl ? `
    <!-- Option 1: Pay Now with Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td style="background-color:#1a2332;border:1px solid #2563eb40;border-radius:8px;padding:16px;">
          <p style="margin:0 0 8px;font-size:14px;color:#60a5fa;font-weight:600;">Option 1: Pay Now by Card</p>
          <p style="margin:0 0 12px;font-size:13px;color:#a3a3a3;">Secure payment via Stripe. Your booking will be confirmed instantly upon payment.</p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="${data.stripePaymentUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:700;font-size:14px;">Pay $${data.totalPrice} Now</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    ` : ""}

    ${data.bankDetails ? `
    <!-- Option: Bank Transfer -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td style="background-color:#1a2318;border:1px solid #16a34a40;border-radius:8px;padding:16px;">
          <p style="margin:0 0 8px;font-size:14px;color:#4ade80;font-weight:600;">${data.stripePaymentUrl ? "Option 2" : "Option 1"}: Pay by Bank Transfer</p>
          <p style="margin:0 0 12px;font-size:13px;color:#a3a3a3;">Transfer the quoted amount to the following account. Please use your booking reference as the payment description.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#262626;border-radius:6px;">
            <tr>
              <td style="padding:10px 14px;border-bottom:1px solid #333;">
                <span style="color:#a3a3a3;font-size:12px;">Bank</span><br/>
                <span style="color:#e5e5e5;font-size:14px;font-weight:600;">${data.bankDetails.bankName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 14px;border-bottom:1px solid #333;">
                <span style="color:#a3a3a3;font-size:12px;">BSB</span><br/>
                <span style="color:#e5e5e5;font-size:14px;font-weight:600;font-family:monospace;">${data.bankDetails.bsb}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 14px;border-bottom:1px solid #333;">
                <span style="color:#a3a3a3;font-size:12px;">Account Number</span><br/>
                <span style="color:#e5e5e5;font-size:14px;font-weight:600;font-family:monospace;">${data.bankDetails.accountNumber}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 14px;border-bottom:1px solid #333;">
                <span style="color:#a3a3a3;font-size:12px;">Account Name</span><br/>
                <span style="color:#e5e5e5;font-size:14px;font-weight:600;">${data.bankDetails.accountName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 14px;">
                <span style="color:#a3a3a3;font-size:12px;">Payment Reference</span><br/>
                <span style="color:#d4a843;font-size:14px;font-weight:700;font-family:monospace;">${data.referenceNumber}</span>
              </td>
            </tr>
          </table>
          ${data.bankDetails.referenceInstructions ? `<p style="margin:10px 0 0;font-size:12px;color:#a3a3a3;font-style:italic;">${data.bankDetails.referenceInstructions}</p>` : ""}
          <p style="margin:10px 0 0;font-size:12px;color:#4ade80;">Once your transfer is received, your booking will be confirmed and you will receive a confirmation email.</p>
        </td>
      </tr>
    </table>
    ` : ""}

    <!-- Option: Book Now (Pay Later) -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="background-color:#262626;border:1px solid #d4a84340;border-radius:8px;padding:16px;">
          <p style="margin:0 0 8px;font-size:14px;color:#d4a843;font-weight:600;">${data.stripePaymentUrl && data.bankDetails ? "Option 3" : data.stripePaymentUrl || data.bankDetails ? "Option 2" : ""}: Book Now &amp; Pay Later</p>
          <p style="margin:0 0 12px;font-size:13px;color:#a3a3a3;">Confirm your booking now and choose to pay by cash or card on the day of your transfer.</p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="${bookNowUrl}" style="display:inline-block;background-color:#d4a843;color:#0a0a0a;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:700;font-size:14px;">Book Now</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#737373;text-align:center;">
      Quote reference: <strong style="color:#d4a843;">${data.referenceNumber}</strong>. Final price may vary based on actual distance and conditions.
    </p>
  `;

  const { success } = await sendAndLog({
    emailType: "quote",
    from: `All Ways Transfers <${ENV.resendFromEmail}>`,
    to: [data.clientEmail],
    subject: `Your Quote — ${data.referenceNumber}`,
    html: wrapInTemplate(bodyContent),
    bookingReference: data.referenceNumber,
  });
  return success;
}

// ─── Cancellation Confirmation Email ───

export interface CancellationEmailData {
  referenceNumber: string;
  clientName: string;
  clientEmail: string;
  serviceType: string;
  pickupAddress: string;
  dropoffAddress: string | null;
  pickupDate: number;
  totalPrice: string;
  cancellationTier: "free" | "partial_charge" | "no_refund";
  chargePercent: number;
  reason?: string | null;
  origin: string;
}

export async function sendCancellationConfirmationEmail(data: CancellationEmailData): Promise<boolean> {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    console.log(`[Email] Skipping email send in test environment for ${data.referenceNumber}`);
    return true;
  }
  const resend = getResend();

  const myBookingsUrl = `${data.origin}/my-bookings`;

  // Build cancellation policy text
  let policyText: string;
  let policyColor: string;
  if (data.cancellationTier === "free") {
    policyText = "Your booking has been cancelled at no charge, as it was more than 24 hours before your scheduled pickup.";
    policyColor = "#22c55e"; // green
  } else if (data.cancellationTier === "partial_charge") {
    const chargeAmount = (parseFloat(data.totalPrice) * data.chargePercent / 100).toFixed(2);
    policyText = `A ${data.chargePercent}% late cancellation fee of $${chargeAmount} applies, as the cancellation was made less than 24 hours before your scheduled pickup.`;
    policyColor = "#f59e0b"; // amber
  } else {
    policyText = "No refund is available for cancellations made less than 4 hours before the scheduled pickup.";
    policyColor = "#ef4444"; // red
  }

  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#ef4444;font-weight:700;">Booking Cancelled</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;">Your booking has been cancelled, ${data.clientName}.</p>

    <!-- Reference Number -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#262626;border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Booking Reference</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#737373;letter-spacing:2px;text-decoration:line-through;">${data.referenceNumber}</p>
        </td>
      </tr>
    </table>

    <!-- Cancellation Policy -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#262626;border-left:4px solid ${policyColor};border-radius:4px;padding:16px;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${policyColor};text-transform:uppercase;letter-spacing:0.5px;">Cancellation Policy</p>
          <p style="margin:0;font-size:14px;color:#d4d4d4;">${policyText}</p>
        </td>
      </tr>
    </table>

    <!-- Cancelled Booking Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Service</span><br/>
          <span style="color:#a3a3a3;font-size:15px;">${formatServiceType(data.serviceType)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Date &amp; Time</span><br/>
          <span style="color:#a3a3a3;font-size:15px;">${formatDate(data.pickupDate)} at ${formatTime(data.pickupDate)} (AEST)</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pickup</span><br/>
          <span style="color:#a3a3a3;font-size:15px;">${data.pickupAddress}</span>
        </td>
      </tr>
      ${data.dropoffAddress ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Drop-off</span><br/>
          <span style="color:#a3a3a3;font-size:15px;">${data.dropoffAddress}</span>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#a3a3a3;font-size:13px;">Original Total</span><br/>
          <span style="color:#a3a3a3;font-size:18px;font-weight:600;text-decoration:line-through;">$${data.totalPrice}</span>
        </td>
      </tr>
    </table>

    ${data.reason ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#a3a3a3;font-size:13px;">Your Reason</span><br/>
          <span style="color:#d4d4d4;font-size:14px;">${data.reason}</span>
        </td>
      </tr>
    </table>` : ""}

    <!-- My Bookings CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td align="center" style="padding:16px 0;">
          <a href="${myBookingsUrl}" style="display:inline-block;background-color:#d4a843;color:#0a0a0a;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">View My Bookings</a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#737373;text-align:center;">
      You can view all your bookings, including cancelled ones, on your
      <a href="${myBookingsUrl}" style="color:#d4a843;text-decoration:underline;">My Bookings</a> page.
      If you have any questions about this cancellation, please contact us at
      <a href="mailto:bookings@allwaystransfers.com.au" style="color:#d4a843;text-decoration:underline;">bookings@allwaystransfers.com.au</a>
      or call 0466 544 068.
    </p>
  `;

  const { success } = await sendAndLog({
    emailType: "cancellation_confirmation",
    from: `All Ways Transfers <${ENV.resendFromEmail}>`,
    to: [data.clientEmail],
    subject: `Booking Cancelled — ${data.referenceNumber}`,
    html: wrapInTemplate(bodyContent),
    bookingReference: data.referenceNumber,
  });
  return success;
}


// ─── Admin Notification: New Booking ───

const ADMIN_EMAIL = ENV.adminEmail || "admin@allwaystransfers.com.au";

export async function sendAdminNewBookingNotification(data: BookingEmailData): Promise<boolean> {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    console.log(`[Email] Skipping admin notification in test environment for ${data.referenceNumber}`);
    return true;
  }
  const resend = getResend();

  const adminDashboardUrl = `${data.origin}/admin/bookings`;

  // Build child seat info
  const childSeats: string[] = [];
  if (data.rearFacingSeats && data.rearFacingSeats > 0) childSeats.push(`${data.rearFacingSeats}× Rear-facing`);
  if (data.forwardFacingSeats && data.forwardFacingSeats > 0) childSeats.push(`${data.forwardFacingSeats}× Forward-facing`);
  if (data.boosterSeats && data.boosterSeats > 0) childSeats.push(`${data.boosterSeats}× Booster`);

  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#d4a843;font-weight:700;">New Booking Received</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;">A new booking has been submitted and requires your attention.</p>

    <!-- Reference Number -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#262626;border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Booking Reference</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#d4a843;letter-spacing:2px;">${data.referenceNumber}</p>
        </td>
      </tr>
    </table>

    <!-- Client Info -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Client Name</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.clientName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Client Email</span><br/>
          <span style="color:#e5e5e5;font-size:15px;"><a href="mailto:${data.clientEmail}" style="color:#d4a843;text-decoration:underline;">${data.clientEmail}</a></span>
        </td>
      </tr>
    </table>

    <!-- Booking Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Service</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatServiceType(data.serviceType)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Date &amp; Time</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatDate(data.pickupDate)} at ${formatTime(data.pickupDate)} (AEST)</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pickup</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.pickupAddress}</span>
        </td>
      </tr>
      ${data.dropoffAddress ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Drop-off</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.dropoffAddress}</span>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Passengers</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.passengerCount}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Vehicle</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.vehicleName}</span>
        </td>
      </tr>
      ${childSeats.length > 0 ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Child Seats</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${childSeats.join(", ")}</span>
        </td>
      </tr>` : ""}
      ${data.isPetFriendly && data.numberOfPets ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Number of Pets</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.numberOfPets}</span>
        </td>
      </tr>` : ""}
      ${data.isPetFriendly ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pet(s) Description</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.petDescription ?? "Yes"}</span>
        </td>
      </tr>` : ""}
      ${data.freightDescription ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Freight — Item Description</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.freightDescription}</span>
        </td>
      </tr>` : ""}
      ${data.freightWeight ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Freight — Estimated Weight</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${{under_10kg:"Under 10 kg","10_25kg":"10–25 kg","25_50kg":"25–50 kg","50_100kg":"50–100 kg","100_plus":"100+ kg"}[data.freightWeight] || data.freightWeight}</span>
        </td>
      </tr>` : ""}
      ${data.freightItemCount ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Freight — Number of Items</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.freightItemCount}</span>
        </td>
      </tr>` : ""}
      ${data.freightSpecialHandling ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Freight — Special Handling</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.freightSpecialHandling}</span>
        </td>
      </tr>` : ""}
      ${data.routePreference && data.routePreference !== "fastest" ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Route Preference</span><br/>
          <span style="color:#22c55e;font-size:15px;">&#x1F6E3;&#xFE0F; Toll-Free Route</span>
        </td>
      </tr>` : data.routePreference === "fastest" ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Route Preference</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">&#x1F6E3;&#xFE0F; Fastest Route (may include toll roads)</span>
        </td>
      </tr>` : ""}
      ${buildAdditionalStopsHtml(data)}
      ${buildPublicHolidayHtml(data)}
      ${buildTollsHtml(data)}
      ${data.specialRequests ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Special Requests</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.specialRequests}</span>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Payment Method</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatPaymentMethod(data.paymentMethod)} — ${formatPaymentStatus(data.paymentStatus)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;">
          <span style="color:#a3a3a3;font-size:13px;">Total</span><br/>
          <span style="color:#d4a843;font-size:22px;font-weight:700;">$${data.totalPrice}</span>
        </td>
      </tr>
    </table>

    <!-- Admin Dashboard CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td align="center" style="padding:16px 0;">
          <a href="${adminDashboardUrl}" style="display:inline-block;background-color:#d4a843;color:#0a0a0a;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">View in Admin Dashboard</a>
        </td>
      </tr>
    </table>
  `;

  const { success } = await sendAndLog({
    emailType: "admin_new_booking",
    from: `All Ways Transfers <${ENV.resendFromEmail}>`,
    to: [ADMIN_EMAIL],
    subject: `🔔 New Booking — ${data.referenceNumber} — ${data.clientName}`,
    html: wrapInTemplate(bodyContent),
    bookingReference: data.referenceNumber,
  });
  return success;
}

// ─── Admin Notification: Booking Cancelled ───

export async function sendAdminCancellationNotification(data: CancellationEmailData): Promise<boolean> {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    console.log(`[Email] Skipping admin cancellation notification in test environment for ${data.referenceNumber}`);
    return true;
  }
  const resend = getResend();

  const adminDashboardUrl = `${data.origin}/admin/bookings`;

  // Build cancellation policy text
  let policyText: string;
  let policyColor: string;
  if (data.cancellationTier === "free") {
    policyText = `Free cancellation — more than 24 hours before pickup.`;
    policyColor = "#22c55e";
  } else if (data.cancellationTier === "partial_charge") {
    const chargeAmount = (parseFloat(data.totalPrice) * data.chargePercent / 100).toFixed(2);
    policyText = `${data.chargePercent}% late cancellation fee ($${chargeAmount}) — less than 24 hours before pickup.`;
    policyColor = "#f59e0b";
  } else {
    policyText = `No refund — cancelled less than 4 hours before pickup.`;
    policyColor = "#ef4444";
  }

  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#ef4444;font-weight:700;">Booking Cancelled</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;">A client has cancelled their booking.</p>

    <!-- Reference Number -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#262626;border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Booking Reference</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#737373;letter-spacing:2px;text-decoration:line-through;">${data.referenceNumber}</p>
        </td>
      </tr>
    </table>

    <!-- Client Info -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Client Name</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.clientName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Client Email</span><br/>
          <span style="color:#e5e5e5;font-size:15px;"><a href="mailto:${data.clientEmail}" style="color:#d4a843;text-decoration:underline;">${data.clientEmail}</a></span>
        </td>
      </tr>
    </table>

    <!-- Cancellation Policy -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#262626;border-left:4px solid ${policyColor};border-radius:4px;padding:16px;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${policyColor};text-transform:uppercase;letter-spacing:0.5px;">Cancellation Policy Applied</p>
          <p style="margin:0;font-size:14px;color:#d4d4d4;">${policyText}</p>
        </td>
      </tr>
    </table>

    <!-- Booking Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Service</span><br/>
          <span style="color:#a3a3a3;font-size:15px;">${formatServiceType(data.serviceType)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Date &amp; Time</span><br/>
          <span style="color:#a3a3a3;font-size:15px;">${formatDate(data.pickupDate)} at ${formatTime(data.pickupDate)} (AEST)</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pickup</span><br/>
          <span style="color:#a3a3a3;font-size:15px;">${data.pickupAddress}</span>
        </td>
      </tr>
      ${data.dropoffAddress ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Drop-off</span><br/>
          <span style="color:#a3a3a3;font-size:15px;">${data.dropoffAddress}</span>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#a3a3a3;font-size:13px;">Original Total</span><br/>
          <span style="color:#a3a3a3;font-size:18px;font-weight:600;text-decoration:line-through;">$${data.totalPrice}</span>
        </td>
      </tr>
    </table>

    ${data.reason ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#a3a3a3;font-size:13px;">Client's Reason</span><br/>
          <span style="color:#d4d4d4;font-size:14px;">${data.reason}</span>
        </td>
      </tr>
    </table>` : ""}

    <!-- Admin Dashboard CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td align="center" style="padding:16px 0;">
          <a href="${adminDashboardUrl}" style="display:inline-block;background-color:#d4a843;color:#0a0a0a;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">View in Admin Dashboard</a>
        </td>
      </tr>
    </table>
  `;

  const { success } = await sendAndLog({
    emailType: "admin_cancellation",
    from: `All Ways Transfers <${ENV.resendFromEmail}>`,
    to: [ADMIN_EMAIL],
    subject: `❌ Booking Cancelled — ${data.referenceNumber} — ${data.clientName}`,
    html: wrapInTemplate(bodyContent),
    bookingReference: data.referenceNumber,
  });
  return success;
}

// ─── Password Reset Email ───

export interface PasswordResetEmailData {
  name: string;
  email: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    console.log(`[Email] Skipping password reset email in test environment for ${data.email}`);
    return true;
  }
  const resend = getResend();

  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#d4a843;font-weight:700;">Reset Your Password</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;">Hi ${data.name},</p>
    <p style="margin:0 0 16px;font-size:15px;color:#d4d4d4;">
      We received a request to reset the password for your All Ways Transfers account. Click the button below to set a new password:
    </p>

    <!-- Reset Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center" style="padding:16px 0;">
          <a href="${data.resetUrl}" style="display:inline-block;background-color:#d4a843;color:#0a0a0a;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:700;font-size:16px;">Reset Password</a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#a3a3a3;">
      This link will expire in <strong style="color:#d4d4d4;">${data.expiresInMinutes} minutes</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:13px;color:#a3a3a3;">
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>

    <!-- Fallback URL -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:1px solid #333;padding-top:16px;">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:11px;color:#737373;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="margin:0;font-size:11px;color:#525252;word-break:break-all;">${data.resetUrl}</p>
        </td>
      </tr>
    </table>
  `;

  const { success } = await sendAndLog({
    emailType: "password_reset",
    from: `All Ways Transfers <${ENV.resendFromEmail}>`,
    to: [data.email],
    subject: "Reset Your Password — All Ways Transfers",
    html: wrapInTemplate(bodyContent),
  });
  return success;
}

// ─── Payment Receipt Email ───

export interface PaymentReceiptEmailData {
  referenceNumber: string;
  clientName: string;
  clientEmail: string;
  serviceType: string;
  pickupAddress: string;
  dropoffAddress: string | null;
  pickupDate: number;
  passengerCount: number;
  vehicleName: string;
  totalPrice: string;
  paymentMethod: string;
  isPetFriendly?: boolean;
  numberOfPets?: number | null;
  petDescription?: string | null;
  publicHolidayName?: string | null;
  publicHolidaySurcharge?: string | null;
  routePreference?: string;
}

export async function sendPaymentReceiptEmail(data: PaymentReceiptEmailData): Promise<boolean> {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    console.log(`[Email] Skipping email send in test environment for ${data.referenceNumber}`);
    return true;
  }
  const resend = getResend();

  const paidAt = new Date().toLocaleString("en-AU", {
    timeZone: "Australia/Brisbane",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#d4a843;font-weight:700;">Payment Receipt</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;">Thank you for your payment, ${data.clientName}. Your transaction has been completed successfully.</p>

    <!-- Payment Confirmation Badge -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#1a3a1a;border:1px solid #2d5a2d;border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:14px;color:#4ade80;font-weight:600;">&#10003; Payment Successful</p>
          <p style="margin:0;font-size:12px;color:#86efac;">Processed on ${paidAt} (AEST)</p>
        </td>
      </tr>
    </table>

    <!-- Reference & Amount -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#262626;border-radius:8px;padding:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:0 0 12px;">
                <span style="color:#a3a3a3;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Booking Reference</span><br/>
                <span style="color:#d4a843;font-size:20px;font-weight:700;letter-spacing:2px;">${data.referenceNumber}</span>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #333;padding:12px 0 0;">
                <span style="color:#a3a3a3;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Amount Paid</span><br/>
                <span style="color:#4ade80;font-size:24px;font-weight:700;">$${data.totalPrice} AUD</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0 0;">
                <span style="color:#a3a3a3;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Payment Method</span><br/>
                <span style="color:#e5e5e5;font-size:15px;">${formatPaymentMethod(data.paymentMethod)}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Trip Summary -->
    <p style="margin:0 0 12px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Trip Summary</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Service</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatServiceType(data.serviceType)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Date &amp; Time</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatDate(data.pickupDate)} at ${formatTime(data.pickupDate)} (AEST)</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pickup</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.pickupAddress}</span>
        </td>
      </tr>
      ${data.dropoffAddress ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Drop-off</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.dropoffAddress}</span>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Vehicle</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.vehicleName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Passengers</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.passengerCount}</span>
        </td>
      </tr>
      ${data.isPetFriendly && data.numberOfPets ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pets</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.numberOfPets} pet${data.numberOfPets !== 1 ? "s" : ""}${data.petDescription ? ` — ${data.petDescription}` : ""}</span>
        </td>
      </tr>` : ""}
      ${data.publicHolidayName ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Public Holiday</span><br/>
          <span style="color:#d4a843;font-size:15px;">&#127881; ${data.publicHolidayName}${parseFloat(data.publicHolidaySurcharge ?? "0") > 0 ? ` — $${parseFloat(data.publicHolidaySurcharge!).toFixed(2)} surcharge` : ""}</span>
        </td>
      </tr>` : ""}
      ${data.routePreference && data.routePreference !== "fastest" ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Route Preference</span><br/>
          <span style="color:#22c55e;font-size:15px;">&#x1F6E3;&#xFE0F; Toll-Free Route</span>
        </td>
      </tr>` : data.routePreference === "fastest" ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Route Preference</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">&#x1F6E3;&#xFE0F; Fastest Route (may include toll roads)</span>
        </td>
      </tr>` : ""}
    </table>

    <!-- Note -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:#262626;border-radius:8px;padding:16px;">
          <p style="margin:0 0 4px;font-size:13px;color:#a3a3a3;">
            This email serves as your payment receipt. Please retain it for your records.
            If you have any questions about your booking or payment, please contact us at
            <a href="mailto:bookings@allwaystransfers.com.au" style="color:#d4a843;text-decoration:underline;">bookings@allwaystransfers.com.au</a>
            or call <strong style="color:#e5e5e5;">0466 544 068</strong>.
          </p>
        </td>
      </tr>
    </table>
  `;

  const adminEmail = ENV.adminEmail || "admin@allwaystransfers.com.au";
  const { success } = await sendAndLog({
    emailType: "payment_receipt",
    from: `All Ways Transfers <${ENV.resendFromEmail}>`,
    to: [data.clientEmail],
    bcc: [adminEmail],
    subject: `Payment Receipt — ${data.referenceNumber}`,
    html: wrapInTemplate(bodyContent),
    bookingReference: data.referenceNumber,
  });
  return success;
}

// ─── Quote Reminder Email ───

export interface QuoteReminderEmailData {
  referenceNumber: string;
  clientName: string;
  clientEmail: string;
  serviceType: string;
  pickupAddress: string;
  dropoffAddress: string | null;
  pickupDate: number;
  totalPrice: string;
  vehicleName: string;
  daysUntilExpiry: number;
  origin: string;
}

export async function sendQuoteReminderEmail(data: QuoteReminderEmailData): Promise<boolean> {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    console.log(`[Email] Skipping quote reminder in test environment for ${data.referenceNumber}`);
    return true;
  }

  const bookNowUrl = `${data.origin}/book?quote=${data.referenceNumber}`;
  const cancelUrl = `${data.origin}/my-bookings?cancelQuote=${data.referenceNumber}`;

  const urgencyText = data.daysUntilExpiry <= 3
    ? `<span style="color:#ef4444;font-weight:700;">expires in ${data.daysUntilExpiry} day${data.daysUntilExpiry !== 1 ? "s" : ""}</span>`
    : `expires in ${data.daysUntilExpiry} days`;

  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#d4a843;font-weight:700;">Quote Reminder</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;">Hi ${data.clientName}, your quote ${urgencyText}. Don't miss out!</p>

    <!-- Reference Number -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#262626;border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Quote Reference</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#d4a843;letter-spacing:2px;">${data.referenceNumber}</p>
        </td>
      </tr>
    </table>

    <!-- Quote Summary -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Service</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatServiceType(data.serviceType)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Date &amp; Time</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatDate(data.pickupDate)} at ${formatTime(data.pickupDate)} (AEST)</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Pickup</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.pickupAddress}</span>
        </td>
      </tr>
      ${data.dropoffAddress ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Drop-off</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.dropoffAddress}</span>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Vehicle</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${data.vehicleName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;">
          <span style="color:#a3a3a3;font-size:13px;">Estimated Total</span><br/>
          <span style="color:#d4a843;font-size:22px;font-weight:700;">$${data.totalPrice}</span>
        </td>
      </tr>
    </table>

    <!-- Time Slot Disclaimer -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#2a2318;border-left:3px solid #d4a843;border-radius:4px;padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:#d4a843;font-weight:600;margin-bottom:6px;">Please Note</p>
          <p style="margin:0;font-size:13px;color:#a3a3a3;line-height:1.5;">This quote does not constitute a confirmed reservation. The requested time slot remains subject to availability and may be allocated to another client prior to booking confirmation. To secure your preferred date and time, we recommend confirming your booking at your earliest convenience. Should your requested time slot become unavailable, our team will work with you to arrange a suitable alternative.</p>
        </td>
      </tr>
    </table>

    <!-- Book Now CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td align="center" style="padding:16px 0;">
          <a href="${bookNowUrl}" style="display:inline-block;background-color:#d4a843;color:#0a0a0a;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:700;font-size:16px;">Book Now</a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 24px;font-size:13px;color:#737373;text-align:center;">
      Click the button above to confirm your booking using quote reference <strong style="color:#d4a843;">${data.referenceNumber}</strong>.
    </p>

    <!-- Cancel Quote link -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0;">
          <p style="margin:0;font-size:13px;color:#737373;">
            No longer interested?
            <a href="${cancelUrl}" style="color:#a3a3a3;text-decoration:underline;">Cancel this quote</a>
          </p>
        </td>
      </tr>
    </table>
  `;

  const { success } = await sendAndLog({
    emailType: "quote_reminder",
    from: `All Ways Transfers <${ENV.resendFromEmail}>`,
    to: [data.clientEmail],
    subject: `Reminder: Your Quote ${data.referenceNumber} — ${data.daysUntilExpiry} day${data.daysUntilExpiry !== 1 ? "s" : ""} left`,
    html: wrapInTemplate(bodyContent),
    bookingReference: data.referenceNumber,
  });
  return success;
}

// ─── Quote Expired Notification Email ───

export interface QuoteExpiredEmailData {
  referenceNumber: string;
  clientName: string;
  clientEmail: string;
  serviceType: string;
  pickupDate: number;
  origin: string;
}

export async function sendQuoteExpiredEmail(data: QuoteExpiredEmailData): Promise<boolean> {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    console.log(`[Email] Skipping quote expired email in test environment for ${data.referenceNumber}`);
    return true;
  }

  const contactUrl = `${data.origin}/contact`;

  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#ef4444;font-weight:700;">Quote Expired</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;">Hi ${data.clientName}, your quote has expired as the pickup date is approaching.</p>

    <!-- Reference Number -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#262626;border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Expired Quote</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#737373;letter-spacing:2px;">${data.referenceNumber}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #333;">
          <span style="color:#a3a3a3;font-size:13px;">Service</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatServiceType(data.serviceType)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#a3a3a3;font-size:13px;">Pickup Date</span><br/>
          <span style="color:#e5e5e5;font-size:15px;">${formatDate(data.pickupDate)} at ${formatTime(data.pickupDate)} (AEST)</span>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px;font-size:14px;color:#a3a3a3;text-align:center;">
      If you'd still like to book a transfer, please contact us and we'll be happy to help.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:16px 0;">
          <a href="${contactUrl}" style="display:inline-block;background-color:#d4a843;color:#0a0a0a;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:700;font-size:16px;">Contact Us</a>
        </td>
      </tr>
    </table>
  `;

  const { success } = await sendAndLog({
    emailType: "quote_expired",
    from: `All Ways Transfers <${ENV.resendFromEmail}>`,
    to: [data.clientEmail],
    subject: `Quote Expired — ${data.referenceNumber}`,
    html: wrapInTemplate(bodyContent),
    bookingReference: data.referenceNumber,
  });
  return success;
}
