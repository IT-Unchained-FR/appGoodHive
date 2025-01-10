import { getAdminTalents } from "@/lib/fetch-admin-talents";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const talents = await getAdminTalents();
    return new Response(JSON.stringify(talents), { status: 200 });
  } catch (error) {
    console.log(error, "error..");
    return new Response(
      JSON.stringify({ message: "Error fetching talents data" }),
      {
        status: 500,
      },
    );
  }
}
