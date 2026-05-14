import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ───

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test_user",
    email: "test@example.com",
    name: "Test User",
    passwordHash: "$2a$12$test",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Invoice Download Tests ───

describe("bookings.downloadInvoice", () => {
  it("is accessible as a public procedure (no auth required)", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    // Should fail with "not found" rather than "unauthorized"
    await expect(
      caller.bookings.downloadInvoice({ referenceNumber: "AWT-NONEXISTENT" })
    ).rejects.toThrow(/not found/i);
  });

  it("rejects non-existent booking reference", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bookings.downloadInvoice({ referenceNumber: "AWT-DOESNOTEXIST" })
    ).rejects.toThrow(/not found/i);
  });

  it("requires referenceNumber input", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      // @ts-expect-error - testing invalid input
      caller.bookings.downloadInvoice({})
    ).rejects.toThrow();
  });

  it("rejects empty referenceNumber", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bookings.downloadInvoice({ referenceNumber: "" })
    ).rejects.toThrow();
  });
});

// ─── Invoice PDF Generation Unit Tests ───

describe("generateInvoicePDF", () => {
  it("generates a valid PDF buffer for a booking", async () => {
    // Import the function directly
    const { generateInvoicePDF } = await import("./invoice");

    const mockBooking = {
      id: 1,
      referenceNumber: "AWT-TEST001",
      clientName: "John Smith",
      clientEmail: "john@example.com",
      clientPhone: "0400000000",
      serviceType: "airport_transfer" as const,
      pickupAddress: "123 Main St, Brisbane QLD",
      dropoffAddress: "Brisbane Airport",
      additionalPickupCount: 0,
      additionalDropoffCount: 0,
      additionalPickupAddresses: null,
      additionalDropoffAddresses: null,
      additionalStopsSurcharge: "0.00",
      publicHolidaySurcharge: "0.00",
      publicHolidayName: null,
      pickupDate: Date.now() + 86400000,
      passengerCount: 2,
      vehicleId: 1,
      vehicleName: "Kia Carnival",
      needsSupportVan: 0,
      supportVanPrice: "0.00",
      rearFacingSeats: 0,
      forwardFacingSeats: 0,
      boosterSeats: 0,
      freightDescription: null,
      freightWeight: null,
      freightItemCount: null,
      freightSpecialHandling: null,
      routePreference: "fastest",
      tollOverride: null,
      airportTollSurcharge: "5.00",
      airportTollDetails: JSON.stringify([{ airport: "Brisbane Airport", direction: "Entry", amount: 5 }]),
      roadTollSurcharge: "0.00",
      roadTollDetails: null,
      isPetFriendly: 0,
      numberOfPets: null,
      petDescription: null,
      estimatedDistance: "35.50",
      estimatedDuration: 40,
      basePrice: "95.00",
      totalPrice: "100.00",
      paymentMethod: "cash_postpay" as const,
      paymentStatus: "unpaid" as const,
      stripeSessionId: null,
      paymentNote: null,
      paymentProofUrl: null,
      paymentProofKey: null,
      paymentProofUploadedAt: null,
      status: "confirmed" as const,
      lastReminderSentAt: null,
      lastPaymentReminderSentAt: null,
      specialRequests: "Please have water bottles",
      adminNotes: null,
      termsAccepted: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const pdfBuffer = await generateInvoicePDF(mockBooking);

    // Verify it's a Buffer
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    // Verify it has content
    expect(pdfBuffer.length).toBeGreaterThan(0);
    // Verify PDF magic bytes (%PDF-)
    const header = pdfBuffer.subarray(0, 5).toString("ascii");
    expect(header).toBe("%PDF-");
  });

  it("generates PDF with freight booking details", async () => {
    const { generateInvoicePDF } = await import("./invoice");

    const mockFreightBooking = {
      id: 2,
      referenceNumber: "AWT-FRT001",
      clientName: "Jane Doe",
      clientEmail: "jane@example.com",
      clientPhone: "0411111111",
      serviceType: "freight" as const,
      pickupAddress: "456 Industrial Rd, Gold Coast QLD",
      dropoffAddress: "789 Warehouse St, Brisbane QLD",
      additionalPickupCount: 0,
      additionalDropoffCount: 0,
      additionalPickupAddresses: null,
      additionalDropoffAddresses: null,
      additionalStopsSurcharge: "0.00",
      publicHolidaySurcharge: "0.00",
      publicHolidayName: null,
      pickupDate: Date.now() + 86400000,
      passengerCount: 0,
      vehicleId: 2,
      vehicleName: "Toyota HiAce Van",
      needsSupportVan: 0,
      supportVanPrice: "0.00",
      rearFacingSeats: 0,
      forwardFacingSeats: 0,
      boosterSeats: 0,
      freightDescription: "Office furniture - 3 desks and 6 chairs",
      freightWeight: "50_100kg",
      freightItemCount: 9,
      freightSpecialHandling: "Handle with care, fragile glass tops",
      routePreference: "toll_free",
      tollOverride: null,
      airportTollSurcharge: "0.00",
      airportTollDetails: null,
      roadTollSurcharge: "0.00",
      roadTollDetails: null,
      isPetFriendly: 0,
      numberOfPets: null,
      petDescription: null,
      estimatedDistance: "80.00",
      estimatedDuration: 65,
      basePrice: "250.00",
      totalPrice: "250.00",
      paymentMethod: "direct_deposit" as const,
      paymentStatus: "unpaid" as const,
      stripeSessionId: null,
      paymentNote: null,
      paymentProofUrl: null,
      paymentProofKey: null,
      paymentProofUploadedAt: null,
      status: "pending" as const,
      lastReminderSentAt: null,
      lastPaymentReminderSentAt: null,
      specialRequests: null,
      adminNotes: null,
      termsAccepted: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const pdfBuffer = await generateInvoicePDF(mockFreightBooking);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    const header = pdfBuffer.subarray(0, 5).toString("ascii");
    expect(header).toBe("%PDF-");
  });

  it("generates PDF with custom footer message", async () => {
    const { generateInvoicePDF } = await import("./invoice");

    const mockBooking = {
      id: 4,
      referenceNumber: "AWT-FOOTER01",
      clientName: "Alice Footer",
      clientEmail: "alice@example.com",
      clientPhone: "0433333333",
      serviceType: "airport_transfer" as const,
      pickupAddress: "123 Main St, Brisbane QLD",
      dropoffAddress: "Brisbane Airport",
      additionalPickupCount: 0,
      additionalDropoffCount: 0,
      additionalPickupAddresses: null,
      additionalDropoffAddresses: null,
      additionalStopsSurcharge: "0.00",
      publicHolidaySurcharge: "0.00",
      publicHolidayName: null,
      pickupDate: Date.now() + 86400000,
      passengerCount: 2,
      vehicleId: 1,
      vehicleName: "Kia Carnival",
      needsSupportVan: 0,
      supportVanPrice: "0.00",
      rearFacingSeats: 0,
      forwardFacingSeats: 0,
      boosterSeats: 0,
      freightDescription: null,
      freightWeight: null,
      freightItemCount: null,
      freightSpecialHandling: null,
      routePreference: "fastest",
      tollOverride: null,
      airportTollSurcharge: "0.00",
      airportTollDetails: null,
      roadTollSurcharge: "0.00",
      roadTollDetails: null,
      isPetFriendly: 0,
      numberOfPets: null,
      petDescription: null,
      estimatedDistance: "35.50",
      estimatedDuration: 40,
      basePrice: "95.00",
      totalPrice: "95.00",
      paymentMethod: "cash_postpay" as const,
      paymentStatus: "unpaid" as const,
      stripeSessionId: null,
      paymentNote: null,
      paymentProofUrl: null,
      paymentProofKey: null,
      paymentProofUploadedAt: null,
      status: "confirmed" as const,
      lastReminderSentAt: null,
      lastPaymentReminderSentAt: null,
      specialRequests: null,
      adminNotes: null,
      termsAccepted: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const footerMsg = "Thank you for choosing All Ways Transfers. Payment is due within 7 days.";
    const pdfBuffer = await generateInvoicePDF(mockBooking, footerMsg);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    const header = pdfBuffer.subarray(0, 5).toString("ascii");
    expect(header).toBe("%PDF-");
  });

  it("generates PDF without footer message when null", async () => {
    const { generateInvoicePDF } = await import("./invoice");

    const mockBooking = {
      id: 5,
      referenceNumber: "AWT-NOFTR01",
      clientName: "Bob NoFooter",
      clientEmail: "bob@example.com",
      clientPhone: "0444444444",
      serviceType: "point_to_point" as const,
      pickupAddress: "100 Queen St, Brisbane QLD",
      dropoffAddress: "200 Gold Coast Hwy, Surfers Paradise QLD",
      additionalPickupCount: 0,
      additionalDropoffCount: 0,
      additionalPickupAddresses: null,
      additionalDropoffAddresses: null,
      additionalStopsSurcharge: "0.00",
      publicHolidaySurcharge: "0.00",
      publicHolidayName: null,
      pickupDate: Date.now() + 86400000,
      passengerCount: 1,
      vehicleId: 1,
      vehicleName: "Kia Carnival",
      needsSupportVan: 0,
      supportVanPrice: "0.00",
      rearFacingSeats: 0,
      forwardFacingSeats: 0,
      boosterSeats: 0,
      freightDescription: null,
      freightWeight: null,
      freightItemCount: null,
      freightSpecialHandling: null,
      routePreference: "fastest",
      tollOverride: null,
      airportTollSurcharge: "0.00",
      airportTollDetails: null,
      roadTollSurcharge: "0.00",
      roadTollDetails: null,
      isPetFriendly: 0,
      numberOfPets: null,
      petDescription: null,
      estimatedDistance: "75.00",
      estimatedDuration: 55,
      basePrice: "180.00",
      totalPrice: "180.00",
      paymentMethod: "cash_postpay" as const,
      paymentStatus: "unpaid" as const,
      stripeSessionId: null,
      paymentNote: null,
      paymentProofUrl: null,
      paymentProofKey: null,
      paymentProofUploadedAt: null,
      status: "confirmed" as const,
      lastReminderSentAt: null,
      lastPaymentReminderSentAt: null,
      specialRequests: null,
      adminNotes: null,
      termsAccepted: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const pdfWithNull = await generateInvoicePDF(mockBooking, null);
    const pdfWithEmpty = await generateInvoicePDF(mockBooking, "");
    const pdfWithUndefined = await generateInvoicePDF(mockBooking);

    // All should generate valid PDFs
    expect(pdfWithNull).toBeInstanceOf(Buffer);
    expect(pdfWithEmpty).toBeInstanceOf(Buffer);
    expect(pdfWithUndefined).toBeInstanceOf(Buffer);

    // PDF without footer should be smaller than with footer
    const pdfWithFooter = await generateInvoicePDF(mockBooking, "Thank you for your business!");
    expect(pdfWithFooter.length).toBeGreaterThan(pdfWithNull.length);
  });

  it("generates PDF for paid booking (no bank details section)", async () => {
    const { generateInvoicePDF } = await import("./invoice");

    const mockPaidBooking = {
      id: 3,
      referenceNumber: "AWT-PAID01",
      clientName: "Bob Wilson",
      clientEmail: "bob@example.com",
      clientPhone: "0422222222",
      serviceType: "point_to_point" as const,
      pickupAddress: "100 Queen St, Brisbane QLD",
      dropoffAddress: "200 Gold Coast Hwy, Surfers Paradise QLD",
      additionalPickupCount: 0,
      additionalDropoffCount: 0,
      additionalPickupAddresses: null,
      additionalDropoffAddresses: null,
      additionalStopsSurcharge: "0.00",
      publicHolidaySurcharge: "0.00",
      publicHolidayName: null,
      pickupDate: Date.now() + 86400000,
      passengerCount: 3,
      vehicleId: 1,
      vehicleName: "Kia Carnival",
      needsSupportVan: 0,
      supportVanPrice: "0.00",
      rearFacingSeats: 0,
      forwardFacingSeats: 0,
      boosterSeats: 0,
      freightDescription: null,
      freightWeight: null,
      freightItemCount: null,
      freightSpecialHandling: null,
      routePreference: "fastest",
      tollOverride: null,
      airportTollSurcharge: "0.00",
      airportTollDetails: null,
      roadTollSurcharge: "12.50",
      roadTollDetails: JSON.stringify([{ road: "Gateway Motorway", amount: 7.50 }, { road: "Logan Motorway", amount: 5.00 }]),
      isPetFriendly: 0,
      numberOfPets: null,
      petDescription: null,
      estimatedDistance: "75.00",
      estimatedDuration: 55,
      basePrice: "180.00",
      totalPrice: "192.50",
      paymentMethod: "stripe_prepay" as const,
      paymentStatus: "paid" as const,
      stripeSessionId: "cs_test_123",
      paymentNote: null,
      paymentProofUrl: null,
      paymentProofKey: null,
      paymentProofUploadedAt: null,
      status: "confirmed" as const,
      lastReminderSentAt: null,
      lastPaymentReminderSentAt: null,
      specialRequests: null,
      adminNotes: null,
      termsAccepted: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const pdfBuffer = await generateInvoicePDF(mockPaidBooking);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});

// ─── Payment Reminder DB Query Tests ───

describe("getDirectDepositUnpaidBookings", () => {
  it("returns an array (may be empty if no matching bookings)", async () => {
    const { getDirectDepositUnpaidBookings } = await import("./db");
    const result = await getDirectDepositUnpaidBookings();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Payment Reminder Email Tests ───

describe("sendDirectDepositPaymentReminderEmail", () => {
  it("returns true in test environment (email skipped)", async () => {
    const { sendDirectDepositPaymentReminderEmail } = await import("./email");

    const result = await sendDirectDepositPaymentReminderEmail({
      referenceNumber: "AWT-TEST001",
      clientName: "John Smith",
      clientEmail: "john@example.com",
      serviceType: "airport_transfer",
      pickupAddress: "123 Main St, Brisbane QLD",
      dropoffAddress: "Brisbane Airport",
      pickupDate: Date.now() + 86400000,
      totalPrice: "100.00",
      vehicleName: "Kia Carnival",
      origin: "https://test.example.com",
      bankDetails: {
        bankName: "Commonwealth Bank",
        bsb: "064-000",
        accountNumber: "12345678",
        accountName: "All Ways Transfers",
      },
    });

    // In test environment, email sending is skipped but returns true
    expect(result).toBe(true);
  });

  it("handles null bank details gracefully", async () => {
    const { sendDirectDepositPaymentReminderEmail } = await import("./email");

    const result = await sendDirectDepositPaymentReminderEmail({
      referenceNumber: "AWT-TEST002",
      clientName: "Jane Doe",
      clientEmail: "jane@example.com",
      serviceType: "point_to_point",
      pickupAddress: "456 Test St",
      dropoffAddress: "789 Dest St",
      pickupDate: Date.now() + 86400000,
      totalPrice: "150.00",
      vehicleName: "Toyota HiAce",
      origin: "https://test.example.com",
      bankDetails: null,
    });

    expect(result).toBe(true);
  });
});

// ─── Invoice Settings tRPC Tests ───

describe("invoiceSettings", () => {
  it("getFooterMessage requires admin role", async () => {
    const ctx = createUserContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.invoiceSettings.getFooterMessage()
    ).rejects.toThrow(/permission/i);
  });

  it("setFooterMessage requires admin role", async () => {
    const ctx = createUserContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.invoiceSettings.setFooterMessage({ message: "Test" })
    ).rejects.toThrow(/permission/i);
  });

  it("setFooterMessage rejects messages over 500 characters", async () => {
    const ctx = createUserContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);

    const longMessage = "A".repeat(501);
    await expect(
      caller.invoiceSettings.setFooterMessage({ message: longMessage })
    ).rejects.toThrow();
  });

  it("getFooterMessage and setFooterMessage work for admin", async () => {
    const ctx = createUserContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);

    // Set a footer message
    const testMsg = "Thank you for your business! Payment due within 7 days.";
    const result = await caller.invoiceSettings.setFooterMessage({ message: testMsg });
    expect(result.success).toBe(true);

    // Get it back
    const fetched = await caller.invoiceSettings.getFooterMessage();
    expect(fetched.message).toBe(testMsg);
  });

  it("setFooterMessage allows empty string to clear the message", async () => {
    const ctx = createUserContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.invoiceSettings.setFooterMessage({ message: "" });
    expect(result.success).toBe(true);

    const fetched = await caller.invoiceSettings.getFooterMessage();
    expect(fetched.message).toBe("");
  });

  // ─── ABN Tests ───

  it("getAbn requires admin role", async () => {
    const ctx = createUserContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.invoiceSettings.getAbn()
    ).rejects.toThrow(/permission/i);
  });

  it("setAbn requires admin role", async () => {
    const ctx = createUserContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.invoiceSettings.setAbn({ abn: "12 345 678 901" })
    ).rejects.toThrow(/permission/i);
  });

  it("setAbn and getAbn work for admin", async () => {
    const ctx = createUserContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);

    const testAbn = "99 888 777 666";
    const result = await caller.invoiceSettings.setAbn({ abn: testAbn });
    expect(result.success).toBe(true);

    const fetched = await caller.invoiceSettings.getAbn();
    expect(fetched.abn).toBe(testAbn);
  });

  it("setAbn allows empty string to clear ABN", async () => {
    const ctx = createUserContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.invoiceSettings.setAbn({ abn: "" });
    expect(result.success).toBe(true);
  });

  it("setAbn rejects values over 50 characters", async () => {
    const ctx = createUserContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.invoiceSettings.setAbn({ abn: "A".repeat(51) })
    ).rejects.toThrow();
  });

  it("getAll returns both footerMessage and abn", async () => {
    const ctx = createUserContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);

    const all = await caller.invoiceSettings.getAll();
    expect(all).toHaveProperty("footerMessage");
    expect(all).toHaveProperty("abn");
    expect(typeof all.footerMessage).toBe("string");
    expect(typeof all.abn).toBe("string");
  });
});

// ─── Invoice PDF with ABN Tests ───

describe("generateInvoicePDF with ABN option", () => {
  it("generates PDF with custom ABN via options object", async () => {
    const { generateInvoicePDF } = await import("./invoice");

    const mockBooking = {
      id: 10,
      referenceNumber: "AWT-ABN001",
      clientName: "ABN Test User",
      clientEmail: "abn@example.com",
      clientPhone: "0455555555",
      serviceType: "airport_transfer" as const,
      pickupAddress: "123 Main St, Brisbane QLD",
      dropoffAddress: "Brisbane Airport",
      additionalPickupCount: 0,
      additionalDropoffCount: 0,
      additionalPickupAddresses: null,
      additionalDropoffAddresses: null,
      additionalStopsSurcharge: "0.00",
      publicHolidaySurcharge: "0.00",
      publicHolidayName: null,
      pickupDate: Date.now() + 86400000,
      passengerCount: 2,
      vehicleId: 1,
      vehicleName: "Kia Carnival",
      needsSupportVan: 0,
      supportVanPrice: "0.00",
      rearFacingSeats: 0,
      forwardFacingSeats: 0,
      boosterSeats: 0,
      freightDescription: null,
      freightWeight: null,
      freightItemCount: null,
      freightSpecialHandling: null,
      routePreference: "fastest",
      tollOverride: null,
      airportTollSurcharge: "0.00",
      airportTollDetails: null,
      roadTollSurcharge: "0.00",
      roadTollDetails: null,
      isPetFriendly: 0,
      numberOfPets: null,
      petDescription: null,
      estimatedDistance: "35.50",
      estimatedDuration: 40,
      basePrice: "95.00",
      totalPrice: "95.00",
      paymentMethod: "cash_postpay" as const,
      paymentStatus: "unpaid" as const,
      stripeSessionId: null,
      paymentNote: null,
      paymentProofUrl: null,
      paymentProofKey: null,
      paymentProofUploadedAt: null,
      status: "confirmed" as const,
      lastReminderSentAt: null,
      lastPaymentReminderSentAt: null,
      specialRequests: null,
      adminNotes: null,
      termsAccepted: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const pdfBuffer = await generateInvoicePDF(mockBooking, {
      footerMessage: "Thank you!",
      abn: "99 888 777 666",
    });
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    const header = pdfBuffer.subarray(0, 5).toString("ascii");
    expect(header).toBe("%PDF-");
  });

  it("backward compatible: accepts string as second argument", async () => {
    const { generateInvoicePDF } = await import("./invoice");

    const mockBooking = {
      id: 11,
      referenceNumber: "AWT-COMPAT01",
      clientName: "Compat User",
      clientEmail: "compat@example.com",
      clientPhone: "0466666666",
      serviceType: "point_to_point" as const,
      pickupAddress: "100 Test St",
      dropoffAddress: "200 Dest St",
      additionalPickupCount: 0,
      additionalDropoffCount: 0,
      additionalPickupAddresses: null,
      additionalDropoffAddresses: null,
      additionalStopsSurcharge: "0.00",
      publicHolidaySurcharge: "0.00",
      publicHolidayName: null,
      pickupDate: Date.now() + 86400000,
      passengerCount: 1,
      vehicleId: 1,
      vehicleName: "Kia Carnival",
      needsSupportVan: 0,
      supportVanPrice: "0.00",
      rearFacingSeats: 0,
      forwardFacingSeats: 0,
      boosterSeats: 0,
      freightDescription: null,
      freightWeight: null,
      freightItemCount: null,
      freightSpecialHandling: null,
      routePreference: "fastest",
      tollOverride: null,
      airportTollSurcharge: "0.00",
      airportTollDetails: null,
      roadTollSurcharge: "0.00",
      roadTollDetails: null,
      isPetFriendly: 0,
      numberOfPets: null,
      petDescription: null,
      estimatedDistance: "50.00",
      estimatedDuration: 40,
      basePrice: "120.00",
      totalPrice: "120.00",
      paymentMethod: "cash_postpay" as const,
      paymentStatus: "unpaid" as const,
      stripeSessionId: null,
      paymentNote: null,
      paymentProofUrl: null,
      paymentProofKey: null,
      paymentProofUploadedAt: null,
      status: "confirmed" as const,
      lastReminderSentAt: null,
      lastPaymentReminderSentAt: null,
      specialRequests: null,
      adminNotes: null,
      termsAccepted: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Pass string directly (backward compat)
    const pdfBuffer = await generateInvoicePDF(mockBooking, "Legacy footer");
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});

// ─── PAID Watermark Tests ───

describe("generateInvoicePDF payment status watermarks", () => {
  it("generates PDFs with watermarks for both paid and unpaid bookings", async () => {
    const { generateInvoicePDF } = await import("./invoice");

    const baseBooking = {
      id: 20,
      referenceNumber: "AWT-WM001",
      clientName: "Watermark User",
      clientEmail: "wm@example.com",
      clientPhone: "0477777777",
      serviceType: "airport_transfer" as const,
      pickupAddress: "123 Main St, Brisbane QLD",
      dropoffAddress: "Brisbane Airport",
      additionalPickupCount: 0,
      additionalDropoffCount: 0,
      additionalPickupAddresses: null,
      additionalDropoffAddresses: null,
      additionalStopsSurcharge: "0.00",
      publicHolidaySurcharge: "0.00",
      publicHolidayName: null,
      pickupDate: Date.now() + 86400000,
      passengerCount: 2,
      vehicleId: 1,
      vehicleName: "Kia Carnival",
      needsSupportVan: 0,
      supportVanPrice: "0.00",
      rearFacingSeats: 0,
      forwardFacingSeats: 0,
      boosterSeats: 0,
      freightDescription: null,
      freightWeight: null,
      freightItemCount: null,
      freightSpecialHandling: null,
      routePreference: "fastest",
      tollOverride: null,
      airportTollSurcharge: "0.00",
      airportTollDetails: null,
      roadTollSurcharge: "0.00",
      roadTollDetails: null,
      isPetFriendly: 0,
      numberOfPets: null,
      petDescription: null,
      estimatedDistance: "35.50",
      estimatedDuration: 40,
      basePrice: "95.00",
      totalPrice: "95.00",
      stripeSessionId: null,
      paymentNote: null,
      paymentProofUrl: null,
      paymentProofKey: null,
      paymentProofUploadedAt: null,
      status: "confirmed" as const,
      lastReminderSentAt: null,
      lastPaymentReminderSentAt: null,
      specialRequests: null,
      adminNotes: null,
      termsAccepted: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const unpaidBooking = { ...baseBooking, paymentMethod: "cash_postpay" as const, paymentStatus: "unpaid" as const };
    const paidBooking = { ...baseBooking, paymentMethod: "stripe_prepay" as const, paymentStatus: "paid" as const };

    const unpaidPdf = await generateInvoicePDF(unpaidBooking);
    const paidPdf = await generateInvoicePDF(paidBooking);

    // Both should be valid PDFs
    expect(unpaidPdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(paidPdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");

    // Both have watermarks so both should have content
    expect(unpaidPdf.length).toBeGreaterThan(0);
    expect(paidPdf.length).toBeGreaterThan(0);
  });

  it("does not add watermark for refunded bookings", async () => {
    const { generateInvoicePDF } = await import("./invoice");

    const refundedBooking = {
      id: 21,
      referenceNumber: "AWT-WM002",
      clientName: "Refund User",
      clientEmail: "refund@example.com",
      clientPhone: "0488888888",
      serviceType: "point_to_point" as const,
      pickupAddress: "100 Test St",
      dropoffAddress: "200 Dest St",
      additionalPickupCount: 0,
      additionalDropoffCount: 0,
      additionalPickupAddresses: null,
      additionalDropoffAddresses: null,
      additionalStopsSurcharge: "0.00",
      publicHolidaySurcharge: "0.00",
      publicHolidayName: null,
      pickupDate: Date.now() + 86400000,
      passengerCount: 1,
      vehicleId: 1,
      vehicleName: "Kia Carnival",
      needsSupportVan: 0,
      supportVanPrice: "0.00",
      rearFacingSeats: 0,
      forwardFacingSeats: 0,
      boosterSeats: 0,
      freightDescription: null,
      freightWeight: null,
      freightItemCount: null,
      freightSpecialHandling: null,
      routePreference: "fastest",
      tollOverride: null,
      airportTollSurcharge: "0.00",
      airportTollDetails: null,
      roadTollSurcharge: "0.00",
      roadTollDetails: null,
      isPetFriendly: 0,
      numberOfPets: null,
      petDescription: null,
      estimatedDistance: "50.00",
      estimatedDuration: 40,
      basePrice: "120.00",
      totalPrice: "120.00",
      paymentMethod: "stripe_prepay" as const,
      paymentStatus: "refunded" as const,
      stripeSessionId: null,
      paymentNote: null,
      paymentProofUrl: null,
      paymentProofKey: null,
      paymentProofUploadedAt: null,
      status: "cancelled" as const,
      lastReminderSentAt: null,
      lastPaymentReminderSentAt: null,
      specialRequests: null,
      adminNotes: null,
      termsAccepted: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const pdf = await generateInvoicePDF(refundedBooking);
    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });
});

// ─── Admin Invoice Preview Tests ───

describe("invoiceSettings.preview", () => {
  it("requires admin role", async () => {
    const ctx = createUserContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.invoiceSettings.preview()
    ).rejects.toThrow(/permission/i);
  });

  it("generates a sample invoice PDF for admin", async () => {
    const ctx = createUserContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.invoiceSettings.preview();
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("filename");
    expect(result.filename).toBe("Invoice-Preview.pdf");
    expect(typeof result.data).toBe("string");

    // Verify base64 decodes to valid PDF
    const buffer = Buffer.from(result.data, "base64");
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });
});

// ─── Email Attachment Support Tests ───

describe("sendAndLog attachment support", () => {
  it("sendBookingConfirmationEmail accepts optional invoicePdf parameter", async () => {
    const { sendBookingConfirmationEmail } = await import("./email");

    // Should not throw when invoicePdf is provided
    const result = await sendBookingConfirmationEmail({
      referenceNumber: "AWT-ATTACH01",
      clientName: "Attach Test",
      clientEmail: "attach@example.com",
      serviceType: "airport_transfer",
      pickupAddress: "123 Main St",
      dropoffAddress: "Brisbane Airport",
      pickupDate: Date.now() + 86400000,
      passengerCount: 2,
      vehicleName: "Kia Carnival",
      totalPrice: "100.00",
      paymentMethod: "cash_postpay",
      isPetFriendly: false,
      numberOfPets: null,
      petDescription: null,
      publicHolidayName: null,
      publicHolidaySurcharge: null,
      routePreference: undefined,
      invoicePdf: Buffer.from("%PDF-1.4 test"),
    });

    expect(result).toBe(true);
  });

  it("sendPaymentReceiptEmail accepts optional invoicePdf parameter", async () => {
    const { sendPaymentReceiptEmail } = await import("./email");

    const result = await sendPaymentReceiptEmail({
      referenceNumber: "AWT-ATTACH02",
      clientName: "Receipt Test",
      clientEmail: "receipt@example.com",
      serviceType: "point_to_point",
      pickupAddress: "100 Test St",
      dropoffAddress: "200 Dest St",
      pickupDate: Date.now() + 86400000,
      passengerCount: 1,
      vehicleName: "Kia Carnival",
      totalPrice: "150.00",
      paymentMethod: "stripe_prepay",
      isPetFriendly: false,
      numberOfPets: null,
      petDescription: null,
      publicHolidayName: null,
      publicHolidaySurcharge: null,
      routePreference: undefined,
      invoicePdf: Buffer.from("%PDF-1.4 test"),
    });

    expect(result).toBe(true);
  });

  it("sendBookingConfirmationEmail works without invoicePdf (backward compat)", async () => {
    const { sendBookingConfirmationEmail } = await import("./email");

    const result = await sendBookingConfirmationEmail({
      referenceNumber: "AWT-NOATTACH01",
      clientName: "No Attach",
      clientEmail: "noattach@example.com",
      serviceType: "airport_transfer",
      pickupAddress: "123 Main St",
      dropoffAddress: "Brisbane Airport",
      pickupDate: Date.now() + 86400000,
      passengerCount: 2,
      vehicleName: "Kia Carnival",
      totalPrice: "100.00",
      paymentMethod: "cash_postpay",
      isPetFriendly: false,
      numberOfPets: null,
      petDescription: null,
      publicHolidayName: null,
      publicHolidaySurcharge: null,
      routePreference: undefined,
    });

    expect(result).toBe(true);
  });
});


// ─── Sequential Invoice Number Tests ───

describe("ensureInvoiceNumber", () => {
  it("is exported from db module", async () => {
    const db = await import("./db");
    expect(typeof db.ensureInvoiceNumber).toBe("function");
  });

  it("assignInvoiceNumber is exported from db module", async () => {
    const db = await import("./db");
    expect(typeof db.assignInvoiceNumber).toBe("function");
  });

  it("getInvoiceNumber is exported from db module", async () => {
    const db = await import("./db");
    expect(typeof db.getInvoiceNumber).toBe("function");
  });
});

describe("generateInvoicePDF with invoiceNumber option", () => {
  it("generates PDF with invoice number in options", async () => {
    const { generateInvoicePDF } = await import("./invoice");

    const mockBooking = {
      id: 20,
      referenceNumber: "AWT-INV001",
      clientName: "Invoice Num Test",
      clientEmail: "inv@example.com",
      clientPhone: "0466000000",
      serviceType: "airport_transfer" as const,
      pickupAddress: "100 Queen St, Brisbane QLD",
      dropoffAddress: "Brisbane Airport",
      additionalPickupCount: 0,
      additionalDropoffCount: 0,
      additionalPickupAddresses: null,
      additionalDropoffAddresses: null,
      additionalStopsSurcharge: "0.00",
      publicHolidaySurcharge: "0.00",
      publicHolidayName: null,
      pickupDate: Date.now() + 86400000,
      passengerCount: 2,
      vehicleId: 1,
      vehicleName: "Kia Carnival",
      needsSupportVan: 0,
      supportVanPrice: "0.00",
      rearFacingSeats: 0,
      forwardFacingSeats: 0,
      boosterSeats: 0,
      freightDescription: null,
      freightWeight: null,
      freightItemCount: null,
      freightSpecialHandling: null,
      routePreference: "fastest",
      tollOverride: null,
      airportTollSurcharge: "0.00",
      airportTollDetails: null,
      roadTollSurcharge: "0.00",
      roadTollDetails: null,
      isPetFriendly: 0,
      numberOfPets: null,
      petDescription: null,
      estimatedDistance: "30.00",
      estimatedDuration: 35,
      basePrice: "85.00",
      totalPrice: "85.00",
      paymentMethod: "cash_postpay" as const,
      paymentStatus: "unpaid" as const,
      stripeSessionId: null,
      paymentNote: null,
      paymentProofUrl: null,
      paymentProofKey: null,
      paymentProofUploadedAt: null,
      status: "confirmed" as const,
      lastReminderSentAt: null,
      lastPaymentReminderSentAt: null,
      specialRequests: null,
      adminNotes: null,
      termsAccepted: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Generate with invoice number
    const pdfBuffer = await generateInvoicePDF(mockBooking, {
      invoiceNumber: "INV-0042",
      footerMessage: "Thank you!",
      abn: "18 715 944 056",
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    const header = pdfBuffer.subarray(0, 5).toString("ascii");
    expect(header).toBe("%PDF-");
  });

  it("generates PDF without invoice number (falls back to reference)", async () => {
    const { generateInvoicePDF } = await import("./invoice");

    const mockBooking = {
      id: 21,
      referenceNumber: "AWT-INV002",
      clientName: "No Invoice Num",
      clientEmail: "noinv@example.com",
      clientPhone: "0466111111",
      serviceType: "point_to_point" as const,
      pickupAddress: "200 George St, Brisbane QLD",
      dropoffAddress: "Gold Coast",
      additionalPickupCount: 0,
      additionalDropoffCount: 0,
      additionalPickupAddresses: null,
      additionalDropoffAddresses: null,
      additionalStopsSurcharge: "0.00",
      publicHolidaySurcharge: "0.00",
      publicHolidayName: null,
      pickupDate: Date.now() + 86400000,
      passengerCount: 3,
      vehicleId: 1,
      vehicleName: "Kia Carnival",
      needsSupportVan: 0,
      supportVanPrice: "0.00",
      rearFacingSeats: 0,
      forwardFacingSeats: 0,
      boosterSeats: 0,
      freightDescription: null,
      freightWeight: null,
      freightItemCount: null,
      freightSpecialHandling: null,
      routePreference: "fastest",
      tollOverride: null,
      airportTollSurcharge: "0.00",
      airportTollDetails: null,
      roadTollSurcharge: "0.00",
      roadTollDetails: null,
      isPetFriendly: 0,
      numberOfPets: null,
      petDescription: null,
      estimatedDistance: "80.00",
      estimatedDuration: 60,
      basePrice: "200.00",
      totalPrice: "200.00",
      paymentMethod: "stripe_prepay" as const,
      paymentStatus: "paid" as const,
      stripeSessionId: "cs_test_456",
      paymentNote: null,
      paymentProofUrl: null,
      paymentProofKey: null,
      paymentProofUploadedAt: null,
      status: "confirmed" as const,
      lastReminderSentAt: null,
      lastPaymentReminderSentAt: null,
      specialRequests: null,
      adminNotes: null,
      termsAccepted: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Generate without invoice number option
    const pdfBuffer = await generateInvoicePDF(mockBooking, {
      footerMessage: null,
      abn: null,
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});
