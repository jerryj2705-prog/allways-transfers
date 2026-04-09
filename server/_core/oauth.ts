/**
 * DEPRECATED: Manus OAuth routes - No longer used.
 * Auth is now handled by standalone-auth.ts and auth-routes.ts
 * This file is kept as a stub.
 */

import type { Express } from "express";

export function registerOAuthRoutes(_app: Express) {
  // OAuth routes are no longer needed.
  // Login/register is handled via tRPC procedures.
  console.log("[Auth] OAuth routes disabled - using standalone auth");
}
