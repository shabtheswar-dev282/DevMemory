import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createPool } from "../src/infra/db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const schemaPath = join(__dirname, "..", "db", "schema.sql");
  const sql = readFileSync(schemaPath, "utf-8");

  const pool = createPool();
  try {
    await pool.query(sql);
    console.log("[migrate] schema applied successfully");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[migrate] failed", err);
  process.exit(1);
});
