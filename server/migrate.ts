import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";

const MIGRATION_ID = "20260722_repair_post_wants";
const MIGRATION_LOCK_KEY = "2026072201";
const MIGRATION_FILE = fileURLToPath(
  new URL("../drizzle/20260722_repair_post_wants.sql", import.meta.url),
);

async function hasPostWantsTable(): Promise<boolean> {
  const result = await pool.query<{ table_name: string | null }>(
    "SELECT to_regclass('public.post_wants')::text AS table_name",
  );
  return Boolean(result.rows[0]?.table_name);
}

async function hasWantIntegrityObjects(): Promise<boolean> {
  const result = await pool.query<{ index_count: string; constraint_count: string }>(`
    SELECT
      (
        SELECT COUNT(*)::text
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname IN ('post_wants_user_post_unique', 'post_wants_anon_post_unique')
      ) AS index_count,
      (
        SELECT COUNT(*)::text
        FROM pg_constraint
        WHERE conname = 'post_wants_actor_check'
          AND conrelid = 'public.post_wants'::regclass
      ) AS constraint_count
  `);

  return Number(result.rows[0]?.index_count ?? 0) === 2
    && Number(result.rows[0]?.constraint_count ?? 0) === 1;
}

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1::bigint)", [MIGRATION_LOCK_KEY]);

    // A brand-new database must remain completely empty before Drizzle performs
    // its first schema push. Creating app_migrations here makes Drizzle ask
    // whether an application table was renamed from it, which cannot be answered
    // in a non-interactive CI/deployment environment.
    if (!(await hasPostWantsTable())) {
      console.log("[migrate] post_wants does not exist yet; schema sync will create it");
      return;
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS app_migrations (
        id text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    if (await hasWantIntegrityObjects()) {
      await client.query(
        "INSERT INTO app_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
        [MIGRATION_ID],
      );
      console.log("[migrate] post_wants integrity already verified");
      return;
    }

    const migrationSql = await readFile(MIGRATION_FILE, "utf8");
    await client.query("BEGIN");
    try {
      await client.query(migrationSql);
      await client.query(
        "INSERT INTO app_migrations (id) VALUES ($1) ON CONFLICT (id) DO UPDATE SET applied_at = now()",
        [MIGRATION_ID],
      );
      await client.query("COMMIT");
      console.log("[migrate] post_wants duplicates repaired and unique indexes created");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1::bigint)", [MIGRATION_LOCK_KEY]);
    } finally {
      client.release();
    }
  }
}

runMigrations()
  .catch((error) => {
    console.error("[migrate] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
