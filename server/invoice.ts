import PDFDocument from "pdfkit";
import type { Booking } from "../drizzle/schema";
import { getBankDetails } from "./db";
import { readFile } from "fs/promises";
import { join } from "path";

const LOGO_PATH = join(process.cwd(), "client/public/logo.png");

// Cache the logo buffer so we only read once
let cachedLogoBuffer: Buffer | null = null;

async function fetchLogoBuffer(): Promise<Buffer | null> {
  if (cachedLogoBuffer) return cachedLogoBuffer;
  try {
    const buffer = await readFile(LOGO_PATH);
    cachedLogoBuffer = buffer;
    return buffer;
  } catch (err) {
    console.error("[Invoice] Failed to read logo:", err);
    return null;
  }
}

// ─── Helpers ───

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-AU", {
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
    stripe_prepay: "Credit Card",
    square_postpay: "Pay Driver (Card)",
    cash_postpay: "Pay Driver (Cash)",
    direct_deposit: "Bank Transfer",
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

// ─── Colors ───
const GOLD = "#C4952E";
const DARK_BG = "#1A1A1A";
const MUTED_TEXT = "#A3A3A3";
const GREEN = "#16A34A";
const RED = "#EF4444";

/**
 * Generate a compact single-page invoice PDF for a booking.
 * Returns a Buffer containing the PDF data.
 */
interface InvoiceOptions {
  footerMessage?: string | null;
  abn?: string | null;
  invoiceNumber?: string | null;
}

