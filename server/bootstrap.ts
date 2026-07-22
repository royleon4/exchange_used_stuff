import { eq } from "drizzle-orm";
import { siteSettings, users } from "../shared/schema.js";
import { hashPassword, verifyPassword } from "./auth.js";
import { db, pool } from "./db.js";

const DEFAULT_ADMIN_PASSWORD = "admin123";
const LEGACY_ADMIN_PASSWORD = "adim123";

export async function ensureWantIntegrity(): Promise<void> {
  const exists = await pool.query<{ table_name: string | null }>(
    "SELECT to_regclass('public.post_wants')::text AS table_name",
  );
  if (!exists.rows[0]?.table_name) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Replit may keep the previous deployment alive while the new version starts.
    // Lock the table so the old instance cannot add another duplicate between
    // cleanup and unique-index creation.
    await client.query("LOCK TABLE post_wants IN ACCESS EXCLUSIVE MODE");

    // A previously interrupted index creation can leave an unusable index name.
    // Recreate both indexes after the data has been normalized.
    await client.query("DROP INDEX IF EXISTS post_wants_user_post_unique");
    await client.query("DROP INDEX IF EXISTS post_wants_anon_post_unique");

    await client.query(`
      DELETE FROM post_wants
      WHERE id IN (
        SELECT id
        FROM (
          SELECT
            id,
            ROW_NUMBER() OVER (
              PARTITION BY user_id, post_id
              ORDER BY id
            ) AS duplicate_number
          FROM post_wants
          WHERE user_id IS NOT NULL
        ) duplicates
        WHERE duplicate_number > 1
      )
    `);

    await client.query(`
      DELETE FROM post_wants
      WHERE id IN (
        SELECT id
        FROM (
          SELECT
            id,
            ROW_NUMBER() OVER (
              PARTITION BY anon_id, post_id
              ORDER BY id
            ) AS duplicate_number
          FROM post_wants
          WHERE anon_id IS NOT NULL
        ) duplicates
        WHERE duplicate_number > 1
      )
    `);

    await client.query(`
      CREATE UNIQUE INDEX post_wants_user_post_unique
      ON post_wants (user_id, post_id)
      WHERE user_id IS NOT NULL
    `);
    await client.query(`
      CREATE UNIQUE INDEX post_wants_anon_post_unique
      ON post_wants (anon_id, post_id)
      WHERE anon_id IS NOT NULL
    `);

    await client.query("COMMIT");
    console.log("[bootstrap] want records checked");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function ensureInitialData(): Promise<void> {
  await ensureWantIntegrity();

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
