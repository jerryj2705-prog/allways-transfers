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

// ─── Colors ───
const GOLD = "#C4952E";
const DARK_BG = "#1A1A1A";
const LIGHT_TEXT = "#E5E5E5";
const MUTED_TEXT = "#A3A3A3";
const WHITE = "#FFFFFF";
const GREEN = "#16A34A";
const RED = "#EF4444";

/**
 * Generate an invoice PDF for a booking.
 * Returns a Buffer containing the PDF data.
 */
export async function generateInvoicePDF(booking: Booking, footerMessage?: string | null): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
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

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      let y = doc.page.margins.top;

      // ─── Header ───
      // Logo (left side)
      const logoBuffer = await fetchLogoBuffer();
      if (logoBuffer) {
        // Logo is 1200x1200 (square aspect ratio)
        const logoHeight = 80;
        const logoWidth = 80;
        doc.image(logoBuffer, 50, 25, { width: logoWidth, height: logoHeight });
      } else {
        // Fallback: text-only if logo fetch fails
        doc.fontSize(22).fillColor(DARK_BG).font("Helvetica-Bold");
        doc.text("ALL WAYS TRANSFERS", 50, 40, { width: pageWidth * 0.5 });
      }

      // Business name and contact (next to logo)
      const textStartX = logoBuffer ? 140 : 50;
      doc.fontSize(16).fillColor(DARK_BG).font("Helvetica-Bold");
      doc.text("All Ways Transfers", textStartX, 30);
      doc.fontSize(8).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("Phone: 0466 544 068  |  Email: bookings@allwaystransfers.com.au", textStartX, 50);
      doc.text("ABN: 18 715 944 056  |  Queensland, Australia", textStartX, 62);

      // Invoice title (right side)
      doc.fontSize(18).fillColor(GOLD).font("Helvetica-Bold");
      doc.text("TAX INVOICE", doc.page.width - 210, 30, { width: 160, align: "right" });

      // Invoice date under title on right
      doc.fontSize(9).fillColor(MUTED_TEXT).font("Helvetica");
      const headerDate = new Date().toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Australia/Brisbane",
      });
      doc.text(headerDate, doc.page.width - 210, 52, { width: 160, align: "right" });

      // Header divider line
      y = 115;
      doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor(GOLD).lineWidth(2).stroke();
      y = 130;

      // ─── Reference & Date Section ───
      const leftCol = 50;
      const rightCol = doc.page.width / 2 + 20;

      doc.fontSize(9).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("INVOICE NUMBER", leftCol, y);
      doc.fontSize(12).fillColor(GOLD).font("Helvetica-Bold");
      doc.text(booking.referenceNumber, leftCol, y + 14);

      doc.fontSize(9).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("INVOICE DATE", rightCol, y);
      doc.fontSize(11).fillColor("#333333").font("Helvetica");
      const invoiceDate = new Date().toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Australia/Brisbane",
      });
      doc.text(invoiceDate, rightCol, y + 14);

      y += 40;

      doc.fontSize(9).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("BOOKING STATUS", leftCol, y);
      doc.fontSize(11).fillColor("#333333").font("Helvetica-Bold");
      doc.text(booking.status.charAt(0).toUpperCase() + booking.status.slice(1), leftCol, y + 14);

      doc.fontSize(9).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("PICKUP DATE", rightCol, y);
      doc.fontSize(11).fillColor("#333333").font("Helvetica");
      doc.text(`${formatDate(booking.pickupDate)} at ${formatTime(booking.pickupDate)} (AEST)`, rightCol, y + 14);

      y += 48;

      // ─── Divider ───
      doc.moveTo(leftCol, y).lineTo(doc.page.width - 50, y).strokeColor("#E0E0E0").lineWidth(1).stroke();
      y += 16;

      // ─── Client Details ───
      doc.fontSize(10).fillColor(GOLD).font("Helvetica-Bold");
      doc.text("CLIENT DETAILS", leftCol, y);
      y += 18;

      const clientDetails = [
        ["Name", booking.clientName],
        ["Email", booking.clientEmail],
        ["Phone", booking.clientPhone],
      ];

      for (const [label, value] of clientDetails) {
        doc.fontSize(9).fillColor(MUTED_TEXT).font("Helvetica");
        doc.text(label, leftCol, y, { width: 80 });
        doc.fontSize(10).fillColor("#333333").font("Helvetica");
        doc.text(value, leftCol + 85, y, { width: pageWidth - 85 });
        y += 18;
      }

      y += 8;

      // ─── Divider ───
      doc.moveTo(leftCol, y).lineTo(doc.page.width - 50, y).strokeColor("#E0E0E0").lineWidth(1).stroke();
      y += 16;

      // ─── Service Details ───
      doc.fontSize(10).fillColor(GOLD).font("Helvetica-Bold");
      doc.text("SERVICE DETAILS", leftCol, y);
      y += 18;

      const serviceDetails: [string, string][] = [
        ["Service", formatServiceType(booking.serviceType)],
        ["Pickup", booking.pickupAddress],
      ];

      if (booking.dropoffAddress) {
        serviceDetails.push(["Drop-off", booking.dropoffAddress]);
      }

      // Additional stops
      if (booking.additionalPickupCount > 0 && booking.additionalPickupAddresses) {
        try {
          const addrs = JSON.parse(booking.additionalPickupAddresses);
          serviceDetails.push([`Add. Pickups (${booking.additionalPickupCount})`, addrs.join("; ")]);
        } catch { /* ignore */ }
      }
      if (booking.additionalDropoffCount > 0 && booking.additionalDropoffAddresses) {
        try {
          const addrs = JSON.parse(booking.additionalDropoffAddresses);
          serviceDetails.push([`Add. Drop-offs (${booking.additionalDropoffCount})`, addrs.join("; ")]);
        } catch { /* ignore */ }
      }

      serviceDetails.push(["Vehicle", booking.vehicleName]);
      serviceDetails.push(["Passengers", String(booking.passengerCount)]);

      // Child seats
      const childSeats: string[] = [];
      if (booking.rearFacingSeats > 0) childSeats.push(`${booking.rearFacingSeats}× Rear-facing`);
      if (booking.forwardFacingSeats > 0) childSeats.push(`${booking.forwardFacingSeats}× Forward-facing`);
      if (booking.boosterSeats > 0) childSeats.push(`${booking.boosterSeats}× Booster`);
      if (childSeats.length > 0) {
        serviceDetails.push(["Child Seats", childSeats.join(", ")]);
      }

      // Pets
      if (booking.isPetFriendly === 1 && booking.numberOfPets) {
        serviceDetails.push(["Pets", `${booking.numberOfPets} pet${booking.numberOfPets !== 1 ? "s" : ""}${booking.petDescription ? ` — ${booking.petDescription}` : ""}`]);
      }

      // Freight
      if (booking.freightDescription) {
        serviceDetails.push(["Freight Description", booking.freightDescription]);
      }
      if (booking.freightWeight) {
        const weightLabels: Record<string, string> = {
          under_10kg: "Under 10 kg",
          "10_25kg": "10–25 kg",
          "25_50kg": "25–50 kg",
          "50_100kg": "50–100 kg",
          "100_plus": "100+ kg",
        };
        serviceDetails.push(["Freight Weight", weightLabels[booking.freightWeight] || booking.freightWeight]);
      }

      if (booking.specialRequests) {
        serviceDetails.push(["Special Requests", booking.specialRequests]);
      }

      for (const [label, value] of serviceDetails) {
        doc.fontSize(9).fillColor(MUTED_TEXT).font("Helvetica");
        doc.text(label, leftCol, y, { width: 110 });
        doc.fontSize(10).fillColor("#333333").font("Helvetica");
        const textHeight = doc.heightOfString(value, { width: pageWidth - 115 });
        doc.text(value, leftCol + 115, y, { width: pageWidth - 115 });
        y += Math.max(18, textHeight + 6);

        // Check if we need a new page
        if (y > doc.page.height - 200) {
          doc.addPage();
          y = doc.page.margins.top;
        }
      }

      y += 8;

      // ─── Divider ───
      doc.moveTo(leftCol, y).lineTo(doc.page.width - 50, y).strokeColor("#E0E0E0").lineWidth(1).stroke();
      y += 16;

      // ─── Price Breakdown ───
      doc.fontSize(10).fillColor(GOLD).font("Helvetica-Bold");
      doc.text("PRICE BREAKDOWN", leftCol, y);
      y += 20;

      // Table header
      doc.rect(leftCol, y, pageWidth, 22).fill("#F5F5F5");
      doc.fontSize(9).fillColor(MUTED_TEXT).font("Helvetica-Bold");
      doc.text("ITEM", leftCol + 8, y + 6, { width: pageWidth - 120 });
      doc.text("AMOUNT", doc.page.width - 50 - 100, y + 6, { width: 100, align: "right" });
      y += 28;

      const priceItems: [string, number][] = [];

      // Base price
      const basePrice = parseFloat(String(booking.basePrice));
      priceItems.push([`Base Price (${formatServiceType(booking.serviceType)})`, basePrice]);

      // Support van
      const supportVanPrice = parseFloat(String(booking.supportVanPrice || "0"));
      if (booking.needsSupportVan === 1 && supportVanPrice > 0) {
        priceItems.push(["Support Van", supportVanPrice]);
      }

      // Additional stops
      const additionalStopsSurcharge = parseFloat(String(booking.additionalStopsSurcharge || "0"));
      if (additionalStopsSurcharge > 0) {
        priceItems.push([`Additional Stops (${booking.additionalPickupCount + booking.additionalDropoffCount})`, additionalStopsSurcharge]);
      }

      // Public holiday
      const publicHolidaySurcharge = parseFloat(String(booking.publicHolidaySurcharge || "0"));
      if (publicHolidaySurcharge > 0) {
        priceItems.push([`Public Holiday Surcharge${booking.publicHolidayName ? ` (${booking.publicHolidayName})` : ""}`, publicHolidaySurcharge]);
      }

      // Airport tolls
      const airportTollSurcharge = parseFloat(String(booking.airportTollSurcharge || "0"));
      if (airportTollSurcharge > 0) {
        if (booking.airportTollDetails) {
          try {
            const details = JSON.parse(booking.airportTollDetails);
            for (const toll of details) {
              priceItems.push([`${toll.airport} ${toll.direction} Toll`, toll.amount]);
            }
          } catch {
            priceItems.push(["Airport Tolls", airportTollSurcharge]);
          }
        } else {
          priceItems.push(["Airport Tolls", airportTollSurcharge]);
        }
      }

      // Road tolls
      const roadTollSurcharge = parseFloat(String(booking.roadTollSurcharge || "0"));
      if (roadTollSurcharge > 0) {
        if (booking.roadTollDetails) {
          try {
            const details = JSON.parse(booking.roadTollDetails);
            for (const toll of details) {
              priceItems.push([`${toll.road} Toll`, toll.amount]);
            }
          } catch {
            priceItems.push(["Road Tolls", roadTollSurcharge]);
          }
        } else {
          priceItems.push(["Road Tolls", roadTollSurcharge]);
        }
      }

      // Render price items
      let isAlt = false;
      for (const [label, amount] of priceItems) {
        if (isAlt) {
          doc.rect(leftCol, y - 2, pageWidth, 20).fill("#FAFAFA");
        }
        doc.fontSize(10).fillColor("#333333").font("Helvetica");
        doc.text(label, leftCol + 8, y, { width: pageWidth - 120 });
        doc.text(`$${amount.toFixed(2)}`, doc.page.width - 50 - 100, y, { width: 100, align: "right" });
        y += 22;
        isAlt = !isAlt;

        if (y > doc.page.height - 150) {
          doc.addPage();
          y = doc.page.margins.top;
        }
      }

      // Total line
      y += 4;
      doc.moveTo(leftCol, y).lineTo(doc.page.width - 50, y).strokeColor(GOLD).lineWidth(2).stroke();
      y += 10;

      const totalPrice = parseFloat(String(booking.totalPrice));
      doc.rect(leftCol, y - 2, pageWidth, 30).fill("#FFF8E7");
      doc.fontSize(12).fillColor("#333333").font("Helvetica-Bold");
      doc.text("TOTAL (AUD)", leftCol + 8, y + 5);
      doc.fontSize(14).fillColor(GOLD).font("Helvetica-Bold");
      doc.text(`$${totalPrice.toFixed(2)}`, doc.page.width - 50 - 120, y + 3, { width: 120, align: "right" });
      y += 34;

      // GST note
      doc.fontSize(9).fillColor(MUTED_TEXT).font("Helvetica-Oblique");
      doc.text("All prices are inclusive of GST", leftCol + 8, y);
      y += 20;

      // ─── Payment Info ───
      if (y > doc.page.height - 180) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      doc.moveTo(leftCol, y).lineTo(doc.page.width - 50, y).strokeColor("#E0E0E0").lineWidth(1).stroke();
      y += 16;

      doc.fontSize(10).fillColor(GOLD).font("Helvetica-Bold");
      doc.text("PAYMENT INFORMATION", leftCol, y);
      y += 18;

      doc.fontSize(9).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("Payment Method", leftCol, y, { width: 110 });
      doc.fontSize(10).fillColor("#333333").font("Helvetica");
      doc.text(formatPaymentMethod(booking.paymentMethod), leftCol + 115, y);
      y += 18;

      doc.fontSize(9).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("Payment Status", leftCol, y, { width: 110 });
      const statusColor = booking.paymentStatus === "paid" ? GREEN : booking.paymentStatus === "refunded" ? "#6366F1" : RED;
      doc.fontSize(10).fillColor(statusColor).font("Helvetica-Bold");
      doc.text(formatPaymentStatus(booking.paymentStatus), leftCol + 115, y);
      y += 24;

      // Bank details for direct deposit
      if (booking.paymentMethod === "direct_deposit" && booking.paymentStatus === "unpaid") {
        const bankDetails = await getBankDetails();
        if (bankDetails) {
          doc.rect(leftCol, y, pageWidth, 110).fill("#F0FDF4").stroke("#BBF7D0");
          y += 10;

          doc.fontSize(10).fillColor(GREEN).font("Helvetica-Bold");
          doc.text("Bank Transfer Details", leftCol + 12, y);
          y += 16;

          const bankItems: [string, string][] = [
            ["Bank", bankDetails.bankName],
            ["BSB", bankDetails.bsb],
            ["Account No.", bankDetails.accountNumber],
            ["Account Name", bankDetails.accountName],
            ["Reference", booking.referenceNumber],
          ];

          for (const [label, value] of bankItems) {
            doc.fontSize(9).fillColor(MUTED_TEXT).font("Helvetica");
            doc.text(label, leftCol + 12, y, { width: 90 });
            doc.fontSize(10).fillColor("#333333").font("Helvetica-Bold");
            doc.text(value, leftCol + 105, y);
            y += 16;
          }

          y += 14;
        }
      }

      // ─── Custom Footer Message ───
      if (footerMessage && footerMessage.trim()) {
        // Ensure enough space for the custom message + standard footer
        const msgHeight = doc.fontSize(9).heightOfString(footerMessage.trim(), { width: pageWidth - 24 });
        const totalFooterHeight = msgHeight + 100; // custom msg + standard footer
        if (y > doc.page.height - totalFooterHeight - 20) {
          doc.addPage();
          y = doc.page.margins.top;
        }

        // Divider before custom message
        doc.moveTo(leftCol, y).lineTo(doc.page.width - 50, y).strokeColor("#E0E0E0").lineWidth(0.5).stroke();
        y += 14;

        // Custom message box with subtle background
        const boxPadding = 12;
        const boxWidth = pageWidth;
        const textWidth = boxWidth - boxPadding * 2;
        const textHeight = doc.fontSize(9).heightOfString(footerMessage.trim(), { width: textWidth });
        const boxHeight = textHeight + boxPadding * 2;

        doc.roundedRect(leftCol, y, boxWidth, boxHeight, 4).fill("#FFFBEB");
        doc.roundedRect(leftCol, y, boxWidth, boxHeight, 4).strokeColor("#F5E6B8").lineWidth(0.5).stroke();

        doc.fontSize(9).fillColor("#78600D").font("Helvetica-Oblique");
        doc.text(footerMessage.trim(), leftCol + boxPadding, y + boxPadding, {
          width: textWidth,
        });
        y += boxHeight + 16;
      }

      // ─── Standard Footer ───
      // Position at bottom of page
      const standardFooterY = Math.max(y, doc.page.height - 80);
      doc.moveTo(leftCol, standardFooterY).lineTo(doc.page.width - 50, standardFooterY).strokeColor("#E0E0E0").lineWidth(0.5).stroke();
      let fy = standardFooterY + 10;

      doc.fontSize(8).fillColor(MUTED_TEXT).font("Helvetica");
      doc.text("All Ways Transfers  |  ABN 18 715 944 056  |  Queensland, Australia", leftCol, fy, {
        width: pageWidth,
        align: "center",
      });
      fy += 12;
      doc.text("Phone: 0466 544 068  |  Email: bookings@allwaystransfers.com.au", leftCol, fy, {
        width: pageWidth,
        align: "center",
      });
      fy += 12;
      doc.fontSize(7).fillColor("#CCCCCC").font("Helvetica");
      doc.text(`Generated on ${new Date().toLocaleString("en-AU", { timeZone: "Australia/Brisbane", dateStyle: "medium", timeStyle: "short" })} (AEST)`, leftCol, fy, {
        width: pageWidth,
        align: "center",
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
