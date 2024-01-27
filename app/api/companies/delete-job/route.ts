import postgres from "postgres";

export async function POST(request: Request) {
  const { id } = await request.json();

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  if (!id) {
    return new Response(JSON.stringify({ message: "Job id not found" }), {
      status: 400,
    });
  }

  try {
    // delete the job

    await sql`
        DELETE FROM goodhive.job_offers
        WHERE id = ${id}
        `;

    return new Response(
      JSON.stringify({ message: "Job updated successfully" })
    );
  } catch (error) {
    console.error("Error inserting data:", error);

    return new Response(JSON.stringify({ message: "Error inserting data" }), {
      status: 500,
    });
  }
}
