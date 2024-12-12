import postgres from "postgres";
import type { NextRequest } from "next/server";

export async function POST(request: Request) {
  const {
    user_id,
    headline,
    designation,
    address,
    country,
    city,
    phoneCountryCode,
    phoneNumber,
    email,
    telegram,
    imageUrl,
    walletAddress,
    linkedin,
    github,
    stackoverflow,
    twitter,
    portfolio,
    status,
    referralCode,
  } = await request.json();

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  if (!user_id) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    await sql`
      INSERT INTO goodhive.companies (
        headline,
        user_id,
        designation,
        address,
        country,
        city,
        phone_country_code,
        phone_number,
        email,
        telegram,
        image_url,
        linkedin,
        github,
        stackoverflow,
        twitter,
        portfolio,
        status,
        wallet_address
      ) VALUES (
        ${headline},
        ${user_id},
        ${designation},
        ${address},
        ${country},
        ${city},
        ${phoneCountryCode},
        ${phoneNumber},
        ${email},
        ${telegram},
        ${imageUrl},
        ${linkedin},
        ${github},
        ${stackoverflow},
        ${twitter},
        ${portfolio},
        ${status},
        ${walletAddress}
      )
      ON CONFLICT (user_id) DO UPDATE
      SET headline = EXCLUDED.headline,
          designation = EXCLUDED.designation,
          address = EXCLUDED.address,
          country = EXCLUDED.country,
          city = EXCLUDED.city,
          phone_country_code = EXCLUDED.phone_country_code,
          phone_number = EXCLUDED.phone_number,
          email = EXCLUDED.email,
          telegram = EXCLUDED.telegram,
          image_url = EXCLUDED.image_url,
          linkedin = EXCLUDED.linkedin,
          github = EXCLUDED.github,
          stackoverflow = EXCLUDED.stackoverflow,
          twitter = EXCLUDED.twitter,
          portfolio = EXCLUDED.portfolio,
          status = EXCLUDED.status,
          wallet_address = EXCLUDED.wallet_address;
    `;

    return new Response(
      JSON.stringify({ message: "Data inserted successfully" }),
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

  const { userId } = searchParams;

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  if (!userId) {
    return new Response(
      JSON.stringify({ message: "Missing user id parameter" }),
      {
        status: 404,
      },
    );
  }

  try {
    const company = await sql`
        SELECT *
        FROM goodhive.companies
        WHERE user_id = ${userId}
      `;

    if (company.length === 0) {
      return new Response(JSON.stringify({ message: "Company not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(company[0]));
  } catch (error) {
    console.error("Error retrieving data:", error);

    return new Response(JSON.stringify({ message: "Error retrieving data" }), {
      status: 500,
    });
  }
}
