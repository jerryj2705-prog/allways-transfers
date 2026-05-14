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

function createAdminContext(): TrpcContext {
  return createUserContext({ role: "admin", email: "admin@test.com" });
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

// ─── Tests ───

describe("cancelQuote", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bookings.cancelQuote({ referenceNumber: "AWT-FAKE123" })
    ).rejects.toThrow();
  });

  it("rejects cancellation of non-existent quote", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bookings.cancelQuote({ referenceNumber: "AWT-NONEXISTENT" })
    ).rejects.toThrow(/not found/i);
  });

  it("requires referenceNumber input", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      // @ts-expect-error - testing invalid input
      caller.bookings.cancelQuote({})
    ).rejects.toThrow();
  });
});

describe("adminConvertQuote", () => {
  it("rejects non-admin users", async () => {
    const ctx = createUserContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bookings.adminConvertQuote({
        bookingId: 999999,
        paymentMethod: "cash_postpay",
        origin: "https://test.example.com",
      })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bookings.adminConvertQuote({
        bookingId: 999999,
        paymentMethod: "cash_postpay",
      })
    ).rejects.toThrow();
  });

  it("validates payment method enum", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bookings.adminConvertQuote({
        bookingId: 1,
        // @ts-expect-error - testing invalid input
        paymentMethod: "invalid_method",
      })
    ).rejects.toThrow();
  });

  it("rejects non-existent booking", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bookings.adminConvertQuote({
        bookingId: 999999,
        paymentMethod: "cash_postpay",
        origin: "https://test.example.com",
      })
    ).rejects.toThrow();
  });
});

describe("emailLogs", () => {
  it("rejects non-admin users from listing email logs", async () => {
    const ctx = createUserContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.emailLogs.list({ limit: 10, offset: 0 })
    ).rejects.toThrow();
  });

  it("rejects non-admin users from viewing email stats", async () => {
    const ctx = createUserContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);

    await expect(caller.emailLogs.stats()).rejects.toThrow();
  });

  it("allows admin to list email logs", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.emailLogs.list({ limit: 10, offset: 0 });
    expect(result).toHaveProperty("logs");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.logs)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("allows admin to get email stats", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.emailLogs.stats();
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("sent");
    expect(result).toHaveProperty("failed");
    expect(result).toHaveProperty("byType");
    expect(typeof result.total).toBe("number");
    expect(typeof result.sent).toBe("number");
    expect(typeof result.failed).toBe("number");
    expect(Array.isArray(result.byType)).toBe(true);
  });

  it("supports filtering email logs by type", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.emailLogs.list({
      emailType: "booking_confirmation",
      limit: 10,
      offset: 0,
    });
    expect(result).toHaveProperty("logs");
    expect(Array.isArray(result.logs)).toBe(true);
  });

  it("supports filtering email logs by status", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.emailLogs.list({
      status: "sent",
      limit: 10,
      offset: 0,
    });
    expect(result).toHaveProperty("logs");
    expect(Array.isArray(result.logs)).toBe(true);
  });

  it("supports search in email logs", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.emailLogs.list({
      search: "test@example.com",
      limit: 10,
      offset: 0,
    });
    expect(result).toHaveProperty("logs");
    expect(Array.isArray(result.logs)).toBe(true);
  });
});

describe("booking stats include quote and expired counts", () => {
  it("returns quotes and expired counts in stats", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.bookings.stats();
    expect(stats).toHaveProperty("quote");
    expect(stats).toHaveProperty("expired");
    // SQL SUM returns strings for these fields
    expect(["number", "string"]).toContain(typeof stats.quote);
    expect(["number", "string"]).toContain(typeof stats.expired);
  });
});
