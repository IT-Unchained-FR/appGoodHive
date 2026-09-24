// One-off import of content/superbot-knowledge/*.md into goodhive.knowledge_base_files.
// Run once per environment after applying db/migrations/add-knowledge-base-files.sql:
//   pnpm seed:knowledge-base
// Safe to re-run: existing slugs are skipped (ON CONFLICT DO NOTHING) so it never
// overwrites content an admin has since edited.

import fs from "fs";
import path from "path";
import postgres from "postgres";

const KNOWLEDGE_FILES = [
  "general.md",
  "getting-started.md",
  "pricing.md",
  "jobs.md",
  "technical.md",
  "payments.md",
  "security.md",
  "support.md",
] as const;

async function seed() {
  const connectionString =
    process.env.DATABASE_URL_RAG_CHATBOT ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL_RAG_CHATBOT or DATABASE_URL is not set");
  }

  const isLocalConnection =
    connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  const sql = postgres(connectionString, isLocalConnection ? {} : { ssl: { rejectUnauthorized: false } });

  const dir = path.join(process.cwd(), "content", "superbot-knowledge");

  try {
    for (const fileName of KNOWLEDGE_FILES) {
      const filePath = path.join(dir, fileName);
      if (!fs.existsSync(filePath)) {
        console.warn(`Skipping ${fileName} — not found at ${filePath}`);
        continue;
      }

      const raw = fs.readFileSync(filePath, "utf-8");
      const slug = fileName.replace(/\.md$/, "");
      const headingLine = raw.split("\n").find((line) => line.startsWith("# "));
      const title = headingLine ? headingLine.replace(/^#\s+/, "").trim() : slug;

      const result = await sql`
        INSERT INTO goodhive.knowledge_base_files (slug, title, content, updated_by)
        VALUES (${slug}, ${title}, ${raw}, 'seed-script')
        ON CONFLICT (slug) DO NOTHING
        RETURNING slug;
      `;

      console.log(result.length > 0 ? `Inserted: ${slug}` : `Skipped (already exists): ${slug}`);
    }
    console.log("Seed complete.");
  } finally {
    await sql.end();
  }
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
