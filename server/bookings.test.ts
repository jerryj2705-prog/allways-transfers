import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "local_admin",
      email: "admin@example.com",
      name: "Admin User",
      passwordHash: "$2a$12$test",
      loginMethod: "email",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "local_user",
      email: "user@example.com",
      name: "Regular User",
      passwordHash: "$2a$12$test",
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("vehicles.list", () => {
  it("returns a list of vehicles (public procedure)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.vehicles.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("bookings.create", () => {
  it("creates a booking with cash payment and returns a reference number", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const vehicles = await caller.vehicles.list();
    const suv = vehicles.find((v) => v.type === "suv");
    expect(suv).toBeDefined();

    const booking = await caller.bookings.create({
      clientName: "Test Client",
      clientEmail: "test@example.com",
      clientPhone: "+61 400 000 000",
      serviceType: "airport_transfer",
      pickupAddress: "Brisbane Airport",
      dropoffAddress: "Gold Coast",
      pickupDate: Date.now() + 86400000,
      passengerCount: 3,
      vehicleId: suv!.id,
      vehicleName: suv!.name,
      needsSupportVan: false,
      supportVanPrice: 0,
      basePrice: 170,
      totalPrice: 170,
      specialRequests: "Test booking",
      termsAccepted: true,
      paymentMethod: "cash_postpay",
    });

    expect(booking).toBeDefined();
    expect(booking.referenceNumber).toBeTruthy();
    expect(booking.status).toBe("pending");
    expect(booking.clientName).toBe("Test Client");
  });

  it("creates a booking with square post-pay", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const vehicles = await caller.vehicles.list();
    const suv = vehicles.find((v) => v.type === "suv");

    const booking = await caller.bookings.create({
      clientName: "Square Client",
      clientEmail: "square@example.com",
      clientPhone: "+61 400 222 222",
      serviceType: "point_to_point",
      pickupAddress: "Brisbane CBD",
      dropoffAddress: "Sunshine Coast",
      pickupDate: Date.now() + 86400000,
      passengerCount: 2,
      vehicleId: suv!.id,
      vehicleName: suv!.name,
      needsSupportVan: false,
      supportVanPrice: 0,
      basePrice: 200,
      totalPrice: 204,
      termsAccepted: true,
      paymentMethod: "square_postpay",
    });

    expect(booking).toBeDefined();
    expect(booking.referenceNumber).toBeTruthy();
  });

  it("creates a booking with stripe pre-pay (no checkout URL without origin)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const vehicles = await caller.vehicles.list();
    const suv = vehicles.find((v) => v.type === "suv");

    const booking = await caller.bookings.create({
      clientName: "Stripe Client",
      clientEmail: "stripe@example.com",
      clientPhone: "+61 400 333 333",
      serviceType: "hourly_hire",
      pickupAddress: "Noosa Heads",
      pickupDate: Date.now() + 86400000,
      passengerCount: 4,
      vehicleId: suv!.id,
      vehicleName: suv!.name,
      needsSupportVan: true,
      supportVanPrice: 150,
      estimatedDuration: 180,
      basePrice: 255,
      totalPrice: 405,
      termsAccepted: true,
      paymentMethod: "stripe_prepay",
    });

    expect(booking).toBeDefined();
    expect(booking.referenceNumber).toBeTruthy();
    // Without origin, checkout URL should be null
    expect(booking.checkoutUrl).toBeNull();
  });

  it("rejects booking without terms accepted", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const vehicles = await caller.vehicles.list();
    const suv = vehicles.find((v) => v.type === "suv");

    await expect(
      caller.bookings.create({
        clientName: "Test",
        clientEmail: "test@example.com",
        clientPhone: "+61 400 000 000",
        serviceType: "point_to_point",
        pickupAddress: "Brisbane CBD",
        dropoffAddress: "Surfers Paradise",
        pickupDate: Date.now() + 86400000,
        passengerCount: 2,
        vehicleId: suv!.id,
        vehicleName: suv!.name,
        needsSupportVan: false,
        supportVanPrice: 0,
        basePrice: 150,
        totalPrice: 150,
        termsAccepted: false,
        paymentMethod: "cash_postpay",
      })
    ).rejects.toThrow();
  });
});

