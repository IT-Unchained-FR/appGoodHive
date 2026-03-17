import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const isLocalConnection =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");

// Vercel serverless: each lambda is an isolated process — globalThis reuse only helps
// within the same warm instance. Keep max very low so concurrent warm lambdas don't
// exhaust Postgres max_connections.
// Production: 3 per instance (pooler handles concurrency at the DB layer).
// Preview/local: 2 — shared dev DB.
const vercelEnv = process.env.VERCEL_ENV; // "production" | "preview" | undefined (local)
const maxConnections = vercelEnv === "production" ? 5 : 3;

const options = isLocalConnection
  ? {}
  : {
      ssl: {
        rejectUnauthorized: false,
      },
      max: maxConnections,
      // Release idle connections quickly so they don't accumulate across warm lambdas.
      idle_timeout: 10, // seconds before an idle connection is closed
      max_lifetime: 60 * 10, // recycle connections every 10 min
      connect_timeout: 10, // fail fast instead of piling up waiting connections
    };

type SqlClient = ReturnType<typeof postgres>;

declare global {
  // eslint-disable-next-line no-var
  var __postgresClient: SqlClient | undefined;
}

// Reuse the same postgres client across hot-reload (dev) and across warm invocations (Vercel).
const client =
  globalThis.__postgresClient ?? postgres(connectionString, options);

globalThis.__postgresClient = client;

export default client;
