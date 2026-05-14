import PDFDocument from "pdfkit";
import type { Booking } from "../drizzle/schema";
import { getBankDetails } from "./db";
import https from "https";
import http from "http";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663486426022/jlnrNxKOAAbakZcE.png";

// Cache the logo buffer so we only download once
let cachedLogoBuffer: Buffer | null = null;

async function fetchLogoBuffer(): Promise<Buffer | null> {
  if (cachedLogoBuffer) return cachedLogoBuffer;
  try {
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const client = LOGO_URL.startsWith("https") ? https : http;
      client.get(LOGO_URL, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch logo: ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      }).on("error", reject);
    });
    cachedLogoBuffer = buffer;
    return buffer;
  } catch (err) {
    console.error("[Invoice] Failed to fetch logo:", err);
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

      // ─── Invoice Meta (2-column compact) ───
      const midX = L + pageWidth / 2 + 10;

      // Invoice number (INV-XXXX) or fallback to booking reference
      const invoiceNum = opts.invoiceNumber || (booking as any).invoiceNumber || null;
      doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("INVOICE #", L, y);
      doc.fontSize(10).fillColor(GOLD).font("Helvetica-Bold");
      doc.text(invoiceNum || booking.referenceNumber, L, y + 10);

      // Show booking reference separately if we have a distinct invoice number
      if (invoiceNum) {
        doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
        doc.text("BOOKING REF", L + 80, y);
        doc.fontSize(9).fillColor("#333333").font("Helvetica-Bold");
        doc.text(booking.referenceNumber, L + 80, y + 10);
      }

      doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("STATUS", L + 140, y);
      doc.fontSize(9).fillColor("#333333").font("Helvetica-Bold");
      doc.text(booking.status.charAt(0).toUpperCase() + booking.status.slice(1), L + 140, y + 10);

      doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("PICKUP", midX, y);
      doc.fontSize(9).fillColor("#333333").font("Helvetica");
      doc.text(`${formatDate(booking.pickupDate)} at ${formatTime(booking.pickupDate)}`, midX, y + 10);

      y += 28;

      // Thin divider
      doc.moveTo(L, y).lineTo(R, y).strokeColor("#E5E5E5").lineWidth(0.5).stroke();
      y += 8;

      // ─── Client + Service in 2 columns ───
      const col1W = pageWidth * 0.38;
      const col2X = L + col1W + 15;
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
      doc.text("SERVICE", col2X, y);
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
      serviceRows.push(["Pax", String(booking.passengerCount)]);

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
        doc.text(label, col2X, sy, { width: 55 });
        doc.fontSize(8).fillColor("#333333").font("Helvetica");
        const h = doc.heightOfString(value, { width: col2W - 58 });
        doc.text(value, col2X + 58, sy, { width: col2W - 58 });
        sy += Math.max(13, h + 4);
      }

      // Special requests (full width, below both columns)
      y = Math.max(cy, sy) + 4;

      if (booking.specialRequests) {
        doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica");
        doc.text("Special Requests:", L, y);
        doc.fontSize(8).fillColor("#555").font("Helvetica-Oblique");
        const reqH = doc.heightOfString(booking.specialRequests, { width: pageWidth });
        doc.text(booking.specialRequests, L + 80, y, { width: pageWidth - 80 });
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

      // ─── Custom Footer Message ───
      if (footerMessage && footerMessage.trim()) {
        y += 4;
        const textWidth = pageWidth - 16;
        const textHeight = doc.fontSize(7).heightOfString(footerMessage.trim(), { width: textWidth });
        const boxHeight = textHeight + 12;

        doc.roundedRect(L, y, pageWidth, boxHeight, 3).fill("#FFFBEB");
        doc.roundedRect(L, y, pageWidth, boxHeight, 3).strokeColor("#F5E6B8").lineWidth(0.5).stroke();
        doc.fontSize(7).fillColor("#78600D").font("Helvetica-Oblique");
        doc.text(footerMessage.trim(), L + 8, y + 6, { width: textWidth });
        y += boxHeight + 6;
      }

      // ─── Standard Footer (bottom of page) ───
      const footerY = doc.page.height - 60;
      doc.moveTo(L, footerY).lineTo(R, footerY).strokeColor("#E5E5E5").lineWidth(0.5).stroke();
      doc.fontSize(6.5).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text(`All Ways Transfers | ABN ${abnValue} | Queensland, Australia | 0466 544 068 | bookings@allwaystransfers.com.au`, L, footerY + 6, {
        width: pageWidth, align: "center", lineBreak: false,
      });
      doc.fontSize(6).fillColor("#CCCCCC").font("Helvetica");
      doc.text(`Generated ${new Date().toLocaleString("en-AU", { timeZone: "Australia/Brisbane", dateStyle: "medium", timeStyle: "short" })} (AEST)`, L, footerY + 16, {
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
        const cy = doc.page.height / 2;
        doc.translate(cx, cy);
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
