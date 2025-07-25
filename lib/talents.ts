import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

function contains(str: string) {
  return "%" + str.toLowerCase() + "%";
}

// Helper function to safely decode base64 or return original string
function safeBase64Decode(value: string | null | undefined): string {
  if (!value) return "";

  try {
    // Check if the string looks like base64 (contains only base64 characters)
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (base64Regex.test(value)) {
      return Buffer.from(value, "base64").toString("utf-8");
    }
    // If it doesn't look like base64, return as is
    return value;
  } catch (error) {
    console.error("Error decoding base64:", error);
    return value || "";
  }
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
      WHERE (${search} = '' OR LOWER(skills) LIKE ${contains(search)})
      AND (${name} = '' OR LOWER(first_name) LIKE ${contains(name)} OR LOWER(last_name) LIKE ${contains(name)})
      AND (${location} = '' OR LOWER(city) LIKE ${contains(location)})
      AND (${onlyTalent} != 'true' OR talent = true)
      AND (${onlyRecruiter} != 'true' OR recruiter = true)
      AND (${onlyMentor} != 'true' OR mentor = true)
      AND approved = true
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const talents: any[] = talentsCursor.map((talent) => {
      return {
        title: talent.title,
        description: safeBase64Decode(talent.description),
        firstName: talent.first_name,
        lastName: talent.last_name,
        country: talent.country,
        city: talent.city,
        phoneCountryCode: talent.phone_country_code,
        skills: talent.skills?.split(",") || [],
        email: talent.email,
        aboutWork: safeBase64Decode(talent.about_work),
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
