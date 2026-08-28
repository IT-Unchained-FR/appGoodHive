/**
 * One-off backfill: evaluates every approved talent that has no cached AI profile evaluation yet
 * (or was evaluated under an older prompt/schema version), so the recruiter search path
 * (app/api/recruiter/top-talents/route.ts) has full cache coverage from day one instead of
 * falling back to a live evaluation the first time each of them is searched.
 *
 * Run with: pnpm tsx scripts/backfill-talent-profile-evaluations.ts
 * Requires the add_talent_profile_evaluation.sql migration to have been applied first.
 */
import sql from "@/lib/db";
import {
  AI_PROFILE_SUMMARY_VERSION,
  evaluateAndStoreTalentProfile,
} from "@/app/lib/ai/evaluate-talent-profile";

const CONCURRENCY = 3;
const DELAY_BETWEEN_CHUNKS_MS = 1000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const talents = await sql<{ user_id: string }[]>`
    SELECT user_id
    FROM goodhive.talents
    WHERE approved = true
      AND (
        ai_profile_summary IS NULL
        OR ai_profile_summary_version IS DISTINCT FROM ${AI_PROFILE_SUMMARY_VERSION}
        OR ai_profile_stale = true
      )
  `;

  console.log(`Found ${talents.length} approved talent(s) needing evaluation.`);

  let succeeded = 0;
  let failed = 0;

  for (let index = 0; index < talents.length; index += CONCURRENCY) {
    const chunk = talents.slice(index, index + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async ({ user_id }) => {
        try {
          const summary = await evaluateAndStoreTalentProfile(user_id);
          return Boolean(summary);
        } catch (error) {
          console.error(`Failed to evaluate ${user_id}:`, error);
          return false;
        }
      }),
    );

    results.forEach((ok) => (ok ? succeeded++ : failed++));
    console.log(
      `Progress: ${Math.min(index + CONCURRENCY, talents.length)}/${talents.length} (${succeeded} ok, ${failed} failed)`,
    );

    if (index + CONCURRENCY < talents.length) {
      await delay(DELAY_BETWEEN_CHUNKS_MS);
    }
  }

  console.log(`Done. ${succeeded} evaluated, ${failed} failed.`);
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  });
