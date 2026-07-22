import { eq } from "drizzle-orm";
import { siteSettings, users } from "../shared/schema.js";
import { hashPassword } from "./auth.js";
import { db, pool } from "./db.js";

async function seed() {
  const [settings] = await db.select({ id: siteSettings.id }).from(siteSettings).limit(1);
  if (!settings) {
    await db.insert(siteSettings).values({ id: 1 });
    console.log("[seed] site settings created");
  }

  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase() || "admin";
  const password = process.env.ADMIN_PASSWORD || "adim123";
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
    console.log(`[seed] admin created: ${username}`);
    return;
  }

  if (existing.role !== "admin" || !existing.isActive) {
    await db
      .update(users)
      .set({
        passwordHash: await hashPassword(password),
        nickname,
        role: "admin",
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    console.log(`[seed] existing account promoted to admin: ${username}`);
  }
}

seed()
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
