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
    const migrationsDirectory = path.join(__dirname, "migrations");
    const migrationFiles = fs
      .readdirSync(migrationsDirectory)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const fileName of migrationFiles) {
      const migrationPath = path.join(migrationsDirectory, fileName);
      const migration = fs.readFileSync(migrationPath, "utf8");
      await sql.unsafe(migration);
      console.log(`Applied migration: ${fileName}`);
    }

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
