import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Next.js dev (Turbopack/webpack HMR) re-evaluates this module on nearly every save.
// Without caching the client on globalThis, each reload opens a brand new connection
// pool without closing the old one, silently leaking connections until Supabase's
// pooler (Supavisor session mode, ~15 clients) is exhausted and every query fails.
const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };

const client =
  globalForDb.pgClient ?? postgres(process.env.DATABASE_URL, { prepare: false, max: 10 });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
