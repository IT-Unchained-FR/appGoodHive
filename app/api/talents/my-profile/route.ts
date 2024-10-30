import postgres from "postgres";

import type { NextRequest } from "next/server";

// Force the browser to always fetch the latest data from the server
export const fetchCache = "force-no-store";
export const revalidate = 0;
export async function POST(request: Request) {
  const {
    title,
    description,
    firstName,
    lastName,
    country,
    city,
    phoneCountryCode,
    phoneNumber,
    email,
    telegram,
    aboutWork,
    rate,
    skills,
    imageUrl,
    cvUrl,
    walletAddress,
    linkedin,
    github,
    stackoverflow,
    twitter,
    portfolio,
    freelanceOnly,
    remoteOnly,
    talent,
    mentor,
    recruiter,
    talentStatus,
    mentorStatus,
    recruiterStatus,
    hideContactDetails,
    referralCode,
    availability,
  } = await request.json();

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  console.log(twitter, "twitter");

  try {
    let referrerWalletAddress = "";

    if (referralCode) {
      const user = await sql`
      SELECT *
      FROM goodhive.referrals
      WHERE referral_code = ${referralCode}
      `;

      if (user.length) {
        referrerWalletAddress = user[0].wallet_address;
        const referralTalents = user[0].talents;
        await sql`
        UPDATE goodhive.referrals
        SET
          talents = ${
            referralTalents
              ? [...referralTalents, walletAddress]
              : [walletAddress]
          }
        WHERE wallet_address = ${referrerWalletAddress}
        `;
      }
    }

    await sql`
      INSERT INTO goodhive.users (
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
        talent_status,
        mentor_status,
        recruiter_status,
        hide_contact_details,
        referrer,
        availability,
        wallet_address
      ) VALUES (
        ${title},
        ${description},
        ${firstName},
        ${lastName},
        ${country},
        ${city},
        ${phoneCountryCode},
        ${phoneNumber},
        ${email},
        ${aboutWork},
        ${rate},
        ${skills},
        ${imageUrl},
        ${cvUrl},
        ${telegram},
        ${linkedin},
        ${github},
        ${stackoverflow},
        ${twitter},
        ${portfolio},
        ${freelanceOnly},
        ${remoteOnly},
        ${talent},
        ${mentor},
        ${recruiter},
        ${talentStatus},
        ${mentorStatus},
        ${recruiterStatus},
        ${hideContactDetails},
        ${referrerWalletAddress},
        ${availability},
        ${walletAddress}
      )
      ON CONFLICT (wallet_address) DO UPDATE
      SET
        title = ${title},
        description = ${description},
        first_name = ${firstName},
        last_name = ${lastName},
        country = ${country},
        city = ${city},
        phone_country_code = ${phoneCountryCode},
        phone_number = ${phoneNumber},
        email = ${email},
        about_work = ${aboutWork},
        rate = ${rate},
        skills = ${skills},
        image_url = ${imageUrl},
        cv_url = ${cvUrl},
        telegram = ${telegram},
        linkedin = ${linkedin},
        github = ${github},
        stackoverflow = ${stackoverflow},
        twitter = ${twitter},
        portfolio = ${portfolio},
        freelance_only = ${freelanceOnly},
        remote_only = ${remoteOnly},
        talent = ${talent},
        mentor = ${mentor},
        recruiter = ${recruiter},
        talent_status = ${talentStatus},
        mentor_status = ${mentorStatus},
        recruiter_status = ${recruiterStatus},
        hide_contact_details = ${hideContactDetails},
        availability = ${availability},
        wallet_address = ${walletAddress};
    `;

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
