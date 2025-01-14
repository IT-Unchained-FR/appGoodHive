import postgres from "postgres";

import type { NextRequest } from "next/server";

// Force the browser to always fetch the latest data from the server
export const fetchCache = "force-no-store";
export const revalidate = 0;

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

export async function POST(request: Request) {
  const {
    title,
    description,
    first_name,
    last_name,
    country,
    city,
    phone_country_code,
    phone_number,
    email,
    telegram,
    about_work,
    rate,
    skills,
    image_url,
    cv_url,
    wallet_address,
    linkedin,
    github,
    stackoverflow,
    twitter,
    portfolio,
    freelance_only,
    remote_only,
    talent,
    mentor,
    recruiter,
    hide_contact_details,
    availability,
    user_id,
    validate,
    referred_by,
  } = await request.json();

  try {
    // Filter out undefined, null, and empty string fields
    const fields = {
      title,
      description: description
        ? Buffer.from(description, "utf-8").toString("base64")
        : null,
      first_name,
      last_name,
      country,
      city,
      phone_country_code,
      phone_number,
      email,
      about_work: about_work
        ? Buffer.from(about_work, "utf-8").toString("base64")
        : null,
      rate,
      skills,
      image_url,
      cv_url,
      telegram,
      linkedin,
      github,
      stackoverflow,
      twitter,
      portfolio,
      freelance_only,
      remote_only,
      talent,
      mentor,
      recruiter,
      hide_contact_details,
      availability,
      wallet_address,
      user_id,
      inReview: validate === true ? true : false,
    };

    const filteredFields = Object.entries(fields).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    );

    const columns = filteredFields.map(([key]) => key).join(", ");
    const values = filteredFields.map(([, value]) => value);
    const placeholders = filteredFields
      .map((_, index) => `$${index + 1}`)
      .join(", ");

    const updateSet = filteredFields
      .map(([key], index) => `${key} = $${index + 1}`)
      .join(", ");

    const query = `
      INSERT INTO goodhive.talents (${columns})
      VALUES (${placeholders})
      ON CONFLICT (user_id)
      DO UPDATE SET ${updateSet}
    `;

    await sql.unsafe(query, values);

    if (referred_by) {
      console.log("Referred By Performed");
      await sql`
      UPDATE goodhive.referrals 
      SET talents = ARRAY_APPEND(COALESCE(talents, ARRAY[]::text[]), ${user_id}::text)
      WHERE referral_code = ${referred_by}
      `;
    }

    return new Response(
      JSON.stringify({ message: "Data inserted or updated successfully" }),
    );
  } catch (error) {
    console.error("Error inserting or updating data:", error);

    return new Response(
      JSON.stringify({ message: "Error inserting or updating data" }),
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParamsEntries = request.nextUrl.searchParams.entries();
  const searchParams = Object.fromEntries(searchParamsEntries);

  // FIXME: use snake_case instead of camelCase
  const { user_id } = searchParams;

  console.log(user_id, "user_id");

  try {
    const user = await sql`
      SELECT t.*, u.talent_status, u.mentor_status, u.recruiter_status, u.userid
      FROM goodhive.talents t
      JOIN goodhive.users u ON t.user_id = u.userid
      WHERE t.user_id = ${user_id}
    `;

    console.log(user, "user");

    if (user.length === 0) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    const userProfile = {
      ...user[0],
      description: user[0].description
        ? Buffer.from(user[0].description, "base64").toString("utf-8")
        : null,
      about_work: user[0].about_work
        ? Buffer.from(user[0].about_work, "base64").toString("utf-8")
        : null,
    };

    return new Response(JSON.stringify(userProfile));
  } catch (error) {
    console.error("Error retrieving data:", error);

    return new Response(JSON.stringify({ message: "Error retrieving data" }), {
      status: 500,
    });
  }
}
