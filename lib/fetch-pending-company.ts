import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

export async function getPendingCompanies() {
  try {
    const users = await sql`
      SELECT *
      FROM goodhive.companies
      WHERE inReview = true
      `;
    return users;
  } catch (error) {
    console.log("Error retrieving data:", error);
    throw new Error("Failed to fetch data from the server");
  }
}
