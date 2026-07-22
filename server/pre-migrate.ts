import { ensureWantIntegrity } from "./bootstrap.js";
import { pool } from "./db.js";

async function prepareDatabase(): Promise<void> {
  await ensureWantIntegrity();
  console.log("[pre-migrate] database prepared");
}

prepareDatabase()
  .catch((error) => {
    console.error("[pre-migrate] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
