import sql from "@/lib/db";

export async function getAdminTalents() {
  try {
    const users = await sql`
      SELECT
        talents.*,
        users.referred_by,
        ref.user_id AS referrer_user_id,
        ref_users.email AS referrer_email,
        COALESCE(
          NULLIF(
            TRIM(
              CONCAT(
                COALESCE(ref_talents.first_name, ''),
                ' ',
                COALESCE(ref_talents.last_name, '')
              )
            ),
            ''
          ),
          ref.user_id
        ) AS referrer_name
      FROM goodhive.talents AS talents
      LEFT JOIN goodhive.users AS users ON users.userid = talents.user_id
      LEFT JOIN goodhive.referrals AS ref ON ref.referral_code = users.referred_by
      LEFT JOIN goodhive.talents AS ref_talents ON ref_talents.user_id = ref.user_id
      LEFT JOIN goodhive.users AS ref_users ON ref_users.userid = ref.user_id
    `;
    return users;
  } catch (error) {
    console.log("Error retrieving data:", error);
    throw new Error("Failed to fetch data from the server");
  }
}
