import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL_RAG_CHATBOT ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL_RAG_CHATBOT or DATABASE_URL is not set");
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
    };

type SqlClient = ReturnType<typeof postgres>;

declare global {
  // eslint-disable-next-line no-var
  var __ragPostgresClient: SqlClient | undefined;
}

// Reuse the same postgres client during development to avoid reconnecting on every API call.
const client =
  globalThis.__ragPostgresClient ?? postgres(connectionString, options);

if (process.env.NODE_ENV !== "production") {
  globalThis.__ragPostgresClient = client;
}

export default client;