describe("bookings.create with child seats and pet", () => {
  it("creates a booking with child seats and pet description", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const vehicles = await caller.vehicles.list();
    const suv = vehicles.find((v) => v.type === "suv");
    expect(suv).toBeDefined();

    const booking = await caller.bookings.create({
      clientName: "Pet & Child Client",
      clientEmail: "petchild@example.com",
      clientPhone: "+61 400 555 555",
      serviceType: "airport_transfer",
      pickupAddress: "Sunshine Coast Airport",
      dropoffAddress: "Noosa Heads",
      pickupDate: Date.now() + 86400000,
      passengerCount: 4,
      vehicleId: suv!.id,
      vehicleName: suv!.name,
      needsSupportVan: false,
      supportVanPrice: 0,
      rearFacingSeats: 1,
      forwardFacingSeats: 2,
      boosterSeats: 0,
      isPetFriendly: true,
      petDescription: "Small Labrador, well-behaved, travels in a crate",
      basePrice: 170,
      totalPrice: 170,
      termsAccepted: true,
      paymentMethod: "cash_postpay",
    });

    expect(booking).toBeDefined();
    expect(booking.referenceNumber).toBeTruthy();
    expect(booking.rearFacingSeats).toBe(1);
    expect(booking.forwardFacingSeats).toBe(2);
    expect(booking.boosterSeats).toBe(0);
    expect(booking.isPetFriendly).toBe(1);
    expect(booking.petDescription).toBe("Small Labrador, well-behaved, travels in a crate");
  });

  it("creates a booking without pet - petDescription should be null", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const vehicles = await caller.vehicles.list();
    const suv = vehicles.find((v) => v.type === "suv");

    const booking = await caller.bookings.create({
      clientName: "No Pet Client",
      clientEmail: "nopet@example.com",
      clientPhone: "+61 400 666 666",
      serviceType: "point_to_point",
      pickupAddress: "Brisbane CBD",
      dropoffAddress: "Gold Coast",
      pickupDate: Date.now() + 86400000,
      passengerCount: 2,
      vehicleId: suv!.id,
      vehicleName: suv!.name,
      needsSupportVan: false,
      supportVanPrice: 0,
      rearFacingSeats: 0,
      forwardFacingSeats: 0,
      boosterSeats: 1,
      isPetFriendly: false,
      basePrice: 200,
      totalPrice: 200,
      termsAccepted: true,
      paymentMethod: "cash_postpay",
    });

    expect(booking).toBeDefined();
    expect(booking.boosterSeats).toBe(1);
    expect(booking.isPetFriendly).toBe(0);
    expect(booking.petDescription).toBeNull();
  });
});

describe("bookings.list (admin)", () => {
  it("allows admin to list bookings", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bookings.list({});
    expect(result).toHaveProperty("bookings");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.bookings)).toBe(true);
  });

  it("blocks non-admin users from listing bookings", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.bookings.list({})).rejects.toThrow();
  });

  it("blocks unauthenticated users from listing bookings", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.bookings.list({})).rejects.toThrow();
  });
});

describe("bookings.stats (admin)", () => {
  it("returns booking statistics for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.bookings.stats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("pending");
    expect(stats).toHaveProperty("confirmed");
    expect(stats).toHaveProperty("completed");
    expect(stats).toHaveProperty("cancelled");
    expect(typeof stats.total).toBe("number");
  });
});

