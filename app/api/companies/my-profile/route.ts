import postgres from "postgres";

export async function POST(request: Request) {
  const {
    headline,
    designation,
    address,
    country,
    city,
    phoneCountryCode,
    phoneNumber,
    email,
    telegram,
    details,
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
      INSERT INTO goodhive.companies (
        headline,
        designation,
        address,
        country,
        city,
        phone_country_code,
        phone_number,
        email,
        telegram,
        details,
        image_url,
        wallet_address
      ) VALUES (
        ${headline},
        ${designation},
        ${address},
        ${country},
        ${city},
        ${phoneCountryCode},
        ${phoneNumber},
        ${email},
        ${telegram},
        ${details},
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