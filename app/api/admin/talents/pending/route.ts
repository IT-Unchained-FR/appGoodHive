import {} from "@/lib/fetch-company-data";
import { getPendingTalents } from "@/lib/fetch-talent-data";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log("Getting Talents");
  try {
    const pending_users = await getPendingTalents();
    console.log(pending_users, "pending talents");
    console.log(pending_users.length, "pending talents");
    return new Response(JSON.stringify(pending_users), { status: 200 });
  } catch (error) {
    console.log(error, "error..");
    return new Response(
      JSON.stringify({ message: "Error fetching company data" }),
      {
        status: 500,
      },
    );
  }
}
