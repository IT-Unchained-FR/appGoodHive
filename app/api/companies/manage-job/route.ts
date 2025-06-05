import postgres from "postgres";

export async function PATCH(request: Request) {
  const { jobId, publish } = await request.json();

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Check if the job exists
    const existingJob = await sql`
      SELECT id FROM goodhive.job_offers WHERE id = ${jobId};
    `;

    if (existingJob.length === 0) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
      });
    }

    // Update the published status
    await sql`
      UPDATE goodhive.job_offers
      SET published = ${publish}
      WHERE id = ${jobId};
    `;

    return new Response(
      JSON.stringify({
        jobId,
        published: publish,
        message: publish
          ? "Job published successfully"
          : "Job unpublished successfully",
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating publish status:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update publish status" }),
      { status: 500 },
    );
  } finally {
    await sql.end();
  }
}
