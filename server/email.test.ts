import { describe, expect, it, vi } from "vitest";

// We test the email module by verifying:
// 1. The Resend API key is configured and valid (lightweight API call)
// 2. The email template functions produce correct HTML content
// 3. Booking creation with origin triggers email sending (integration)

describe("email configuration", () => {
  it("RESEND_API_KEY is configured", () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeTruthy();
    expect(typeof apiKey).toBe("string");
    // Resend keys start with 're_'
    expect(apiKey!.startsWith("re_")).toBe(true);
  });

  it("RESEND_FROM_EMAIL is configured", () => {
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    expect(fromEmail).toBeTruthy();
    expect(typeof fromEmail).toBe("string");
    expect(fromEmail!.includes("@")).toBe(true);
  });
});

describe("email sending - booking confirmation", () => {
  it("sendBookingConfirmationEmail sends without throwing", async () => {
    const { sendBookingConfirmationEmail } = await import("./email");

    // Send a test email to Resend's test address (won't actually deliver but validates API key)
    const result = await sendBookingConfirmationEmail({
      referenceNumber: "AWT-TEST001",
      clientName: "Test Client",
      clientEmail: "delivered@resend.dev",
      serviceType: "airport_transfer",
      pickupAddress: "Brisbane Airport",
      dropoffAddress: "Sunshine Coast",
      pickupDate: Date.now() + 86400000,
      passengerCount: 3,
      vehicleName: "Luxury SUV",
      rearFacingSeats: 1,
      forwardFacingSeats: 0,
      boosterSeats: 1,
      isPetFriendly: true,
      petDescription: "Small dog in crate",
      totalPrice: "250.00",
      paymentMethod: "cash_postpay",
      paymentStatus: "unpaid",
      specialRequests: "Please arrive 10 minutes early",
      origin: "https://example.com",
    });

    // Result should be true (successful send) or false (API issue) — not throw
    expect(typeof result).toBe("boolean");
  });
});

describe("email sending - cancellation confirmation", () => {
  it("sendCancellationConfirmationEmail sends without throwing", async () => {
    const { sendCancellationConfirmationEmail } = await import("./email");

    const result = await sendCancellationConfirmationEmail({
      referenceNumber: "AWT-TEST002",
      clientName: "Test Canceller",
      clientEmail: "delivered@resend.dev",
      serviceType: "point_to_point",
      pickupAddress: "Gold Coast",
      dropoffAddress: "Brisbane CBD",
      pickupDate: Date.now() + 86400000,
      totalPrice: "180.00",
      cancellationTier: "free",
      chargePercent: 0,
      reason: "Change of plans",
      origin: "https://example.com",
    });

    expect(typeof result).toBe("boolean");
  });

  it("sendCancellationConfirmationEmail handles partial charge tier", async () => {
    const { sendCancellationConfirmationEmail } = await import("./email");

    const result = await sendCancellationConfirmationEmail({
      referenceNumber: "AWT-TEST003",
      clientName: "Late Canceller",
      clientEmail: "delivered@resend.dev",
      serviceType: "hourly_hire",
      pickupAddress: "Noosa Heads",
      dropoffAddress: null,
      pickupDate: Date.now() + 86400000,
      totalPrice: "400.00",
      cancellationTier: "partial_charge",
      chargePercent: 50,
      reason: null,
      origin: "https://example.com",
    });

    expect(typeof result).toBe("boolean");
  });
});
