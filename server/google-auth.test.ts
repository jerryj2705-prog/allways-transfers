import { describe, expect, it, vi, beforeEach } from "vitest";
import type { User } from "../drizzle/schema";

// Mock user fixtures
const mockUser: User = {
  id: 1,
  openId: "google_123456789",
  name: "Test User",
  email: "test@gmail.com",
  passwordHash: null,
  googleId: "123456789",
  loginMethod: "google",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const mockExistingEmailUser: User = {
  id: 2,
  openId: "local_abc123",
  name: "Existing User",
  email: "existing@gmail.com",
  passwordHash: "$2a$12$fakehash",
  googleId: null,
  loginMethod: "email",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

// Mock db module
vi.mock("./db", () => ({
  getUserByGoogleId: vi.fn(),
  getUserByEmail: vi.fn(),
  createUserWithGoogle: vi.fn(),
  linkGoogleAccount: vi.fn(),
  getUserById: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
  createUserWithPassword: vi.fn(),
  updateUserLastSignedIn: vi.fn(),
  getActiveVehicles: vi.fn().mockResolvedValue([]),
  getVehicleById: vi.fn(),
  createBooking: vi.fn(),
  getBookingByReference: vi.fn(),
  getBookingById: vi.fn(),
  listBookings: vi.fn(),
  updateBookingStatus: vi.fn(),
  updateBookingStripeSession: vi.fn(),
  getBookingStats: vi.fn(),
  getAllPricingSettings: vi.fn(),
  updatePricingSetting: vi.fn(),
  calculatePrice: vi.fn(),
  getBookingsByEmail: vi.fn(),
  updateBookingDetails: vi.fn(),
  createEnquiry: vi.fn(),
  listEnquiries: vi.fn(),
  getEnquiryById: vi.fn(),
  updateEnquiryStatus: vi.fn(),
  getEnquiryStats: vi.fn(),
  updateBookingPaymentStatus: vi.fn(),
  getBookingsByDateRange: vi.fn(),
  getAllPublicHolidays: vi.fn(),
  getActivePublicHolidays: vi.fn(),
  createPublicHoliday: vi.fn(),
  updatePublicHoliday: vi.fn(),
  deletePublicHoliday: vi.fn(),
  createReview: vi.fn(),
  getApprovedReviews: vi.fn(),
  getReviewStats: vi.fn(),
  listReviews: vi.fn(),
  getReviewById: vi.fn(),
  updateReviewStatus: vi.fn(),
  deleteReview: vi.fn(),
  getReviewByBookingId: vi.fn(),
  getCachedGoogleReviews: vi.fn(),
  getGoogleReviewsCacheAge: vi.fn(),
  clearGoogleReviewsCache: vi.fn(),
  insertGoogleReviews: vi.fn(),
  getAppSetting: vi.fn(),
  setAppSetting: vi.fn(),
}));

// Mock google-auth-library
vi.mock("google-auth-library", () => {
  return {
    OAuth2Client: vi.fn().mockImplementation(() => ({
      verifyIdToken: vi.fn().mockResolvedValue({
        getPayload: () => ({
          sub: "123456789",
          email: "test@gmail.com",
          name: "Test User",
          email_verified: true,
        }),
      }),
    })),
  };
});

describe("Google Auth: googleLogin procedure", () => {
  let appRouter: any;
  let db: any;
  let cookieSet: Record<string, any>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Set required env vars
    process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
    process.env.JWT_SECRET = "test-secret-key-for-vitest-runs-only";

    db = await import("./db");
    const routerModule = await import("./routers");
    appRouter = routerModule.appRouter;

    cookieSet = {};
  });

  function createCtx() {
    return {
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {
        clearCookie: vi.fn(),
        cookie: vi.fn((name: string, value: string, options: any) => {
          cookieSet = { name, value, options };
        }),
      } as any,
    };
  }

  it("rejects empty credential via zod validation", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.auth.googleLogin({ credential: "" })
    ).rejects.toThrow();
  });

  it("creates a new user when Google ID is not found and email is new", async () => {
    db.getUserByGoogleId.mockResolvedValue(undefined);
    db.getUserByEmail.mockResolvedValue(undefined);
    db.createUserWithGoogle.mockResolvedValue(mockUser);

    const caller = appRouter.createCaller(createCtx());
    const result = await caller.auth.googleLogin({ credential: "valid-google-token" });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("test@gmail.com");
    expect(result.user.name).toBe("Test User");
    expect(db.createUserWithGoogle).toHaveBeenCalledWith({
      name: "Test User",
      email: "test@gmail.com",
      googleId: "123456789",
    });
    expect(cookieSet.name).toBe("app_session_id");
  });

  it("links Google account to existing email user", async () => {
    db.getUserByGoogleId.mockResolvedValue(undefined);
    db.getUserByEmail.mockResolvedValue(mockExistingEmailUser);
    db.linkGoogleAccount.mockResolvedValue({
      ...mockExistingEmailUser,
      googleId: "123456789",
      loginMethod: "google",
    });

    const caller = appRouter.createCaller(createCtx());
    const result = await caller.auth.googleLogin({ credential: "valid-google-token" });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("existing@gmail.com");
    expect(db.linkGoogleAccount).toHaveBeenCalledWith(2, "123456789");
  });

  it("signs in existing Google user directly", async () => {
    db.getUserByGoogleId.mockResolvedValue(mockUser);

    const caller = appRouter.createCaller(createCtx());
    const result = await caller.auth.googleLogin({ credential: "valid-google-token" });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("test@gmail.com");
    expect(db.createUserWithGoogle).not.toHaveBeenCalled();
    expect(db.linkGoogleAccount).not.toHaveBeenCalled();
  });

  it("sets a session cookie on successful Google login", async () => {
    db.getUserByGoogleId.mockResolvedValue(mockUser);

    const caller = appRouter.createCaller(createCtx());
    await caller.auth.googleLogin({ credential: "valid-google-token" });

    expect(cookieSet.name).toBe("app_session_id");
    expect(cookieSet.value).toBeTruthy();
    expect(typeof cookieSet.value).toBe("string");
    expect(cookieSet.options.maxAge).toBeGreaterThan(0);
  });

  it("accepts rememberMe parameter", async () => {
    db.getUserByGoogleId.mockResolvedValue(mockUser);

    const caller = appRouter.createCaller(createCtx());
    const result = await caller.auth.googleLogin({
      credential: "valid-google-token",
      rememberMe: true,
    });

    expect(result.success).toBe(true);
  });
});
