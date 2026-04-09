import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySession } from "./_core/standalone-auth";
import { SESSION_SHORT_MS, SESSION_LONG_MS } from "@shared/const";
import { jwtVerify } from "jose";

describe("standalone-auth: password hashing", () => {
  it("hashes a password and verifies it correctly", async () => {
    const password = "TestPassword123!";
    const hash = await hashPassword(password);

    expect(hash).toBeTruthy();
    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("CorrectPassword");
    const isValid = await verifyPassword("WrongPassword", hash);
    expect(isValid).toBe(false);
  });

  it("produces different hashes for the same password (salt)", async () => {
    const password = "SamePassword";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(hash1).not.toBe(hash2);
  });
});

describe("standalone-auth: JWT session tokens", () => {
  it("creates and verifies a session token", async () => {
    const user = { id: 42, email: "test@example.com", role: "user" };
    const token = await createSessionToken(user);

    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");

    const session = await verifySession(token);
    expect(session).not.toBeNull();
    expect(session!.userId).toBe(42);
    expect(session!.email).toBe("test@example.com");
    expect(session!.role).toBe("user");
  });

  it("creates admin session token with correct role", async () => {
    const admin = { id: 1, email: "admin@example.com", role: "admin" };
    const token = await createSessionToken(admin);
    const session = await verifySession(token);

    expect(session).not.toBeNull();
    expect(session!.role).toBe("admin");
  });

  it("returns null for invalid token", async () => {
    const session = await verifySession("invalid-token-string");
    expect(session).toBeNull();
  });

  it("returns null for empty/undefined cookie", async () => {
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession(null)).toBeNull();
    expect(await verifySession("")).toBeNull();
  });
});

describe("standalone-auth: remember me token expiry", () => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "test-secret-key-for-vitest-runs-only");
  const user = { id: 99, email: "remember@example.com", role: "user" };

  it("default token expires in ~24 hours (SESSION_SHORT_MS)", async () => {
    const token = await createSessionToken(user);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });

    const nowSec = Math.floor(Date.now() / 1000);
    const expSec = payload.exp as number;
    const diffMs = (expSec - nowSec) * 1000;

    // Should be close to SESSION_SHORT_MS (24h), allow 5 seconds tolerance
    expect(diffMs).toBeGreaterThan(SESSION_SHORT_MS - 5000);
    expect(diffMs).toBeLessThanOrEqual(SESSION_SHORT_MS + 1000);
  });

  it("remember-me token expires in ~30 days (SESSION_LONG_MS)", async () => {
    const token = await createSessionToken(user, { expiresInMs: SESSION_LONG_MS });
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });

    const nowSec = Math.floor(Date.now() / 1000);
    const expSec = payload.exp as number;
    const diffMs = (expSec - nowSec) * 1000;

    // Should be close to SESSION_LONG_MS (30 days), allow 5 seconds tolerance
    expect(diffMs).toBeGreaterThan(SESSION_LONG_MS - 5000);
    expect(diffMs).toBeLessThanOrEqual(SESSION_LONG_MS + 1000);
  });

  it("short-lived token is much shorter than long-lived token", async () => {
    const shortToken = await createSessionToken(user, { expiresInMs: SESSION_SHORT_MS });
    const longToken = await createSessionToken(user, { expiresInMs: SESSION_LONG_MS });

    const { payload: shortPayload } = await jwtVerify(shortToken, secret, { algorithms: ["HS256"] });
    const { payload: longPayload } = await jwtVerify(longToken, secret, { algorithms: ["HS256"] });

    const shortExp = shortPayload.exp as number;
    const longExp = longPayload.exp as number;

    // Long token should expire ~364 days after short token
    const diffDays = (longExp - shortExp) / (60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(363);
    expect(diffDays).toBeLessThan(365);
  });
});

describe("standalone-auth: login/register via tRPC", () => {
  // These tests use the tRPC caller directly
  it("login rejects empty credentials via zod validation", async () => {
    const { appRouter } = await import("./routers");
    const ctx = {
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {
        clearCookie: () => {},
        cookie: () => {},
      } as any,
    };
    const caller = appRouter.createCaller(ctx);

    // Empty email should fail zod validation
    await expect(
      caller.auth.login({ email: "", password: "test" })
    ).rejects.toThrow();
  });

  it("login accepts rememberMe parameter without validation error", async () => {
    const { appRouter } = await import("./routers");
    const ctx = {
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {
        clearCookie: () => {},
        cookie: () => {},
      } as any,
    };
    const caller = appRouter.createCaller(ctx);

    // Should fail with "Invalid email or password" (not a validation error),
    // proving rememberMe is accepted by the schema
    await expect(
      caller.auth.login({ email: "nobody@example.com", password: "test123", rememberMe: true })
    ).rejects.toThrow("Invalid email or password");
  });

  it("register rejects short password via zod validation", async () => {
    const { appRouter } = await import("./routers");
    const ctx = {
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {
        clearCookie: () => {},
        cookie: () => {},
      } as any,
    };
    const caller = appRouter.createCaller(ctx);

    // Password too short (< 8 chars)
    await expect(
      caller.auth.register({ name: "Test", email: "test@example.com", password: "short" })
    ).rejects.toThrow();
  });

  it("register rejects invalid email via zod validation", async () => {
    const { appRouter } = await import("./routers");
    const ctx = {
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {
        clearCookie: () => {},
        cookie: () => {},
      } as any,
    };
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({ name: "Test", email: "not-an-email", password: "ValidPass123" })
    ).rejects.toThrow();
  });
});
