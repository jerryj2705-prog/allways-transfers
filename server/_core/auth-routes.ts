/**
 * Standalone Auth Routes
 * Direct authentication endpoints for the application.
 * The actual login/register logic is handled via tRPC procedures,
 * but we keep this file for any additional Express-level auth routes
 * (e.g., password reset callbacks in the future).
 */

import type { Express } from "express";

export function registerAuthRoutes(app: Express) {
  // Health check for auth system
  app.get("/api/auth/health", (_req, res) => {
    res.json({ ok: true, method: "standalone" });
  });

  // Legacy OAuth callback - redirect to login page
  app.get("/api/oauth/callback", (_req, res) => {
    res.redirect(302, "/login");
  });
}