describe("bookings.getByReference", () => {
  it("returns a booking by reference number (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const vehicles = await caller.vehicles.list();
    const suv = vehicles.find((v) => v.type === "suv");

    const created = await caller.bookings.create({
      clientName: "Ref Test",
      clientEmail: "ref@example.com",
      clientPhone: "+61 400 111 111",
      serviceType: "hourly_hire",
      pickupAddress: "Brisbane CBD",
      pickupDate: Date.now() + 86400000,
      passengerCount: 1,
      vehicleId: suv!.id,
      vehicleName: suv!.name,
      needsSupportVan: false,
      supportVanPrice: 0,
      estimatedDuration: 180,
      basePrice: 255,
      totalPrice: 255,
      termsAccepted: true,
      paymentMethod: "cash_postpay",
    });

    const found = await caller.bookings.getByReference({
      referenceNumber: created.referenceNumber,
    });

    expect(found).toBeDefined();
    expect(found?.clientName).toBe("Ref Test");
    expect(found?.paymentMethod).toBe("cash_postpay");
    expect(found?.paymentStatus).toBe("unpaid");
  });
});

describe("bookings.adminModify", () => {
  it("allows admin to modify booking details", async () => {
    const publicCtx = createPublicContext();
    const adminCtx = createAdminContext();
    const publicCaller = appRouter.createCaller(publicCtx);
    const adminCaller = appRouter.createCaller(adminCtx);

    const vehicles = await publicCaller.vehicles.list();
    const suv = vehicles.find((v) => v.type === "suv");

    const created = await publicCaller.bookings.create({
      clientName: "Modify Test",
      clientEmail: "modify@example.com",
      clientPhone: "+61 400 777 777",
      serviceType: "airport_transfer",
      pickupAddress: "Brisbane Airport",
      dropoffAddress: "Gold Coast",
      pickupDate: Date.now() + 86400000 * 2,
      passengerCount: 2,
      vehicleId: suv!.id,
      vehicleName: suv!.name,
      needsSupportVan: false,
      supportVanPrice: 0,
      basePrice: 170,
      totalPrice: 170,
      termsAccepted: true,
      paymentMethod: "cash_postpay",
    });

    const updated = await adminCaller.bookings.adminModify({
      bookingId: created.id,
      pickupAddress: "Sunshine Coast Airport",
      dropoffAddress: "Noosa Heads",
      passengerCount: 4,
      specialRequests: "Updated by admin",
    });

    expect(updated).toBeDefined();
    expect(updated!.pickupAddress).toBe("Sunshine Coast Airport");
    expect(updated!.dropoffAddress).toBe("Noosa Heads");
    expect(updated!.passengerCount).toBe(4);
    expect(updated!.specialRequests).toBe("Updated by admin");
  });

  it("blocks non-admin users from modifying bookings", async () => {
    const userCtx = createUserContext();
    const userCaller = appRouter.createCaller(userCtx);

    await expect(
      userCaller.bookings.adminModify({
        bookingId: 1,
        pickupAddress: "Hacked Address",
      })
    ).rejects.toThrow();
  });

  it("rejects modification of non-existent booking", async () => {
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    await expect(
      adminCaller.bookings.adminModify({
        bookingId: 999999,
        pickupAddress: "Nowhere",
      })
    ).rejects.toThrow("Booking not found");
  });

  it("returns unchanged booking when no fields differ", async () => {
    const publicCtx = createPublicContext();
    const adminCtx = createAdminContext();
    const publicCaller = appRouter.createCaller(publicCtx);
    const adminCaller = appRouter.createCaller(adminCtx);

    const vehicles = await publicCaller.vehicles.list();
    const suv = vehicles.find((v) => v.type === "suv");

    const created = await publicCaller.bookings.create({
      clientName: "No Change Test",
      clientEmail: "nochange@example.com",
      clientPhone: "+61 400 888 888",
      serviceType: "point_to_point",
      pickupAddress: "Brisbane CBD",
      dropoffAddress: "Surfers Paradise",
      pickupDate: Date.now() + 86400000 * 3,
      passengerCount: 2,
      vehicleId: suv!.id,
      vehicleName: suv!.name,
      needsSupportVan: false,
      supportVanPrice: 0,
      basePrice: 200,
      totalPrice: 200,
      termsAccepted: true,
      paymentMethod: "cash_postpay",
    });

    // Pass the same values — should return unchanged
    const result = await adminCaller.bookings.adminModify({
      bookingId: created.id,
      pickupAddress: "Brisbane CBD",
      dropoffAddress: "Surfers Paradise",
      passengerCount: 2,
    });

    expect(result).toBeDefined();
    expect(result!.pickupAddress).toBe("Brisbane CBD");
  });
});

