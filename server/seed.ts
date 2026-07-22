import { ensureInitialData } from "./bootstrap.js";
import { pool } from "./db.js";

ensureInitialData()
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
