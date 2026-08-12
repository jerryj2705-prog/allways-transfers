/**
 * Lightweight in-memory rate limiter for tRPC procedures.
 *
 * Uses a fixed-window counter keyed by client IP (plus an optional key
 * prefix so different endpoints have independent budgets). This is
 * sufficient for a single-instance deployment (e.g. Hostinger VPS).
 * For a multi-instance/clustered deployment, swap the in-memory store
 * for a shared store such as Redis.
 */
import { TRPCError } from "@trpc/server";
import { initTRPC } from "@trpc/server";
import type { TrpcContext } from "./context";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodically purge expired buckets to prevent unbounded memory growth.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt <= now) buckets.delete(key);
  });
}, CLEANUP_INTERVAL_MS).unref?.();

function getClientKey(req: TrpcContext["req"], prefix: string): string {
  // req.ip respects Express `trust proxy`. Fall back to socket address.
  const ip =
    (req as { ip?: string }).ip ||
    req.socket?.remoteAddress ||
    "unknown";
  return `${prefix}:${ip}`;
}

const t = initTRPC.context<TrpcContext>().create();

/**
 * Create a tRPC middleware that enforces `max` requests per `windowMs`
 * per client IP for the endpoints it is attached to.
 */
export function rateLimit(options: {
  windowMs: number;
  max: number;
  prefix: string;
  message?: string;
}) {
  const { windowMs, max, prefix, message } = options;
  return t.middleware(async ({ ctx, next }) => {
    // Disable rate limiting in the test environment.
    if (process.env.VITEST || process.env.NODE_ENV === "test") {
      return next();
    }
    const key = getClientKey(ctx.req, prefix);
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      bucket.count += 1;
      if (bucket.count > max) {
        const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            message ??
            `Too many attempts. Please try again in ${retryAfterSec} seconds.`,
        });
      }
    }

    return next();
  });
}
