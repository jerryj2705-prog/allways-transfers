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
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
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
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
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
  it("creates a booking and returns a reference number", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // First get vehicles to get a valid ID
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
      pickupDate: Date.now() + 86400000, // tomorrow
      passengerCount: 3,
      vehicleId: suv!.id,
      vehicleName: suv!.name,
      needsSupportVan: false,
      supportVanPrice: 0,
      basePrice: 170,
      totalPrice: 170,
      specialRequests: "Test booking",
      termsAccepted: true,
    });

    expect(booking).toBeDefined();
    expect(booking.referenceNumber).toBeTruthy();
    expect(booking.referenceNumber).toMatch(/^CB-/);
    expect(booking.status).toBe("pending");
    expect(booking.clientName).toBe("Test Client");
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
      })
    ).rejects.toThrow();
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

    // Create a booking first
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
      basePrice: 255,
      totalPrice: 255,
      termsAccepted: true,
    });

    const found = await caller.bookings.getByReference({
      referenceNumber: created.referenceNumber,
    });

    expect(found).toBeDefined();
    expect(found?.clientName).toBe("Ref Test");
  });
});
