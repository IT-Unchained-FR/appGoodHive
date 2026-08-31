import { NextRequest } from "next/server";
import sql from "@/lib/db";
import { readViewerAccess } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: { address: string } }
) {
  const { address: walletAddress } = context.params;

  if (!walletAddress) {
    return new Response(
      JSON.stringify({ message: "Missing address parameter" }),
      {
        status: 404,
      }
    );
  }

  const access = await readViewerAccess();

  if (!access.isAuthenticated && !access.isAdmin) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    // Explicit column list: this used to be `SELECT *`, which leaked the whole
    // users row (email, both wallet addresses, review statuses) for any wallet
    // address to any caller.
    const user = await sql`
        SELECT userid, wallet_address, talent_status, mentor_status, recruiter_status
        FROM goodhive.users
        WHERE wallet_address = ${walletAddress}
      `;

    if (user.length === 0) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    const record = user[0];

    // Only the account owner or an admin sees the record; everyone else gets a
    // bare existence check with no identifiers attached.
    if (!access.isAdmin && access.userId !== record.userid) {
      return new Response(JSON.stringify({ exists: true }), {
        status: 200,
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    return new Response(JSON.stringify(record), {
      status: 200,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Error retrieving data:", error);

    return new Response(JSON.stringify({ message: "Error retrieving data" }), {
      status: 500,
    });
  }
}
