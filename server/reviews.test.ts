import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
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

function createUserContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
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
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createUserContext({ id: 99, role: "admin", name: "Admin User", email: "admin@example.com", openId: "admin-123" });
}

describe("reviews router", () => {
  describe("reviews.approved (public)", () => {
    it("returns an array of approved reviews", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.reviews.approved();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("reviews.publicStats (public)", () => {
    it("returns review statistics", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.reviews.publicStats();
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("approved");
      expect(result).toHaveProperty("pending");
      expect(result).toHaveProperty("averageRating");
      expect(typeof result.total).toBe("number");
      expect(typeof result.averageRating).toBe("number");
    });
  });

  describe("reviews.submit (protected)", () => {
    it("rejects unauthenticated users", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.reviews.submit({ bookingId: 1, rating: 5 })
      ).rejects.toThrow();
    });

    it("rejects invalid rating values", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.reviews.submit({ bookingId: 1, rating: 0 })
      ).rejects.toThrow();
      await expect(
        caller.reviews.submit({ bookingId: 1, rating: 6 })
      ).rejects.toThrow();
    });
  });

  describe("reviews.list (admin)", () => {
    it("rejects non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.reviews.list({ limit: 10, offset: 0 })
      ).rejects.toThrow();
    });

    it("returns paginated reviews for admin", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.reviews.list({ limit: 10, offset: 0 });
      expect(result).toHaveProperty("reviews");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.reviews)).toBe(true);
      expect(typeof result.total).toBe("number");
    });
  });

  describe("reviews.stats (admin)", () => {
    it("rejects non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.reviews.stats()).rejects.toThrow();
    });

    it("returns stats for admin", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.reviews.stats();
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("pending");
      expect(result).toHaveProperty("approved");
    });
  });

  describe("reviews.updateStatus (admin)", () => {
    it("rejects non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.reviews.updateStatus({ id: 1, status: "approved" })
      ).rejects.toThrow();
    });
  });

  describe("reviews.delete (admin)", () => {
    it("rejects non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.reviews.delete({ id: 1 })
      ).rejects.toThrow();
    });
  });
});
