import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const isLocalConnection =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");

// Production: 10 connections per instance (prod DB, safe headroom).
// Preview: 5 connections (dev DB, shared with local dev — enough for Vercel concurrency).
// Local dev: 3 connections (dev DB, multiple local instances may run simultaneously).
const vercelEnv = process.env.VERCEL_ENV; // "production" | "preview" | undefined (local)
const maxConnections = vercelEnv === "production" ? 10 : vercelEnv === "preview" ? 5 : 3;

const options = isLocalConnection
  ? {}
  : {
      ssl: {
        rejectUnauthorized: false,
      },
      max: maxConnections,
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
