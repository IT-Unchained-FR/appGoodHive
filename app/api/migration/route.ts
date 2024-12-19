import postgres from "postgres";
import users from "../../../json/talent-data.json";
import companies from "../../../json/companies-goodhive-old-db.json";
import jobOffers from "../../../json/job-offers-goodhive-old-db.json";

export async function POST(request: Request) {
  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  // Insert user data into the database
  // users.forEach(async (user) => {
  //   if (!user.mentor_status) user.mentor_status = "pending";
  //   if (!user.talent_status) user.talent_status = "pending";
  //   if (!user.recruiter_status) user.recruiter_status = "pending";

  //   const abc = await sql`
  //     INSERT INTO goodhive.users (
  //       userid,
  //       talent_status,
  //       mentor_status,
  //       recruiter_status,
  //       wallet_address
  //     )
  //     VALUES (
  //       ${user.userid},
  //       ${user.talent_status},
  //       ${user.mentor_status},
  //       ${user.recruiter_status},
  //       ${user.wallet_address}
  //     )`;

  //   console.log("ABC Data Inserted", abc);
  // });

  //  Insert talents data into the database
  // insertTalentData();

  // Insert companies data into the database

  // return insertCompanyData();

  // const insertTalentData = async () => {

  // };

  // const insertCompanyData = async () => {
  //   companies.forEach(async (company) => {
  //     // Search for the wallet_address in goodhive.users
  //     const existingUser = await sql`
  //       SELECT * FROM goodhive.users
  //       WHERE wallet_address = ${company.wallet_address}
  //     `;

  //     console.log("Existing User", existingUser);

  //     if (existingUser.length > 0) {
  //       // If wallet_address exists, insert a row into goodhive.companies
  //       try {
  //         const companyInsert = await sql`
  //           INSERT INTO goodhive.companies (
  //           user_id,
  //           headline,
  //           designation,
  //           address,
  //           country,
  //           city,
  //           phone_country_code,
  //           phone_number,
  //           email,
  //           telegram,
  //           image_url,
  //           linkedin,
  //           github,
  //           stackoverflow,
  //           twitter,
  //           portfolio,
  //           status,
  //           wallet_address,
  //           approved
  //           )
  //           VALUES (
  //           ${existingUser[0].userid || null},
  //           ${company.headline || null},
  //           ${company.designation || null},
  //           ${company.address || null},
  //           ${company.country || null},
  //           ${company.city || null},
  //           ${company.phone_country_code || null},
  //           ${company.phone_number || null},
  //           ${company.email || null},
  //           ${company.telegram || null},
  //           ${company.image_url || null},
  //           ${company.linkedin || null},
  //           ${company.github || null},
  //           ${company.stackoverflow || null},
  //           ${company.twitter || null},
  //           ${company.portfolio || null},
  //           ${company.status || "pending"},
  //           ${company.wallet_address || null},
  //           ${company.status === "approved" ? true : false}
  //           )`;
  //         console.log("Company Data Inserted", companyInsert);
  //       } catch (error) {
  //         console.error("Error inserting company data:", error);
  //       }
  //     } else {
  //       // Create a new user if one doesn't exist
  //       try {
  //         const newUser = await sql`
  //           INSERT INTO goodhive.users (
  //             wallet_address,
  //             recruiter_status,
  //             talent_status,
  //             mentor_status
  //           )
  //           VALUES (
  //             ${company.wallet_address},
  //             ${company.status === "approved" ? "approved" : "pending"},
  //             'pending',
  //             'pending'
  //           )
  //           RETURNING userid
  //         `;

  //         // Then insert the company data with the new user's ID
  //         const companyInsert = await sql`
  //           INSERT INTO goodhive.companies (
  //             user_id,
  //             headline,
  //             designation,
  //             address,
  //             country,
  //             city,
  //             phone_country_code,
  //             phone_number,
  //             email,
  //             telegram,
  //             image_url,
  //             linkedin,
  //             github,
  //             stackoverflow,
  //             twitter,
  //             portfolio,
  //             status,
  //             wallet_address,
  //             approved
  //           )
  //           VALUES (
  //             ${newUser[0].userid},
  //             ${company.headline || null},
  //             ${company.designation || null},
  //             ${company.address || null},
  //             ${company.country || null},
  //             ${company.city || null},
  //             ${company.phone_country_code || null},
  //             ${company.phone_number || null},
  //             ${company.email || null},
  //             ${company.telegram || null},
  //             ${company.image_url || null},
  //             ${company.linkedin || null},
  //             ${company.github || null},
  //             ${company.stackoverflow || null},
  //             ${company.twitter || null},
  //             ${company.portfolio || null},
  //             ${company.status || "pending"},
  //             ${company.wallet_address || null},
  //             ${company.status === "approved" ? true : false}
  //           )`;
  //         console.log("New user and company created", newUser, companyInsert);
  //       } catch (error) {
  //         console.error("Error creating new user and company:", error);
  //       }
  //     }
  //   });

  //   return new Response(
  //     JSON.stringify({ message: "Company Data inserted", users }),
  //     {
  //       status: 200,
  //     },
  //   );

  //   try {
  //   } catch (error) {
  //     console.error("Error inserting data:", error);

  //     return new Response(
  //       JSON.stringify({ message: "Error inserting company data" }),
  //       {
  //         status: 500,
  //       },
  //     );
  //   }
  // };

  // Insert job offers data into the database
  const insertJobOffers = async () => {
    jobOffers.forEach(async (jobOffer) => {
      // search if the wallet_address exists in goodhive.users
      const existingUser = await sql`
      SELECT * FROM goodhive.users
      WHERE wallet_address = ${jobOffer.wallet_address}
    `;

      console.log("Existing User", existingUser);

      if (existingUser.length > 0) {
        // If wallet_address exists, insert a row into goodhive.job_offers
        try {
          const jobOfferInsert = await sql`
          INSERT INTO goodhive.job_offers (
            user_id,
            title,
            type_engagement,
            description,
            duration,
            budget,
            chain,
            currency,
            skills,
            city,
            country,
            company_name,
            image_url,
            job_type,
            project_type,
            talent,
            recruiter,
            mentor,
            wallet_address,
            posted_at
          )
          VALUES (
            ${existingUser[0].userid || null},
            ${jobOffer.title || null},
            ${jobOffer.type_engagement || null},
            ${jobOffer.description || null},
            ${jobOffer.duration || null},
            ${jobOffer.budget || null},
            ${jobOffer.chain || null},
            ${jobOffer.currency || null},
            ${jobOffer.skills || null},
            ${jobOffer.city || null},
            ${jobOffer.country || null},
            ${jobOffer.company_name || null},
            ${jobOffer.image_url || null},
            ${jobOffer.job_type || null},
            ${jobOffer.project_type || null},
            ${jobOffer.talent || null},
            ${jobOffer.recruiter || null},
            ${jobOffer.mentor || null},
            ${jobOffer.wallet_address || null},
            ${jobOffer.posted_at || null}
          )`;
          console.log("Job Offer Data Inserted", jobOfferInsert);
        } catch (error) {
          console.error("Error inserting job offer data:", error);
        }
      }
    });
  };

  // return insertJobOffers();
}