describe("bookings.calendarBookings (admin)", () => {
  it("returns bookings within a date range for admin", async () => {
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    // Query for a wide range that includes test bookings created above
    const now = Date.now();
    const result = await adminCaller.bookings.calendarBookings({
      startMs: now - 86400000 * 30,
      endMs: now + 86400000 * 30,
    });

    expect(Array.isArray(result)).toBe(true);
    // Should have some bookings from previous tests
    if (result.length > 0) {
      const booking = result[0];
      expect(booking).toHaveProperty("id");
      expect(booking).toHaveProperty("referenceNumber");
      expect(booking).toHaveProperty("clientName");
      expect(booking).toHaveProperty("pickupDate");
      expect(booking).toHaveProperty("status");
      expect(booking).toHaveProperty("serviceType");
      expect(booking).toHaveProperty("vehicleName");
      expect(booking).toHaveProperty("totalPrice");
    }
  });

  it("returns empty array for date range with no bookings", async () => {
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    // Query for a range far in the future
    const farFuture = Date.now() + 86400000 * 365 * 10;
    const result = await adminCaller.bookings.calendarBookings({
      startMs: farFuture,
      endMs: farFuture + 86400000,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("blocks non-admin users from accessing calendar bookings", async () => {
    const userCtx = createUserContext();
    const userCaller = appRouter.createCaller(userCtx);

    await expect(
      userCaller.bookings.calendarBookings({
        startMs: Date.now(),
        endMs: Date.now() + 86400000,
      })
    ).rejects.toThrow();
  });

  it("blocks unauthenticated users from accessing calendar bookings", async () => {
    const publicCtx = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);

    await expect(
      publicCaller.bookings.calendarBookings({
        startMs: Date.now(),
        endMs: Date.now() + 86400000,
      })
    ).rejects.toThrow();
  });
});

describe("bookings.create with route preference", () => {
  it("creates a booking with fastest route (default)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const vehicles = await caller.vehicles.list();
    const suv = vehicles.find((v) => v.type === "suv");
    expect(suv).toBeDefined();

    const booking = await caller.bookings.create({
      clientName: "Route Default Client",
      clientEmail: "routedefault@example.com",
      clientPhone: "+61 400 900 001",
      serviceType: "airport_transfer",
      pickupAddress: "Brisbane Airport",
      dropoffAddress: "Gold Coast",
      pickupDate: Date.now() + 86400000,
      passengerCount: 2,
      vehicleId: suv!.id,
      vehicleName: suv!.name,
      needsSupportVan: false,
      supportVanPrice: 0,
      basePrice: 170,
      totalPrice: 170,
      termsAccepted: true,
      paymentMethod: "cash_postpay",
    });

    expect(booking).toBeDefined();
    expect(booking.routePreference).toBe("fastest");
  });

  it("creates a booking with toll-free route preference", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const vehicles = await caller.vehicles.list();
    const suv = vehicles.find((v) => v.type === "suv");
    expect(suv).toBeDefined();

    const booking = await caller.bookings.create({
      clientName: "Toll Free Client",
      clientEmail: "tollfree@example.com",
      clientPhone: "+61 400 900 002",
      serviceType: "point_to_point",
      pickupAddress: "Brisbane CBD",
      dropoffAddress: "Gold Coast",
      pickupDate: Date.now() + 86400000,
      passengerCount: 3,
      vehicleId: suv!.id,
      vehicleName: suv!.name,
      needsSupportVan: false,
      supportVanPrice: 0,
      basePrice: 200,
      totalPrice: 200,
      routePreference: "toll_free",
      termsAccepted: true,
      paymentMethod: "cash_postpay",
    });

    expect(booking).toBeDefined();
    expect(booking.routePreference).toBe("toll_free");
  });

  it("returns routePreference when fetching by reference", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const vehicles = await caller.vehicles.list();
    const suv = vehicles.find((v) => v.type === "suv");

    const created = await caller.bookings.create({
      clientName: "Route Ref Test",
      clientEmail: "routeref@example.com",
      clientPhone: "+61 400 900 003",
      serviceType: "airport_transfer",
      pickupAddress: "Gold Coast Airport",
      dropoffAddress: "Surfers Paradise",
      pickupDate: Date.now() + 86400000,
      passengerCount: 2,
      vehicleId: suv!.id,
      vehicleName: suv!.name,
      needsSupportVan: false,
      supportVanPrice: 0,
      basePrice: 100,
      totalPrice: 100,
      routePreference: "toll_free",
      termsAccepted: true,
      paymentMethod: "cash_postpay",
    });

    const found = await caller.bookings.getByReference({
      referenceNumber: created.referenceNumber,
    });

    expect(found).toBeDefined();
    expect(found?.routePreference).toBe("toll_free");
  });
});

