import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const isLocalConnection =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");

const options = isLocalConnection
  ? {}
  : {
      ssl: {
        rejectUnauthorized: false,
      },
      // Limit connections per serverless instance to avoid exhausting PostgreSQL max_connections
      max: 3,
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
