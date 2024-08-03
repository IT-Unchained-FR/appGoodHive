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
    FROM goodhive.users
    WHERE
      (LOWER(title) LIKE ${contains(search)} OR LOWER(skills) LIKE ${contains(
      search
    )})
      AND
      (LOWER(city) LIKE ${contains(location)} OR LOWER(country) LIKE ${contains(
      location
    )})
      AND
      (LOWER(first_name) LIKE ${contains(
        name
      )} OR LOWER(last_name) LIKE ${contains(name)})
      ${onlyTalent === "true" ? sql`AND talent_status = 'approved'` : sql``}
      ${onlyMentor === "true" ? sql`AND mentor_status = 'approved'` : sql``}
      ${
        onlyRecruiter === "true"
          ? sql`AND recruiter_status = 'approved'`
          : sql``
      }
    `;

    const count = countCursor[0].count as number;

    const limit = Number(items);
    const offset = limit * (Number(page) - 1);

    const talentsCursor = await sql`
      SELECT *
      FROM goodhive.users
      WHERE
      (LOWER(title) LIKE ${contains(search)} OR LOWER(skills) LIKE ${contains(
      search
    )})
      AND
      (LOWER(city) LIKE ${contains(location)} OR LOWER(country) LIKE ${contains(
      location
    )})
      AND
      (LOWER(first_name) LIKE ${contains(
        name
      )} OR LOWER(last_name) LIKE ${contains(name)})
      ${onlyTalent === "true" ? sql`AND talent_status = 'approved'` : sql``}
      ${onlyMentor === "true" ? sql`AND mentor_status = 'approved'` : sql``}
      ${
        onlyRecruiter === "true"
          ? sql`AND recruiter_status = 'approved'`
          : sql``
      }
      LIMIT ${limit}
      OFFSET ${offset}
      `;

    const talents: Talent[] = talentsCursor
      .filter(
        (talent) =>
          talent.talent_status === "approved" || talent.talent_status === null
      )
      .map((talent) => {
        return {
          title: talent.title,
          description: talent.description,
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
          walletAddress: talent.wallet_address,
          freelancer: talent.freelance_only ? true : false,
          remote: talent.remote_only ? true : false,
          availability: talent.availability,
          last_active: talent.last_active,
        };
      });

    // sort talents by availability
    const sortedTalents = talents.sort((a, b) => {
      if (a.availability && !b.availability) {
        return -1;
      }
      if (!a.availability && b.availability) {
        return 1;
      }
      return 0;
    });

    return { talents: sortedTalents, count };
  } catch (error) {
    console.log("💥", error);
    throw new Error("Failed to fetch data from the server");
  }
}
