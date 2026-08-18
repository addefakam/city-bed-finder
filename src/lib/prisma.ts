import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Ensures the GuestReport table exists in the shared database.
 * Safe to call multiple times — uses CREATE TABLE IF NOT EXISTS.
 * Called once at cold start from the availability API.
 */
let _ensured = false;
export async function ensureReportTable() {
  if (_ensured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GuestReport" (
        "id"            TEXT NOT NULL PRIMARY KEY,
        "providerId"    TEXT NOT NULL,
        "providerName"  TEXT NOT NULL DEFAULT '',
        "reporterName"  TEXT NOT NULL DEFAULT '',
        "reporterPhone" TEXT NOT NULL DEFAULT '',
        "issue"         TEXT NOT NULL,
        "description"   TEXT NOT NULL DEFAULT '',
        "resolved"      BOOLEAN NOT NULL DEFAULT false,
        "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "GuestReport_providerId_idx" ON "GuestReport"("providerId");
      CREATE INDEX IF NOT EXISTS "GuestReport_resolved_idx"   ON "GuestReport"("resolved");
      CREATE INDEX IF NOT EXISTS "GuestReport_createdAt_idx"  ON "GuestReport"("createdAt");
    `);
    _ensured = true;
    console.log("[guest-app] GuestReport table ensured");
  } catch (err) {
    console.error("[guest-app] Failed to ensure GuestReport table:", err);
  }
}
