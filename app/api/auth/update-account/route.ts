import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(request: Request) {
  try {
    const { okto_wallet_address, user_id, email, wallet_address } = await request.json();

    if (!okto_wallet_address || !user_id || !email || !wallet_address) {
      return NextResponse.json(
        { error: "Missing required fields: okto_wallet_address, user_id, email, wallet_address" },
        { status: 400 }
      );
    }

    // First verify the user exists with the provided details
    const existingUsers = await sql`
      SELECT * FROM goodhive.users
      WHERE user_id = ${user_id} AND email = ${email} AND wallet_address = ${wallet_address}
    `;

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { error: "User not found with provided details" },
        { status: 404 }
      );
    }

    // Check if okto wallet address is already in use by another user
    const oktoWalletCheck = await sql`
      SELECT user_id FROM goodhive.users
      WHERE okto_wallet_address = ${okto_wallet_address} AND user_id != ${user_id}
    `;

    if (oktoWalletCheck.length > 0) {
      return NextResponse.json(
        { error: "Okto wallet address is already associated with another account" },
        { status: 409 }
      );
    }

    // Update the user with okto wallet address
    const updatedUsers = await sql`
      UPDATE goodhive.users
      SET okto_wallet_address = ${okto_wallet_address},
          login_method = 'google'
      WHERE user_id = ${user_id}
      RETURNING *
    `;

    if (updatedUsers.length === 0) {
      return NextResponse.json(
        { error: "Failed to update user account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account updated successfully",
      user: {
        user_id: updatedUsers[0].user_id,
        email: updatedUsers[0].email,
        wallet_address: updatedUsers[0].wallet_address,
        okto_wallet_address: updatedUsers[0].okto_wallet_address,
        login_method: updatedUsers[0].login_method,
      }
    });

  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 