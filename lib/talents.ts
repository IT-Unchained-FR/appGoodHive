import postgres from "postgres";
import Talent from "@/interfaces/talent";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

function contains(str: string) {
  return "%" + str.toLowerCase() + "%";
}

export async function fetchTalents({
  search = "",
  location = "",
  name = "",
  items = 9,
  page = 1,
  onlyTalent = "",
  onlyMentor = "",
  onlyRecruiter = "",
}: {
  search?: string;
  location?: string;
  name?: string;
  items: number;
  page: number;
  onlyTalent?: string;
  onlyMentor?: string;
  onlyRecruiter?: string;
}) {
  try {
    const countCursor = await sql`
    SELECT COUNT(*)
    FROM goodhive.talents
    `;

    const count = countCursor[0].count as number;

    const limit = Number(items);
    const offset = limit * (Number(page) - 1);

    const talentsCursor = await sql`
      SELECT *
      FROM goodhive.talents
      WHERE (${search} = '' OR LOWER(title) LIKE ${contains(search)})
      AND (${location} = '' OR LOWER(country) LIKE ${contains(location)} OR LOWER(city) LIKE ${contains(location)})
      AND (${name} = '' OR LOWER(first_name) LIKE ${contains(name)} OR LOWER(last_name) LIKE ${contains(name)})
      AND (${onlyTalent} = '' OR freelance_only = true)
      AND (${onlyMentor} = '' OR remote_only = true)
      AND (${onlyRecruiter} = '' OR availability = true)
      AND approved = true
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const talents: any[] = talentsCursor.map((talent) => {
      return {
        title: talent.title,
        description: Buffer.from(talent.description, "base64").toString(
          "utf-8",
        ),
        firstName: talent.first_name,
        lastName: talent.last_name,
        country: talent.country,
        city: talent.city,
        phoneCountryCode: talent.phone_country_code,
        skills: talent.skills?.split(",") || [],
        email: talent.email,
        aboutWork: Buffer.from(talent.about_work, "base64").toString("utf-8"),
        telegram: talent.telegram,
        rate: talent.rate,
        currency: talent.currency,
        imageUrl: talent.image_url,
        walletAddress: talent.wallet_address,
        freelancer: talent.freelance_only ? true : false,
        remote: talent.remote_only ? true : false,
        availability: talent.availability,
        userId: talent.user_id,
        last_active: talent.last_active,
      };
    });

    return { talents, count };
  } catch (error) {
    console.log("💥", error);
    throw new Error("Failed to fetch data from the server");
  }
}
