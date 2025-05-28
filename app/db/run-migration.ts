import postgres from "postgres";
import fs from "fs";
import path from "path";

async function runMigration() {
  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "migrations",
      "add_user_columns.sql",
    );
    const migration = fs.readFileSync(migrationPath, "utf8");

    // Run the migration
    await sql.unsafe(migration);

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Error running migration:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the migration
runMigration().catch(console.error);
