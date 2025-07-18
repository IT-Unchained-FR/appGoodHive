import postgres from "postgres";

import { getSessionUser } from "@/lib/auth/sessionUtils";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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
  } catch (error: any) {
    if (
      error.code === "23505" &&
      error.constraint_name === "talents_email_key"
    ) {
      return new Response(
        JSON.stringify({ message: "This email address is already registered" }),
        { status: 400 },
      );
    }

    return new Response(
      JSON.stringify({ message: "Error inserting or updating data" }),
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Use user.user_id, user.email, user.wallet_address from JWT payload
    // instead of reading from client-side cookies

    // Your existing logic here...
  } catch (error) {
    console.error("Error in my-profile API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
