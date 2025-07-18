import postgres from "postgres";

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
      description,
      first_name,
      last_name,
      country,
      city,
      phone_country_code,
      phone_number,
      email,
      about_work,
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
    // Get user_id from query parameters
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Fetch talent profile data from database
    const talents = await sql`
      SELECT 
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
        approved,
        inReview,
        user_id
      FROM goodhive.talents 
      WHERE user_id = ${user_id}
    `;

    if (talents.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profileData = talents[0];

    // No need to decode - fields are stored as character varying in the database

    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Error in my-profile API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
