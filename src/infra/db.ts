import { Pool, type PoolConfig } from "pg";

/**
 * Builds a Postgres connection pool from environment variables.
 * Accepts either a single DATABASE_URL, or discrete PG* variables —
 * whichever is set. See .env.example for both forms.
 */
export function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  const config: PoolConfig = connectionString
    ? { connectionString }
    : {
        host: process.env.PGHOST ?? "localhost",
        port: Number(process.env.PGPORT ?? 5432),
        user: process.env.PGUSER ?? "postgres",
        password: process.env.PGPASSWORD ?? "postgres",
        database: process.env.PGDATABASE ?? "devmemory",
      };

  const pool = new Pool(config);

  pool.on("error", (err) => {
    // A background client emitted an error (e.g. connection dropped).
    // Log and keep the process alive; the pool will hand out a fresh
    // connection on the next query.
    console.error("[db] unexpected error on idle client", err);
  });

  return pool;
}
