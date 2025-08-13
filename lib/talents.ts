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
    // Build dynamic WHERE conditions
    let whereConditions = ["approved = true"];
    let params: any[] = [];
    let paramIndex = 0;

    // Skills search - handle multiple skills with AND logic
    if (search) {
      // Decode URL-encoded search string and split by comma
      const decodedSearch = decodeURIComponent(search);
      const searchSkills = decodedSearch.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
      
      if (searchSkills.length > 0) {
        const skillConditions: string[] = [];
        
        searchSkills.forEach((skill) => {
          skillConditions.push(`LOWER(skills) LIKE $${++paramIndex}`);
          params.push(contains(skill));
        });
        
        // Use AND logic: talent must have ALL searched skills
        whereConditions.push(`(${skillConditions.join(' AND ')})`);
      }
    }

    // Name search (first name or last name)
    if (name) {
      whereConditions.push(`(LOWER(first_name) LIKE $${++paramIndex} OR LOWER(last_name) LIKE $${paramIndex})`);
      params.push(contains(name));
    }

    // Location search
    if (location) {
      whereConditions.push(`(LOWER(city) LIKE $${++paramIndex} OR LOWER(country) LIKE $${paramIndex})`);
      params.push(contains(location));
    }

    // Role filters
    if (onlyTalent === "true") {
      whereConditions.push("talent = true");
    }

    if (onlyRecruiter === "true") {
      whereConditions.push("recruiter = true");
    }

    if (onlyMentor === "true") {
      whereConditions.push("mentor = true");
    }

    const whereClause = whereConditions.join(" AND ");

    console.log("WHERE clause:", whereClause);
    console.log("Parameters:", params);

    // Count query
    const countQuery = `SELECT COUNT(*) FROM goodhive.talents WHERE ${whereClause}`;
    const countResult = await sql.unsafe(countQuery, params);
    const count = countResult[0].count as number;

    console.log("Total count:", count);

    const limit = Number(items);
    const offset = limit * (Number(page) - 1);

    // Main query
    const talentsQuery = `SELECT * FROM goodhive.talents WHERE ${whereClause} ORDER BY last_active DESC LIMIT $${++paramIndex} OFFSET $${++paramIndex}`;
    const talentsCursor = await sql.unsafe(talentsQuery, [...params, limit, offset]);

    console.log("Talents found:", talentsCursor.length);

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
