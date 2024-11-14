import postgres from "postgres";

import type { NextRequest } from "next/server";

// Force the browser to always fetch the latest data from the server
export const fetchCache = "force-no-store";
export const revalidate = 0;
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
    // referralCode,
    availability,
    user_id,
  } = await request.json();

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  try {
    const fields = {
      title,
      description,
      first_name: first_name,
      last_name: last_name,
      country,
      city,
      phone_country_code: phone_country_code,
      phone_number: phone_number,
      email,
      about_work: about_work,
      rate,
      skills,
      image_url: image_url,
      cv_url: cv_url,
      telegram,
      linkedin,
      github,
      stackoverflow,
      twitter,
      portfolio,
      freelance_only: freelance_only,
      remote_only: remote_only,
      talent,
      mentor,
      recruiter,
      hide_contact_details: hide_contact_details,
      availability,
      wallet_address: wallet_address,
      user_id,
    };

    console.log(fields, "fields");

    // spell-checker: disable
    const query = `
      INSERT INTO goodhive.talents (
      ${Object.entries(fields)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key]) => key)
        .join(", ")}
      ) VALUES (
      ${Object.entries(fields)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([, value]) => (typeof value === "string" ? `'${value}'` : value))
        .join(", ")}
      )
    `;

    const formattedQuery = query.replace(/\s+/g, " ").trim();
    console.log(formattedQuery, "query");
    // await sql.unsafe(formattedQuery);

    return new Response(
      JSON.stringify({ message: "Data inserted or updated successfully" }),
    );
  } catch (error) {
    console.error("Error inserting or updating data:", error);

    return new Response(
      JSON.stringify({ message: "Error inserting or updating data" }),
      {
        status: 500,
      },
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParamsEntries = request.nextUrl.searchParams.entries();
  const searchParams = Object.fromEntries(searchParamsEntries);

  // FIXME: use snake_case instead of camelCase
  const { walletAddress } = searchParams;

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  if (!walletAddress) {
    return new Response(
      JSON.stringify({ message: "Missing walletAddress parameter" }),
      {
        status: 404,
      },
    );
  }

  try {
    const user = await sql`
      SELECT *
      FROM goodhive.users
      WHERE wallet_address = ${walletAddress}
    `;

    if (user.length === 0) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(user[0]));
  } catch (error) {
    console.error("Error retrieving data:", error);

    return new Response(JSON.stringify({ message: "Error retrieving data" }), {
      status: 500,
    });
  }
}
