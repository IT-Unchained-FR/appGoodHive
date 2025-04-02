import { NextResponse } from "next/server";
import postgres from "postgres";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

// Function to generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Set OTP expiration time (10 minutes)
const OTP_EXPIRY_MINUTES = 10;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    // Save OTP to database
    await sql`
      INSERT INTO goodhive.otps (email, otp, expires_at)
      VALUES (${email}, ${otp}, ${expiresAt})
      ON CONFLICT (email)
      DO UPDATE SET otp = ${otp}, expires_at = ${expiresAt}, used = false;
    `;

    // Send OTP email using Resend
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "no-reply@goodhive.io",
      to: email,
      subject: "Your GoodHive Login Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Your Login Code</h2>
          <p style="font-size: 16px; color: #555;">Hello,</p>
          <p style="font-size: 16px; color: #555;">Please use the following code to login to your GoodHive account:</p>
          <div style="background-color: #f7f7f7; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #888;">This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
          <p style="font-size: 14px; color: #888;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
