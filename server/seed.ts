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

  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const nickname = process.env.ADMIN_NICKNAME?.trim() || "婚禮小幫手";
  if (!username || !password) {
    console.log("[seed] ADMIN_USERNAME or ADMIN_PASSWORD not set; admin was not created");
    return;
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (!existing) {
    await db.insert(users).values({
      username,
      passwordHash: await hashPassword(password),
      nickname,
      role: "admin",
    });
    console.log("[seed] admin created");
  }
}

seed()
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
