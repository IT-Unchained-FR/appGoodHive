import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 },
      );
    }

    // Check if the OTP exists and is valid
    const otpRecords = await sql`
      SELECT * FROM goodhive.otps 
      WHERE email = ${email} 
      AND otp = ${otp} 
      AND expires_at > NOW() 
      AND used = false
    `;

    if (otpRecords.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 },
      );
    }

    // Mark OTP as used
    await sql`
      UPDATE goodhive.otps 
      SET used = true 
      WHERE email = ${email} 
      AND otp = ${otp}
    `;

    // Check if user exists
    const userRecords = await sql`
      SELECT * FROM goodhive.users 
      WHERE email = ${email}
    `;

    let userId = null;

    if (userRecords.length === 0) {
      // Create new user if doesn't exist
      const newUser = await sql`
        INSERT INTO goodhive.users (email, created_at) 
        VALUES (${email}, NOW()) 
        RETURNING userid
      `;
      userId = newUser[0].userid;
    } else {
      userId = userRecords[0].userid;
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      userId,
      isNewUser: userRecords.length === 0,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 },
    );
  }
}
