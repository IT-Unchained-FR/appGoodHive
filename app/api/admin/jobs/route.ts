export const revalidate = 0; // Disable ISR completely

import { getAdminJobs } from "@/lib/fetch-admin-jobs";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const jobs = await getAdminJobs();

    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
    });

    return new Response(JSON.stringify(jobs), { status: 200, headers });
  } catch (error) {
    console.log(error, "error..");
    return new Response(
      JSON.stringify({ message: "Error fetching jobs data" }),
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}
