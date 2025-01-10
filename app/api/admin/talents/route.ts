export const revalidate = 0; // Disable ISR completely

import { getAdminTalents } from "@/lib/fetch-admin-talents";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const talents = await getAdminTalents();

    // Set Cache-Control header to disable caching
    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0", // Prevent caching
    });

    return new Response(JSON.stringify(talents), { status: 200, headers });
  } catch (error) {
    console.log(error, "error..");
    return new Response(
      JSON.stringify({ message: "Error fetching talents data" }),
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0", // Prevent caching
        },
      },
    );
  }
}