describe("bookings.create with route preference", () => {
  it("creates a booking with fastest route (default)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const vehicles = await caller.vehicles.list();
    const suv = vehicles.find((v) => v.type === "suv");
    expect(suv).toBeDefined();

    const booking = await caller.bookings.create({
      clientName: "Route Default Client",
      clientEmail: "routedefault@example.com",
      clientPhone: "+61 400 900 001",
      serviceType: "airport_transfer",
      pickupAddress: "Brisbane Airport",
      dropoffAddress: "Gold Coast",
      pickupDate: Date.now() + 86400000,
      passengerCount: 2,
      vehicleId: suv!.id,
      vehicleName: suv!.name,
      needsSupportVan: false,
      supportVanPrice: 0,
      basePrice: 170,
      totalPrice: 170,
      termsAccepted: true,
      paymentMethod: "cash_postpay",
    });

    expect(booking).toBeDefined();
    expect(booking.routePreference).toBe("fastest");
  });

  it("creates a booking with toll-free route preference", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const vehicles = await caller.vehicles.list();
    const suv = vehicles.find((v) => v.type === "suv");
    expect(suv).toBeDefined();

    const booking = await caller.bookings.create({
      clientName: "Toll Free Client",
      clientEmail: "tollfree@example.com",
      clientPhone: "+61 400 900 002",
      serviceType: "point_to_point",
      pickupAddress: "Brisbane CBD",
      dropoffAddress: "Gold Coast",
      pickupDate: Date.now() + 86400000,
      passengerCount: 3,
      vehicleId: suv!.id,
      vehicleName: suv!.name,
      needsSupportVan: false,
      supportVanPrice: 0,
      basePrice: 200,
      totalPrice: 200,
      routePreference: "toll_free",
      termsAccepted: true,
      paymentMethod: "cash_postpay",
    });

    expect(booking).toBeDefined();
    expect(booking.routePreference).toBe("toll_free");
  });

  it("returns routePreference when fetching by reference", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const vehicles = await caller.vehicles.list();
    const suv = vehicles.find((v) => v.type === "suv");

    const created = await caller.bookings.create({
      clientName: "Route Ref Test",
      clientEmail: "routeref@example.com",
      clientPhone: "+61 400 900 003",
      serviceType: "airport_transfer",
      pickupAddress: "Gold Coast Airport",
      dropoffAddress: "Surfers Paradise",
      pickupDate: Date.now() + 86400000,
      passengerCount: 2,
      vehicleId: suv!.id,
      vehicleName: suv!.name,
      needsSupportVan: false,
      supportVanPrice: 0,
      basePrice: 100,
      totalPrice: 100,
      routePreference: "toll_free",
      termsAccepted: true,
      paymentMethod: "cash_postpay",
    });

    const found = await caller.bookings.getByReference({
      referenceNumber: created.referenceNumber,
    });

    expect(found).toBeDefined();
    expect(found?.routePreference).toBe("toll_free");
  });
});
