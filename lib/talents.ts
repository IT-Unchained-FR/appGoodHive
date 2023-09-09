import postgres from "postgres";

import Talent from "@/interfaces/talent";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

export async function fetchTalents({
  search,
  location,
  items = 9,
  page = 1,
}: {
  search?: string;
  location?: string;
  items: number;
  page: number;
}) {
  try {
    const countCursor = await sql`SELECT COUNT(*) FROM goodhive.users`;
    const count = countCursor[0].count as number;
    const limit = Number(items);

    const offset = limit * Number(page);

    const talentsCursor =
      await sql`SELECT * FROM goodhive.users LIMIT ${limit} OFFSET ${offset}`;

    const talents = talentsCursor.map((talent) => {
      return {
        title: talent.title,
        profileHeadline: talent.profile_headline,
        firstName: talent.first_name,
        lastName: talent.last_name,
        country: talent.country,
        city: talent.city,
        phoneCountryCode: talent.phone_country_code,
        phoneNumber: talent.phone_number,
        email: talent.email,
        aboutWork: talent.about_work,
        telegram: talent.telegram,
        rate: talent.rate,
        currency: talent.currency,
        skills: talent.skills.split(","),
        imageUrl: talent.image_url,
      } as Talent;
    });

    return { talents, count };
  } catch (error) {
    throw new Error("Failed to fetch data from the server");
  }
}
