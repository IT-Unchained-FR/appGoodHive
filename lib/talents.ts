import sql from "@/lib/db";
import { getCountrySearchTerms } from "@/lib/country-mapping";
import { getViewerAccess, formatNameForTier, maskNameInText } from "@/lib/access-control";

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
  availability = "",
  remoteOnly = "",
  freelanceOnly = "",
  sort = "recent",
  minRate = "",
  maxRate = "",
  viewerUserId,
}: {
  search?: string;
  location?: string;
  name?: string;
  items: number;
  page: number;
  onlyTalent?: string;
  onlyMentor?: string;
  onlyRecruiter?: string;
  availability?: string;
  remoteOnly?: string;
  freelanceOnly?: string;
  sort?: string;
  minRate?: string;
  maxRate?: string;
  viewerUserId?: string;
}) {
  try {
    const viewerAccess = await getViewerAccess(viewerUserId);
    const canViewSensitive = viewerAccess.isApproved;

    // Build dynamic WHERE conditions
    let whereConditions = ["approved = true"];
    let params: any[] = [];
    let paramIndex = 0;

    // Keyword search - split multi-word queries to match all words (AND logic)
    // Search across name, skills, description, and about_work fields
    if (search) {
      const searchTerms = search.trim().split(/\s+/).filter(term => term.length > 0);
      
      if (searchTerms.length > 0) {
        const searchConditions: string[] = [];
        
        // For each search term, check if it appears in any of the searchable fields
        searchTerms.forEach((term) => {
          const termPattern = contains(term);
          const termParamIndex = ++paramIndex;
          
          // Check first name, last name, skills, description, and about_work
          searchConditions.push(
            `(LOWER(first_name) LIKE $${termParamIndex} OR LOWER(last_name) LIKE $${termParamIndex} OR LOWER(COALESCE(skills, '')) LIKE $${termParamIndex} OR LOWER(COALESCE(description, '')) LIKE $${termParamIndex} OR LOWER(COALESCE(about_work, '')) LIKE $${termParamIndex})`
          );
          params.push(termPattern);
        });
        
        // All terms must match (AND logic)
        whereConditions.push(`(${searchConditions.join(' AND ')})`);
      }
    }

    // Name search (first name or last name)
    if (name) {
      whereConditions.push(`(LOWER(first_name) LIKE $${++paramIndex} OR LOWER(last_name) LIKE $${paramIndex})`);
      params.push(contains(name));
    }

    // Location search - enhanced to handle country codes and full names
    if (location) {
      const searchTerms = getCountrySearchTerms(location);
      const locationConditions: string[] = [];

      // For each search term, check both city and country fields
      searchTerms.forEach((term) => {
        const termPattern = contains(term);
        const termParamIndex = ++paramIndex;

        locationConditions.push(
          `(LOWER(city) LIKE $${termParamIndex} OR LOWER(country) LIKE $${termParamIndex})`
        );
        params.push(termPattern);
      });

      // Use OR logic: location matches if any search term matches
      whereConditions.push(`(${locationConditions.join(' OR ')})`);
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

    if (availability === "true") {
      whereConditions.push(
        "(availability = true OR LOWER(CAST(availability AS TEXT)) = 'available')",
      );
    }

    if (remoteOnly === "true") {
      whereConditions.push("COALESCE(remote_only::text, 'false') = 'true'");
    }

    if (freelanceOnly === "true") {
      whereConditions.push("COALESCE(freelance_only::text, 'false') = 'true'");
    }

    // Rate range filter - strict containment
    // For legacy users who only have 'rate', treat it as both min and max
    if (minRate) {
      const minRateNum = parseFloat(minRate);
      if (!isNaN(minRateNum)) {
        whereConditions.push(
          `COALESCE(min_rate, NULLIF(rate, '')::NUMERIC, max_rate) >= $${++paramIndex}`
        );
        params.push(minRateNum);
      }
    }

    if (maxRate) {
      const maxRateNum = parseFloat(maxRate);
      if (!isNaN(maxRateNum)) {
        whereConditions.push(
          `COALESCE(max_rate, NULLIF(rate, '')::NUMERIC, min_rate) <= $${++paramIndex}`
        );
        params.push(maxRateNum);
      }
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

    let orderClause = "ORDER BY last_active DESC NULLS LAST";
    const normalizedSort = sort?.toLowerCase();

    if (normalizedSort === "alphabetical") {
      orderClause = "ORDER BY LOWER(first_name) ASC NULLS LAST, LOWER(last_name) ASC";
    } else if (normalizedSort === "rate_high") {
      orderClause =
        "ORDER BY COALESCE(max_rate, min_rate, NULLIF(rate, '')::NUMERIC) DESC NULLS LAST, last_active DESC";
    } else if (normalizedSort === "rate_low") {
      orderClause =
        "ORDER BY COALESCE(min_rate, max_rate, NULLIF(rate, '')::NUMERIC) ASC NULLS LAST, last_active DESC";
    }

    // Main query
    const limitIndex = ++paramIndex;
    const offsetIndex = ++paramIndex;
    const talentsQuery = `SELECT * FROM goodhive.talents WHERE ${whereClause} ${orderClause} LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    const talentsCursor = await sql.unsafe(talentsQuery, [...params, limit, offset]);

    console.log("Talents found:", talentsCursor.length);

    const talents: any[] = talentsCursor.map((talent) => {
      const maskedName = formatNameForTier(
        talent.first_name,
        talent.last_name,
        viewerAccess.tier,
      );

      const description = safeBase64Decode(talent.description);
      const aboutWork = safeBase64Decode(talent.about_work);

      return {
        title: talent.title,
        description: canViewSensitive
          ? description
          : maskNameInText(description, talent.first_name, talent.last_name),
        firstName: maskedName.firstName,
        lastName: maskedName.lastName,
        country: talent.country,
        city: talent.city,
        phoneCountryCode: canViewSensitive ? talent.phone_country_code : undefined,
        skills: talent.skills?.split(",") || [],
        email: canViewSensitive ? talent.email : undefined,
        aboutWork: canViewSensitive
          ? aboutWork
          : maskNameInText(aboutWork, talent.first_name, talent.last_name),
        telegram: canViewSensitive ? talent.telegram : undefined,
        minRate:
          talent.min_rate !== null && talent.min_rate !== undefined
            ? Number(talent.min_rate)
            : talent.rate
              ? Number(talent.rate)
              : undefined,
        maxRate:
          talent.max_rate !== null && talent.max_rate !== undefined
            ? Number(talent.max_rate)
            : talent.rate
              ? Number(talent.rate)
              : undefined,
        currency: talent.currency,
        imageUrl: talent.image_url,
        walletAddress: canViewSensitive ? talent.wallet_address : undefined,
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
