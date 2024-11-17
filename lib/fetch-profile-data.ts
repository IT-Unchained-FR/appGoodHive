import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

export async function getProfileData(userId: string) {
  if (!userId) {
    return {};
  }

  try {
    const talent = await sql`
      SELECT * 
      FROM goodhive.talents 
      WHERE user_id = ${userId};
    `;

    if (talent.length === 0) {
      return {};
    }

    // Search For User
    const user = await sql`
      SELECT * 
      FROM goodhive.users 
      WHERE userid = ${userId};
    `;

    if (talent.length === 0) {
      return {};
    }

    const profileUser = user[0];

    const getStatus = (status: string, isActive: boolean) => {
      return isActive ? status : "pending";
    };

    const talentData = {
      ...talent[0],
      talent_status: getStatus(profileUser.talent_status, talent[0].talent),
      mentor_status: getStatus(profileUser.mentor_status, talent[0].mentor),
      recruiter_status: getStatus(
        profileUser.recruiter_status,
        talent[0].recruiter,
      ),
    };

    return talentData;
  } catch (error) {
    console.log("Error retrieving data:", error);
    throw new Error("Failed to fetch data from the server");
  }
}
