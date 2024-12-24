import postgres from "postgres";

export async function POST(request: Request) {
  const { userId, approvalTypes } = await request.json();

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  try {
    await sql`
      UPDATE goodhive.talents
      SET
        approved = true,
        talent = ${approvalTypes.talent},
        mentor = ${approvalTypes.mentor},
        recruiter = ${approvalTypes.recruiter},
        inReview = false
      WHERE user_id = ${userId}
    `;

    await sql`
      UPDATE goodhive.users
      SET 
      talent_status = CASE 
        WHEN ${approvalTypes.talent} IS TRUE THEN 'approved'
        WHEN ${approvalTypes.talent} IS FALSE THEN 'pending'
        ELSE talent_status  -- Preserve existing status if not explicitly set
      END,
      mentor_status = CASE 
        WHEN ${approvalTypes.mentor} IS TRUE THEN 'approved'
        WHEN ${approvalTypes.mentor} IS FALSE THEN 'pending'
        ELSE mentor_status
      END,
      recruiter_status = CASE 
        WHEN ${approvalTypes.recruiter} IS TRUE THEN 'approved'
        WHEN ${approvalTypes.recruiter} IS FALSE THEN 'pending'
        ELSE recruiter_status
      END
      WHERE userid = ${userId}  -- Assuming this matches your schema
    `;

    return new Response(
      JSON.stringify({ message: "Approved talent successfully" }),
    );
  } catch (error) {
    console.log(error);
    return new Response(
      JSON.stringify({ message: "Unable to approve the talent" }),
      {
        status: 500,
      },
    );
  }
}
