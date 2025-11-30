import sql from "@/lib/db";

export async function getPendingTalents() {
  try {
    const users = await sql`
      SELECT
          talents.*,
          talents.inreview AS "inReview",
          users.referred_by,
          users.approved_roles,
          users.created_at AS user_created_at
      FROM
          goodhive.talents AS talents
      JOIN
          goodhive.users AS users
      ON
          talents.user_id = users.userid
      WHERE
          talents.inreview = true;
        `;
    return users;
  } catch (error) {
    console.log("Error retrieving data:", error);
    throw new Error("Failed to fetch data from the server");
  }
}
