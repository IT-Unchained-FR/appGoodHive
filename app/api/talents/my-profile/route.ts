import postgres from "postgres";

import type { NextRequest, NextResponse } from "next/server";

export async function POST(request: Request) {
  const {
    title,
    jobHeadline,
    firstName,
    lastName,
    country,
    city,
    phoneCountryCode,
    phoneNumber,
    email,
    telegram,
    aboutWork,
    chain,
    currency,
    rate,
    skills,
    imageUrl,
    walletAddress,
  } = await request.json();

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  try {
    await sql`
      INSERT INTO goodhive.users (
        title,
        job_headline,
        first_name,
        last_name,
        country,
        city,
        phone_country_code,
        phone_number,
        email,
        telegram,
        about_work,
        chain,
        currency,
        rate,
        skills,
        image_url,
        wallet_address
      ) VALUES (
        ${title},
        ${jobHeadline},
        ${firstName},
        ${lastName},
        ${country},
        ${city},
        ${phoneCountryCode},
        ${phoneNumber},
        ${email},
        ${telegram},
        ${aboutWork},
        ${chain},
        ${currency},
        ${rate},
        ${skills},
        ${imageUrl},
        ${walletAddress}
      );
    `;

    return new Response(
      JSON.stringify({ message: "Data inserted successfully" })
    );
  } catch (error) {
    console.error("Error inserting data:", error);

    return new Response(JSON.stringify({ message: "Error inserting data" }), {
      status: 500,
    });
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
      }
    );
    return;
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
