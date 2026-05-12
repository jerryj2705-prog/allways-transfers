import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { User } from "../drizzle/schema";

// Mock the db module
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  createPasswordResetToken: vi.fn(),
  getPasswordResetToken: vi.fn(),
  markPasswordResetTokenUsed: vi.fn(),
  updateUserPassword: vi.fn(),
  invalidateUserResetTokens: vi.fn(),
}));

// Mock the email module
vi.mock("./email", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  sendBookingConfirmationEmail: vi.fn(),
  sendCancellationConfirmationEmail: vi.fn(),
  sendAdminNewBookingNotification: vi.fn(),
  sendAdminCancellationNotification: vi.fn(),
  sendPaymentReceiptEmail: vi.fn().mockResolvedValue(true),
}));

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock the stripe module
vi.mock("./stripe", () => ({
  createCheckoutSession: vi.fn(),
}));

import * as db from "./db";
import * as email from "./email";

const mockUser: User = {
  id: 1,
  openId: null,
  name: "Test User",
  email: "test@example.com",
  passwordHash: "$2a$12$hashedpassword",
  googleId: null,
  loginMethod: "email",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createCaller() {
  const cookieStore: Record<string, string> = {};
  return appRouter.createCaller({
    user: null,
    req: { headers: {} } as any,
    res: {
      cookie: (name: string, value: string) => {
        cookieStore[name] = value;
      },
      clearCookie: () => {},
    } as any,
  });
}

describe("auth.forgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success even when email does not exist (prevents enumeration)", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);
    const caller = createCaller();

    const result = await caller.auth.forgotPassword({
      email: "nonexistent@example.com",
      origin: "https://example.com",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("If an account with that email exists");
    // Should NOT send email or create token
    expect(db.createPasswordResetToken).not.toHaveBeenCalled();
    expect(email.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("creates token and sends email for existing user", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(db.invalidateUserResetTokens).mockResolvedValue(undefined);
    vi.mocked(db.createPasswordResetToken).mockResolvedValue(undefined);
    const caller = createCaller();

    const result = await caller.auth.forgotPassword({
      email: "test@example.com",
      origin: "https://example.com",
    });

    expect(result.success).toBe(true);
    // Should invalidate old tokens
    expect(db.invalidateUserResetTokens).toHaveBeenCalledWith(1);
    // Should create new token
    expect(db.createPasswordResetToken).toHaveBeenCalledWith(
      1,
      expect.any(String),
      expect.any(Date)
    );
    // Should send email with reset URL
    expect(email.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test User",
        email: "test@example.com",
        resetUrl: expect.stringContaining("https://example.com/reset-password?token="),
        expiresInMinutes: 30,
      })
    );
  });

  it("validates email format", async () => {
    const caller = createCaller();

    await expect(
      caller.auth.forgotPassword({ email: "not-an-email", origin: "https://example.com" })
    ).rejects.toThrow();
  });
});

describe("auth.resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid token", async () => {
    vi.mocked(db.getPasswordResetToken).mockResolvedValue(undefined);
    const caller = createCaller();

    await expect(
      caller.auth.resetPassword({ token: "invalid-token", password: "newpassword123" })
    ).rejects.toThrow("Invalid or expired reset link");
  });

  it("rejects already-used token", async () => {
    vi.mocked(db.getPasswordResetToken).mockResolvedValue({
      id: 1,
      userId: 1,
      token: "used-token",
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: new Date(), // Already used
      createdAt: new Date(),
    });
    const caller = createCaller();

    await expect(
      caller.auth.resetPassword({ token: "used-token", password: "newpassword123" })
    ).rejects.toThrow("already been used");
  });

  it("rejects expired token", async () => {
    vi.mocked(db.getPasswordResetToken).mockResolvedValue({
      id: 1,
      userId: 1,
      token: "expired-token",
      expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
      usedAt: null,
      createdAt: new Date(),
    });
    const caller = createCaller();

    await expect(
      caller.auth.resetPassword({ token: "expired-token", password: "newpassword123" })
    ).rejects.toThrow("expired");
  });

  it("resets password with valid token", async () => {
    vi.mocked(db.getPasswordResetToken).mockResolvedValue({
      id: 1,
      userId: 1,
      token: "valid-token",
      expiresAt: new Date(Date.now() + 3600000), // Valid for 1 more hour
      usedAt: null,
      createdAt: new Date(),
    });
    vi.mocked(db.getUserById).mockResolvedValue(mockUser);
    vi.mocked(db.updateUserPassword).mockResolvedValue(undefined);
    vi.mocked(db.markPasswordResetTokenUsed).mockResolvedValue(undefined);
    vi.mocked(db.invalidateUserResetTokens).mockResolvedValue(undefined);
    const caller = createCaller();

    const result = await caller.auth.resetPassword({
      token: "valid-token",
      password: "newpassword123",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("reset successfully");
    // Should update password
    expect(db.updateUserPassword).toHaveBeenCalledWith(1, expect.any(String));
    // Should mark token as used
    expect(db.markPasswordResetTokenUsed).toHaveBeenCalledWith(1);
    // Should invalidate all other tokens
    expect(db.invalidateUserResetTokens).toHaveBeenCalledWith(1);
  });

  it("rejects password shorter than 8 characters", async () => {
    const caller = createCaller();

    await expect(
      caller.auth.resetPassword({ token: "valid-token", password: "short" })
    ).rejects.toThrow();
  });

  it("rejects if user no longer exists", async () => {
    vi.mocked(db.getPasswordResetToken).mockResolvedValue({
      id: 1,
      userId: 999,
      token: "valid-token",
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: null,
      createdAt: new Date(),
    });
    vi.mocked(db.getUserById).mockResolvedValue(undefined);
    const caller = createCaller();

    await expect(
      caller.auth.resetPassword({ token: "valid-token", password: "newpassword123" })
    ).rejects.toThrow("User account not found");
  });
});
