import type { Express } from "express";

/**
 * Kept as a no-op compatibility export for the starter template. School ERP
 * deliberately does not expose third-party OAuth routes.
 */
export function registerOAuthRoutes(_app: Express) {
  return undefined;
}