export async function generateInvoicePDF(booking: Booking, options?: InvoiceOptions | string | null): Promise<Buffer> {
  // Backward compatibility: accept string as footerMessage
  const opts: InvoiceOptions = typeof options === "string" || options === null || options === undefined
    ? { footerMessage: options as string | null | undefined }
    : options;
  const abnValue = opts.abn?.trim() || "18 715 944 056";
  const footerMessage = opts.footerMessage;
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 30, bottom: 30, left: 40, right: 40 },
        info: {
          Title: `Invoice - ${booking.referenceNumber}`,
          Author: "All Ways Transfers",
          Subject: `Booking Invoice ${booking.referenceNumber}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const L = 40; // left margin
      const R = doc.page.width - 40; // right edge
      const pageWidth = R - L;
      let y = 30;

      // ─── Compact Header ───
      const logoBuffer = await fetchLogoBuffer();
      if (logoBuffer) {
        doc.image(logoBuffer, L, y, { width: 50, height: 50 });
      }

      const textX = logoBuffer ? L + 56 : L;
      doc.fontSize(13).fillColor(DARK_BG).font("Helvetica-Bold");
      doc.text("All Ways Transfers", textX, y + 4);
      doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text(`0466 544 068 | bookings@allwaystransfers.com.au | ABN: ${abnValue}`, textX, y + 20);
      doc.text("Queensland, Australia", textX, y + 30);

      // TAX INVOICE right-aligned
      doc.fontSize(14).fillColor(GOLD).font("Helvetica-Bold");
      doc.text("TAX INVOICE", R - 140, y + 2, { width: 140, align: "right" });
      doc.fontSize(8).fillColor(MUTED_TEXT).font("Helvetica");
      const headerDate = new Date().toLocaleDateString("en-AU", {
        day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Brisbane",
      });
      doc.text(headerDate, R - 140, y + 20, { width: 140, align: "right" });

      // Gold divider
      y += 56;
      doc.moveTo(L, y).lineTo(R, y).strokeColor(GOLD).lineWidth(1.5).stroke();
      y += 10;

      // ─── Invoice Meta (4-column layout) ───
      const colWidth = pageWidth / 4;
      const col1X = L;
      const col2X = L + colWidth;
      const col3X = L + colWidth * 2;
      const col4X = L + colWidth * 3;

      // Invoice number (INV-XXXX) or fallback to booking reference
      const invoiceNum = opts.invoiceNumber || (booking as any).invoiceNumber || null;
      doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("INVOICE #", col1X, y);
      doc.fontSize(10).fillColor(GOLD).font("Helvetica-Bold");
      doc.text(invoiceNum || booking.referenceNumber, col1X, y + 10, { width: colWidth - 5 });

      // Show booking reference separately if we have a distinct invoice number
      if (invoiceNum) {
        doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
        doc.text("BOOKING REF", col2X, y);
        doc.fontSize(8).fillColor("#333333").font("Helvetica-Bold");
        doc.text(booking.referenceNumber, col2X, y + 10, { width: colWidth - 5 });
      }

      doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("STATUS", col3X, y);
      doc.fontSize(9).fillColor("#333333").font("Helvetica-Bold");
      doc.text(booking.status.charAt(0).toUpperCase() + booking.status.slice(1), col3X, y + 10, { width: colWidth - 5 });

      doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("PICKUP", col4X, y);
      doc.fontSize(9).fillColor("#333333").font("Helvetica");
      doc.text(`${formatDate(booking.pickupDate)} at ${formatTime(booking.pickupDate)}`, col4X, y + 10, { width: colWidth - 5 });

      y += 28;

      // Thin divider
      doc.moveTo(L, y).lineTo(R, y).strokeColor("#E5E5E5").lineWidth(0.5).stroke();
      y += 8;

      // ─── Client + Service in 2 columns ───
      const col1W = pageWidth * 0.38;
      const svcColX = L + col1W + 15;
      const col2W = pageWidth - col1W - 15;

      // Client column
      doc.fontSize(8).fillColor(GOLD).font("Helvetica-Bold");
      doc.text("CLIENT", L, y);
      let cy = y + 12;

      const clientRows: [string, string][] = [
        ["Name", booking.clientName],
        ["Email", booking.clientEmail],
        ["Phone", booking.clientPhone],
      ];
      for (const [label, value] of clientRows) {
        doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
        doc.text(label, L, cy, { width: 40 });
        doc.fontSize(8).fillColor("#333333").font("Helvetica");
        doc.text(value, L + 42, cy, { width: col1W - 42 });
        cy += 13;
      }

      // Service column
      doc.fontSize(8).fillColor(GOLD).font("Helvetica-Bold");
      doc.text("SERVICE", svcColX, y);
      let sy = y + 12;

      const serviceRows: [string, string][] = [
        ["Type", formatServiceType(booking.serviceType)],
        ["From", booking.pickupAddress],
      ];
      if (booking.dropoffAddress) {
        serviceRows.push(["To", booking.dropoffAddress]);
      }

      // Additional stops (compact)
      if (booking.additionalPickupCount > 0 && booking.additionalPickupAddresses) {
        try {
          const addrs = JSON.parse(booking.additionalPickupAddresses);
          serviceRows.push([`+${booking.additionalPickupCount} pickup`, addrs.join("; ")]);
        } catch { /* ignore */ }
      }
      if (booking.additionalDropoffCount > 0 && booking.additionalDropoffAddresses) {
        try {
          const addrs = JSON.parse(booking.additionalDropoffAddresses);
          serviceRows.push([`+${booking.additionalDropoffCount} dropoff`, addrs.join("; ")]);
        } catch { /* ignore */ }
      }

      serviceRows.push(["Vehicle", booking.vehicleName]);
      const paxText = (booking.babyCount ?? 0) > 0
        ? `${booking.passengerCount} (incl. ${booking.babyCount} baby/toddler${booking.babyCount !== 1 ? "s" : ""})`
        : String(booking.passengerCount);
      serviceRows.push(["Pax", paxText]);

      // Luggage
      if (booking.luggageCount > 0) {
        const luggageText = booking.strollerCount > 0
          ? `${booking.luggageCount} (incl. ${booking.strollerCount} stroller${booking.strollerCount !== 1 ? "s" : ""})`
          : String(booking.luggageCount);
        serviceRows.push(["Luggage", luggageText]);
      }

      // Child seats (compact)
      const childSeats: string[] = [];
      if (booking.rearFacingSeats > 0) childSeats.push(`${booking.rearFacingSeats}× Rear`);
      if (booking.forwardFacingSeats > 0) childSeats.push(`${booking.forwardFacingSeats}× Fwd`);
      if (booking.boosterSeats > 0) childSeats.push(`${booking.boosterSeats}× Boost`);
      if (childSeats.length > 0) {
        serviceRows.push(["Seats", childSeats.join(", ")]);
      }

      // Pets
      if (booking.isPetFriendly === 1 && booking.numberOfPets) {
        const petText = `${booking.numberOfPets} pet${booking.numberOfPets !== 1 ? "s" : ""}${booking.petDescription ? ` — ${booking.petDescription}` : ""}`;
        serviceRows.push(["Pets", petText]);
      }

      // Freight (compact)
      if (booking.freightDescription) {
        serviceRows.push(["Freight", booking.freightDescription]);
      }

      for (const [label, value] of serviceRows) {
        doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
        doc.text(label, svcColX, sy, { width: 55 });
        doc.fontSize(8).fillColor("#333333").font("Helvetica");
        const h = doc.heightOfString(value, { width: col2W - 58 });
        doc.text(value, svcColX + 58, sy, { width: col2W - 58 });
        sy += Math.max(13, h + 4);
      }

      // Special requests (full width, below both columns)
      y = Math.max(cy, sy) + 4;

      if (booking.specialRequests) {
        doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
        doc.text("Special Requests:", L, y);
        doc.fontSize(8).fillColor("#555").font("Helvetica-Oblique");
        const reqH = doc.heightOfString(booking.specialRequests, { width: pageWidth - 90 });
        doc.text(booking.specialRequests, L + 90, y, { width: pageWidth - 90 });
        y += Math.max(13, reqH + 4);
      }

      y += 4;

      // ─── Divider ───
      doc.moveTo(L, y).lineTo(R, y).strokeColor("#E5E5E5").lineWidth(0.5).stroke();
      y += 8;

      // ─── Total Box (no detailed breakdown) ───
      const totalPrice = parseFloat(String(booking.totalPrice));
      doc.rect(L, y, pageWidth, 28).fill("#FFF8E7");
      doc.rect(L, y, pageWidth, 28).strokeColor(GOLD).lineWidth(0.5).stroke();
      doc.fontSize(10).fillColor("#333333").font("Helvetica-Bold");
      doc.text("TOTAL (AUD)", L + 10, y + 8);
      doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica-Oblique");
      doc.text("incl. GST", L + 110, y + 10);
      doc.fontSize(13).fillColor(GOLD).font("Helvetica-Bold");
      doc.text(`$${totalPrice.toFixed(2)}`, R - 130, y + 6, { width: 120, align: "right" });
      y += 36;

      // ─── Payment Info (compact inline) ───
      doc.fontSize(8).fillColor(GOLD).font("Helvetica-Bold");
      doc.text("PAYMENT", L, y);
      y += 12;

      doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("Method", L, y, { width: 40 });
      doc.fontSize(8).fillColor("#333333").font("Helvetica");
      doc.text(formatPaymentMethod(booking.paymentMethod), L + 42, y);

      doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("Status", L + 200, y, { width: 40 });
      const statusColor = booking.paymentStatus === "paid" ? GREEN : booking.paymentStatus === "refunded" ? "#6366F1" : RED;
      doc.fontSize(8).fillColor(statusColor).font("Helvetica-Bold");
      doc.text(formatPaymentStatus(booking.paymentStatus), L + 240, y);
      y += 16;

      // Bank details for all unpaid invoices so clients know where to send payment
      if (booking.paymentStatus === "unpaid") {
        const bankDetails = await getBankDetails();
        if (bankDetails) {
          doc.rect(L, y, pageWidth, 55).fill("#F0FDF4");
          doc.rect(L, y, pageWidth, 55).strokeColor("#BBF7D0").lineWidth(0.5).stroke();
          let by = y + 6;

          doc.fontSize(8).fillColor(GREEN).font("Helvetica-Bold");
          doc.text("Bank Transfer Details", L + 8, by);
          by += 12;

          doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
          doc.text(`Bank: `, L + 8, by);
          doc.fillColor("#333").font("Helvetica-Bold").text(bankDetails.bankName, L + 40, by);
          doc.fillColor(MUTED_TEXT).font("Helvetica").text(`BSB: `, L + 180, by);
          doc.fillColor("#333").font("Helvetica-Bold").text(bankDetails.bsb, L + 205, by);
          doc.fillColor(MUTED_TEXT).font("Helvetica").text(`Acc: `, L + 280, by);
          doc.fillColor("#333").font("Helvetica-Bold").text(bankDetails.accountNumber, L + 305, by);
          by += 12;

          doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
          doc.text(`Name: `, L + 8, by);
          doc.fillColor("#333").font("Helvetica-Bold").text(bankDetails.accountName, L + 40, by);
          doc.fillColor(MUTED_TEXT).font("Helvetica").text(`Ref: `, L + 280, by);
          doc.fillColor(GOLD).font("Helvetica-Bold").text(booking.referenceNumber, L + 305, by);

          y += 60;
        }
      }

      // ─── Custom Footer Message (thank-you box) ───
      if (footerMessage && footerMessage.trim()) {
        y += 4;
        const textWidth = pageWidth - 16;
        const textHeight = doc.fontSize(7).heightOfString(footerMessage.trim(), { width: textWidth });
        const boxHeight = textHeight + 12;

        doc.roundedRect(L, y, pageWidth, boxHeight, 3).fill("#FFFBEB");
        doc.roundedRect(L, y, pageWidth, boxHeight, 3).strokeColor("#F5E6B8").lineWidth(0.5).stroke();
        doc.fontSize(7).fillColor("#78600D").font("Helvetica-Oblique");
        doc.text(footerMessage.trim(), L + 8, y + 6, { width: textWidth, align: "center" });
        y += boxHeight + 6;
      }

      // ─── "Rate Us" Button (immediately after thank-you message) ───
      const reviewUrl = "https://allwaystransfers.com.au/#testimonials";
      y += 4;
      const btnText = "Please rate your experience with us";
      const btnWidth = 220;
      const btnHeight = 22;
      const btnX = L + (pageWidth - btnWidth) / 2;

      // Gold button background
      doc.roundedRect(btnX, y, btnWidth, btnHeight, 4).fill(GOLD);
      // White text centred in button
      doc.fontSize(8).fillColor("#FFFFFF").font("Helvetica-Bold");
      doc.text(btnText, btnX, y + 6, {
        width: btnWidth,
        align: "center",
        link: reviewUrl,
      });
      y += btnHeight + 12;

      // ─── Standard Footer (positioned after content, not absolute bottom) ───
      // Add a small gap then draw the footer line
      y += 8;
      doc.moveTo(L, y).lineTo(R, y).strokeColor("#E5E5E5").lineWidth(0.5).stroke();
      doc.fontSize(6.5).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text(`All Ways Transfers | ABN ${abnValue} | Queensland, Australia | 0466 544 068 | bookings@allwaystransfers.com.au`, L, y + 6, {
        width: pageWidth, align: "center", lineBreak: false,
      });
      doc.fontSize(6).fillColor("#CCCCCC").font("Helvetica");
      doc.text(`Generated ${new Date().toLocaleString("en-AU", { timeZone: "Australia/Brisbane", dateStyle: "medium", timeStyle: "short" })} (AEST)`, L, y + 17, {
        width: pageWidth, align: "center", lineBreak: false,
      });

      // ─── Payment Status Watermark (large, across the page) ───
      const wmText = booking.paymentStatus === "paid" ? "PAID" : booking.paymentStatus === "unpaid" ? "AWAITING PAYMENT" : null;
      const wmColor = booking.paymentStatus === "paid" ? GREEN : "#E11D48";
      if (wmText) {
        const wmFontSize = wmText === "PAID" ? 140 : 72;
        // Draw on the first (and only) page without creating a new one
        const pages = doc.bufferedPageRange();
        doc.switchToPage(pages.start);
        doc.save();
        const cx = doc.page.width / 2;
        const wmCy = doc.page.height / 2;
        doc.translate(cx, wmCy);
        doc.rotate(-35, { origin: [0, 0] });
        doc.fontSize(wmFontSize).fillColor(wmColor).fillOpacity(0.10).font("Helvetica-Bold");
        doc.text(wmText, -300, -40, { width: 600, align: "center" });
        doc.restore();
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a quote PDF for a booking in "quote" status.
 * Returns a Buffer containing the PDF data.
 */
interface QuoteOptions {
  footerMessage?: string | null;
  abn?: string | null;
  quoteValidDays?: number; // Default 7 days
}

export async function generateQuotePDF(booking: Booking, options?: QuoteOptions): Promise<Buffer> {
  const opts: QuoteOptions = options || {};
  const abnValue = opts.abn?.trim() || "18 715 944 056";
  const footerMessage = opts.footerMessage;
  const validDays = opts.quoteValidDays ?? 7;
  
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 30, bottom: 30, left: 40, right: 40 },
        info: {
          Title: `Quote - ${booking.referenceNumber}`,
          Author: "All Ways Transfers",
          Subject: `Booking Quote ${booking.referenceNumber}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const L = 40; // left margin
      const R = doc.page.width - 40; // right edge
      const pageWidth = R - L;
      let y = 30;

      // ─── Compact Header ───
      const logoBuffer = await fetchLogoBuffer();
      if (logoBuffer) {
        doc.image(logoBuffer, L, y, { width: 50, height: 50 });
      }

      const textX = logoBuffer ? L + 56 : L;
      doc.fontSize(13).fillColor(DARK_BG).font("Helvetica-Bold");
      doc.text("All Ways Transfers", textX, y + 4);
      doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text(`0466 544 068 | bookings@allwaystransfers.com.au | ABN: ${abnValue}`, textX, y + 20);
      doc.text("Queensland, Australia", textX, y + 30);

      // QUOTE right-aligned
      doc.fontSize(14).fillColor(GOLD).font("Helvetica-Bold");
      doc.text("QUOTE", R - 140, y + 2, { width: 140, align: "right" });
      doc.fontSize(8).fillColor(MUTED_TEXT).font("Helvetica");
      const headerDate = new Date().toLocaleDateString("en-AU", {
        day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Brisbane",
      });
      doc.text(headerDate, R - 140, y + 20, { width: 140, align: "right" });

      // Gold divider
      y += 56;
      doc.moveTo(L, y).lineTo(R, y).strokeColor(GOLD).lineWidth(1.5).stroke();
      y += 10;

      // ─── Quote Meta (3-column layout) ───
      const colWidth = pageWidth / 3;
      const col1X = L;
      const col2X = L + colWidth;
      const col3X = L + colWidth * 2;

      doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("QUOTE #", col1X, y);
      doc.fontSize(10).fillColor(GOLD).font("Helvetica-Bold");
      doc.text(booking.referenceNumber, col1X, y + 10, { width: colWidth - 5 });

      doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("PICKUP DATE", col2X, y);
      doc.fontSize(9).fillColor("#333333").font("Helvetica");
      doc.text(`${formatDate(booking.pickupDate)} at ${formatTime(booking.pickupDate)}`, col2X, y + 10, { width: colWidth - 5 });

      // Quote expiry
      const expiryDate = new Date(booking.pickupDate);
      expiryDate.setDate(expiryDate.getDate() - validDays);
      const expiryTimestamp = expiryDate.getTime();
      
      doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("VALID UNTIL", col3X, y);
      doc.fontSize(9).fillColor("#E11D48").font("Helvetica-Bold");
      doc.text(formatDate(expiryTimestamp), col3X, y + 10, { width: colWidth - 5 });

      y += 28;

      // Thin divider
      doc.moveTo(L, y).lineTo(R, y).strokeColor("#E5E5E5").lineWidth(0.5).stroke();
      y += 8;

      // ─── Client + Service in 2 columns ───
      const col1W = pageWidth * 0.38;
      const svcColX = L + col1W + 15;
      const col2W = pageWidth - col1W - 15;

      // Client column
      doc.fontSize(8).fillColor(GOLD).font("Helvetica-Bold");
      doc.text("CLIENT", L, y);
      let cy = y + 12;

      const clientRows: [string, string][] = [
        ["Name", booking.clientName],
        ["Email", booking.clientEmail],
        ["Phone", booking.clientPhone],
      ];
      for (const [label, value] of clientRows) {
        doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
        doc.text(label, L, cy, { width: 40 });
        doc.fontSize(8).fillColor("#333333").font("Helvetica");
        doc.text(value, L + 42, cy, { width: col1W - 42 });
        cy += 13;
      }

      // Service column
      doc.fontSize(8).fillColor(GOLD).font("Helvetica-Bold");
      doc.text("SERVICE", svcColX, y);
      let sy = y + 12;

      const serviceRows: [string, string][] = [
        ["Type", formatServiceType(booking.serviceType)],
        ["From", booking.pickupAddress],
      ];
      if (booking.dropoffAddress) {
        serviceRows.push(["To", booking.dropoffAddress]);
      }

      // Additional stops (compact)
      if (booking.additionalPickupCount > 0 && booking.additionalPickupAddresses) {
        try {
          const addrs = JSON.parse(booking.additionalPickupAddresses);
          serviceRows.push([`+${booking.additionalPickupCount} pickup`, addrs.join("; ")]);
        } catch { /* ignore */ }
      }
      if (booking.additionalDropoffCount > 0 && booking.additionalDropoffAddresses) {
        try {
          const addrs = JSON.parse(booking.additionalDropoffAddresses);
          serviceRows.push([`+${booking.additionalDropoffCount} dropoff`, addrs.join("; ")]);
        } catch { /* ignore */ }
      }

      serviceRows.push(["Vehicle", booking.vehicleName]);
      const paxText = (booking.babyCount ?? 0) > 0
        ? `${booking.passengerCount} (incl. ${booking.babyCount} baby/toddler${booking.babyCount !== 1 ? "s" : ""})`
        : String(booking.passengerCount);
      serviceRows.push(["Pax", paxText]);

      // Luggage
      if (booking.luggageCount > 0) {
        const luggageText = booking.strollerCount > 0
          ? `${booking.luggageCount} (incl. ${booking.strollerCount} stroller${booking.strollerCount !== 1 ? "s" : ""})`
          : String(booking.luggageCount);
        serviceRows.push(["Luggage", luggageText]);
      }

      // Child seats (compact)
      const childSeats: string[] = [];
      if (booking.rearFacingSeats > 0) childSeats.push(`${booking.rearFacingSeats}× Rear`);
      if (booking.forwardFacingSeats > 0) childSeats.push(`${booking.forwardFacingSeats}× Fwd`);
      if (booking.boosterSeats > 0) childSeats.push(`${booking.boosterSeats}× Boost`);
      if (childSeats.length > 0) {
        serviceRows.push(["Seats", childSeats.join(", ")]);
      }

      // Pets
      if (booking.isPetFriendly === 1 && booking.numberOfPets) {
        const petText = `${booking.numberOfPets} pet${booking.numberOfPets !== 1 ? "s" : ""}${booking.petDescription ? ` — ${booking.petDescription}` : ""}`;
        serviceRows.push(["Pets", petText]);
      }

      // Freight (compact)
      if (booking.freightDescription) {
        serviceRows.push(["Freight", booking.freightDescription]);
      }

      for (const [label, value] of serviceRows) {
        doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
        doc.text(label, svcColX, sy, { width: 55 });
        doc.fontSize(8).fillColor("#333333").font("Helvetica");
        const h = doc.heightOfString(value, { width: col2W - 58 });
        doc.text(value, svcColX + 58, sy, { width: col2W - 58 });
        sy += Math.max(13, h + 4);
      }

      // Special requests (full width, below both columns)
      y = Math.max(cy, sy) + 4;

      if (booking.specialRequests) {
        doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
        doc.text("Special Requests:", L, y);
        doc.fontSize(8).fillColor("#555").font("Helvetica-Oblique");
        const reqH = doc.heightOfString(booking.specialRequests, { width: pageWidth - 90 });
        doc.text(booking.specialRequests, L + 90, y, { width: pageWidth - 90 });
        y += Math.max(13, reqH + 4);
      }

      y += 4;

      // ─── Divider ───
      doc.moveTo(L, y).lineTo(R, y).strokeColor("#E5E5E5").lineWidth(0.5).stroke();
      y += 8;

      // ─── Estimated Total Box ───
      const totalPrice = parseFloat(String(booking.totalPrice));
      doc.rect(L, y, pageWidth, 28).fill("#FFF8E7");
      doc.rect(L, y, pageWidth, 28).strokeColor(GOLD).lineWidth(0.5).stroke();
      doc.fontSize(10).fillColor("#333333").font("Helvetica-Bold");
      doc.text("ESTIMATED TOTAL (AUD)", L + 10, y + 8);
      doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica-Oblique");
      doc.text("incl. GST", L + 155, y + 10);
      doc.fontSize(13).fillColor(GOLD).font("Helvetica-Bold");
      doc.text(`$${totalPrice.toFixed(2)}`, R - 130, y + 6, { width: 120, align: "right" });
      y += 36;

      // ─── Quote Terms Box ───
      doc.rect(L, y, pageWidth, 45).fill("#F0F9FF");
      doc.rect(L, y, pageWidth, 45).strokeColor("#BAE6FD").lineWidth(0.5).stroke();
      let ty = y + 6;

      doc.fontSize(8).fillColor("#0369A1").font("Helvetica-Bold");
      doc.text("Quote Terms", L + 8, ty);
      ty += 12;

      doc.fontSize(7).fillColor("#555").font("Helvetica");
      doc.text("• This quote is valid until " + formatDate(expiryTimestamp), L + 8, ty);
      ty += 10;
      doc.text("• Final price may vary based on actual distance, time, and any additional stops", L + 8, ty);
      ty += 10;
      doc.text("• To confirm your booking, please accept this quote and complete payment", L + 8, ty);

      y += 50;

      // ─── Custom Footer Message ───
      if (footerMessage && footerMessage.trim()) {
        y += 4;
        const textWidth = pageWidth - 16;
        const textHeight = doc.fontSize(7).heightOfString(footerMessage.trim(), { width: textWidth });
        const boxHeight = textHeight + 12;

        doc.roundedRect(L, y, pageWidth, boxHeight, 3).fill("#FFFBEB");
        doc.roundedRect(L, y, pageWidth, boxHeight, 3).strokeColor("#F5E6B8").lineWidth(0.5).stroke();
        doc.fontSize(7).fillColor("#78600D").font("Helvetica-Oblique");
        doc.text(footerMessage.trim(), L + 8, y + 6, { width: textWidth, align: "center" });
        y += boxHeight + 6;
      }

      // ─── "Accept Quote" Button ───
      const quoteUrl = `https://allwaystransfers.com.au/booking/${booking.referenceNumber}`;
      y += 4;
      const btnText = "Accept Quote & Confirm Booking";
      const btnWidth = 240;
      const btnHeight = 22;
      const btnX = L + (pageWidth - btnWidth) / 2;

      // Gold button background
      doc.roundedRect(btnX, y, btnWidth, btnHeight, 4).fill(GOLD);
      // White text centred in button
      doc.fontSize(8).fillColor("#FFFFFF").font("Helvetica-Bold");
      doc.text(btnText, btnX, y + 6, {
        width: btnWidth,
        align: "center",
        link: quoteUrl,
      });
      y += btnHeight + 12;

      // ─── Standard Footer (positioned after content, not absolute bottom) ───
      y += 8;
      doc.moveTo(L, y).lineTo(R, y).strokeColor("#E5E5E5").lineWidth(0.5).stroke();
      doc.fontSize(6.5).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text(`All Ways Transfers | ABN ${abnValue} | Queensland, Australia | 0466 544 068 | bookings@allwaystransfers.com.au`, L, y + 6, {
        width: pageWidth, align: "center", lineBreak: false,
      });
      doc.fontSize(6).fillColor("#CCCCCC").font("Helvetica");
      doc.text(`Generated ${new Date().toLocaleString("en-AU", { timeZone: "Australia/Brisbane", dateStyle: "medium", timeStyle: "short" })} (AEST)`, L, y + 17, {
        width: pageWidth, align: "center", lineBreak: false,
      });

      // ─── "QUOTE" Watermark (large, across the page) ───
      const wmText = "QUOTE";
      const wmColor = "#9333EA"; // Purple for quotes
      const wmFontSize = 140;
      const pages = doc.bufferedPageRange();
      doc.switchToPage(pages.start);
      doc.save();
      const cx = doc.page.width / 2;
      const wmCy = doc.page.height / 2;
      doc.translate(cx, wmCy);
      doc.rotate(-35, { origin: [0, 0] });
      doc.fontSize(wmFontSize).fillColor(wmColor).fillOpacity(0.08).font("Helvetica-Bold");
      doc.text(wmText, -300, -40, { width: 600, align: "center" });
      doc.restore();

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
