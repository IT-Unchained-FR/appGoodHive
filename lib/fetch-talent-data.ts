import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

export async function getPendingTalents() {
  try {
    const users = await sql`
      SELECT 
          talents.*, 
          users.referred_by 
      FROM 
          goodhive.talents AS talents
      JOIN 
          goodhive.users AS users
      ON 
          talents.user_id = users.userid
      WHERE 
          talents.inReview = true;
        `;
    return users;
  } catch (error) {
    console.log("Error retrieving data:", error);
    throw new Error("Failed to fetch data from the server");
  }
}
