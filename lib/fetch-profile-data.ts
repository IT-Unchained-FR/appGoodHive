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

    if (user.length === 0) {
      return {};
    }

    const profileUser = user[0];

    console.log(profileUser, "Profile User....");

    const getStatus = (status: string, isActive: boolean) => {
      return isActive ? status : "pending";
    };

    const talentData = {
      ...talent[0],
      description: Buffer.from(talent[0].description, "base64").toString(
        "utf-8",
      ),
      about_work: Buffer.from(talent[0].about_work, "base64").toString("utf-8"),
      talent_status: getStatus(profileUser.talent_status, talent[0].talent),
      mentor_status: getStatus(profileUser.mentor_status, talent[0].mentor),
      recruiter_status: getStatus(
        profileUser.recruiter_status,
        talent[0].recruiter,
      ),
      talent_approved: profileUser.talent_status === "approved" ? true : false,
    };

    return talentData;
  } catch (error) {
    console.log("Error retrieving data:", error);
    throw new Error("Failed to fetch data from the server");
  }
}
