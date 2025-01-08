import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

export async function getCompanyData(userId: string | undefined) {
  if (!userId) {
    return {};
  }

  try {
    const user = await sql`
      SELECT *
      FROM goodhive.companies
      WHERE user_id = ${userId}
      `;

    if (user.length === 0) {
      return {};
    }
    return user[0];
  } catch (error) {
    console.log("Error retrieving data:", error);
    throw new Error("Failed to fetch data from the server");
  }
}
