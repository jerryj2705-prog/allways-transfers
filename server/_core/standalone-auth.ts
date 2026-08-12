/**
 * Standalone Authentication Module
 * Email/password authentication using bcrypt + JWT
 */

import { COOKIE_NAME, SESSION_SHORT_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import bcrypt from "bcryptjs";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

const BCRYPT_ROUNDS = 12;

export type SessionPayload = {
  userId: number;
  email: string;
  role: string;
};

// ─── Password Helpers ───

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT Session Helpers ───

function getSessionSecret() {
  const secret = ENV.cookieSecret;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  user: { id: number; email: string; role: string },
  options: { expiresInMs?: number } = {}
): Promise<string> {
  const issuedAt = Date.now();
  const expiresInMs = options.expiresInMs ?? SESSION_SHORT_MS;
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
  const secretKey = getSessionSecret();

  return new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

export async function verifySession(
  cookieValue: string | undefined | null
): Promise<SessionPayload | null> {
  if (!cookieValue) {
    return null;
  }

  try {
    const secretKey = getSessionSecret();
    const { payload } = await jwtVerify(cookieValue, secretKey, {
      algorithms: ["HS256"],
    });
    const { userId, email, role } = payload as Record<string, unknown>;

    if (
      typeof userId !== "number" ||
      typeof email !== "string" ||
      typeof role !== "string"
    ) {
      console.warn("[Auth] Session payload missing required fields");
      return null;
    }

    return { userId, email, role };
  } catch (error) {
    console.warn("[Auth] Session verification failed", String(error));
    return null;
  }
}

// ─── Request Authentication ───

function parseCookies(cookieHeader: string | undefined) {
  if (!cookieHeader) {
    return new Map<string, string>();
  }
  const parsed = parseCookieHeader(cookieHeader);
  return new Map(Object.entries(parsed));
}

export async function authenticateRequest(req: Request): Promise<User> {
  const cookies = parseCookies(req.headers.cookie);
  const sessionCookie = cookies.get(COOKIE_NAME);
  const session = await verifySession(sessionCookie);

  if (!session) {
    throw ForbiddenError("Invalid session cookie");
  }

  const user = await db.getUserById(session.userId);

  if (!user) {
    throw ForbiddenError("User not found");
  }

  // Update "last signed in" at most once per user per throttle window instead
  // of on every request, and do it in the background so it never blocks the
  // response or adds a DB write to every authenticated call.
  maybeTouchLastSignedIn(user.id);

  return user;
}

// Throttle last-signed-in updates: userId -> last write timestamp (ms).
const LAST_SIGNED_IN_THROTTLE_MS = 15 * 60 * 1000; // 15 minutes
const lastSignedInWrites = new Map<number, number>();

function maybeTouchLastSignedIn(userId: number): void {
  if (process.env.NODE_ENV === "test") return;
  const now = Date.now();
  const last = lastSignedInWrites.get(userId) ?? 0;
  if (now - last < LAST_SIGNED_IN_THROTTLE_MS) return;
  lastSignedInWrites.set(userId, now);
  // Fire-and-forget; a failed timestamp update must not fail the request.
  Promise.resolve(db.updateUserLastSignedIn(userId)).catch(() => {
    // Allow a retry on the next request if this write failed.
    lastSignedInWrites.delete(userId);
  });
}
