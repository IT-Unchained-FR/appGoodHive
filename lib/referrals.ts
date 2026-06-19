import sql from "@/lib/db";
import { generateReferralCode } from "@/app/utils/generate-referral-code";

const GOODHIVE_BASE_URL =
  process.env.GOODHIVE_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ??
  "https://goodhive.io";

const REFERRAL_CODE_LENGTH = 6;
const MAX_REFERRAL_GENERATION_ATTEMPTS = 5;

export const buildReferralLink = (referralCode: string) =>
  `${GOODHIVE_BASE_URL}/?ref=${encodeURIComponent(referralCode)}`;

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const existingReferral = await sql<{ referral_code: string }[]>`
    SELECT referral_code
    FROM goodhive.referrals
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  if (existingReferral[0]?.referral_code) {
    return existingReferral[0].referral_code;
  }

  for (let attempt = 0; attempt < MAX_REFERRAL_GENERATION_ATTEMPTS; attempt += 1) {
    const referralCode = generateReferralCode(REFERRAL_CODE_LENGTH);

    try {
      const createdReferral = await sql<{ referral_code: string }[]>`
        INSERT INTO goodhive.referrals (
          user_id,
          referral_code
        ) VALUES (
          ${userId},
          ${referralCode}
        )
        RETURNING referral_code
      `;

      if (createdReferral[0]?.referral_code) {
        return createdReferral[0].referral_code;
      }
    } catch (error: any) {
      if (error?.code === "23505") {
        const racedReferral = await sql<{ referral_code: string }[]>`
          SELECT referral_code
          FROM goodhive.referrals
          WHERE user_id = ${userId}
          LIMIT 1
        `;

        if (racedReferral[0]?.referral_code) {
          return racedReferral[0].referral_code;
        }

        continue;
      }

      throw error;
    }
  }

  throw new Error(`Failed to create referral code for user ${userId}`);
}

export async function getOrCreateReferralLink(userId: string): Promise<string> {
  const referralCode = await getOrCreateReferralCode(userId);
  return buildReferralLink(referralCode);
}
