import { eq } from "drizzle-orm";
import { siteSettings, users } from "../shared/schema.js";
import { hashPassword, verifyPassword } from "./auth.js";
import { db } from "./db.js";

const DEFAULT_ADMIN_PASSWORD = "admin123";
const LEGACY_ADMIN_PASSWORD = "adim123";

export async function ensureInitialData(): Promise<void> {
  const [settings] = await db.select({ id: siteSettings.id }).from(siteSettings).limit(1);
  if (!settings) {
    await db.insert(siteSettings).values({ id: 1 });
    console.log("[bootstrap] site settings created");
  }

  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase() || "admin";
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim();
  const password = configuredPassword && configuredPassword !== LEGACY_ADMIN_PASSWORD
    ? configuredPassword
    : DEFAULT_ADMIN_PASSWORD;
  const nickname = process.env.ADMIN_NICKNAME?.trim() || "系統管理員";

  const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!existing) {
    await db.insert(users).values({
      username,
      passwordHash: await hashPassword(password),
      nickname,
      role: "admin",
      isActive: true,
    });
    console.log(`[bootstrap] admin created: ${username}`);
    return;
  }

  const needsPromotion = existing.role !== "admin" || !existing.isActive;
  const usesLegacyDefault = await verifyPassword(LEGACY_ADMIN_PASSWORD, existing.passwordHash);

  if (needsPromotion || usesLegacyDefault) {
    await db
      .update(users)
      .set({
        ...(needsPromotion ? { nickname, role: "admin" as const, isActive: true } : {}),
        ...(needsPromotion || usesLegacyDefault ? { passwordHash: await hashPassword(password) } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));

    console.log(
      usesLegacyDefault
        ? `[bootstrap] legacy admin password migrated: ${username}`
        : `[bootstrap] existing account promoted to admin: ${username}`,
    );
  }
}
