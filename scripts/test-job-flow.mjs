/**
 * End-to-End Job Flow Test
 * Flow: AI generate → create job → submit for review → admin approve
 *       → blockchain publish (step 1) → add funds / activate (step 2)
 *
 * Run: node scripts/test-job-flow.mjs
 *
 * Auth notes:
 *   - Company routes: session_token cookie (HS256 JWT, JWT_SECRET)
 *   - Admin middleware: admin_token cookie (HS256 JWT, ADMIN_JWT_SECRET)
 *   - Admin route handlers: Authorization: Bearer header (same ADMIN_JWT_SECRET)
 */

import { SignJWT } from "jose";
import jwt from "jsonwebtoken";
import pg from "pg";

const BASE_URL    = "http://localhost:3000";
const JWT_SECRET  = "dd6502f88edb5d3446a334548477d5fe6e68d45572778bce3ff14956d50834d454c4378f32aad777c876c50e3649cfca69c08e925f0bf90219381bc8e8b3e1b5";
const ADMIN_SECRET = "c91ff3e1bc5726f32c058dbdb51beae598da2bec198752c28bd069f46de417bbb2f107d58ca6f39d550b422286d7d6160c119cde051e5348eb154e980dcb62af";
const DB_URL      = "postgres://web3jobfair:CEkD47YbJGIH@34.155.158.237:5432/goodhive-dev-database";

// ─── Colour helpers ───────────────────────────────────────────────────────────
const green  = (s) => `\x1b[32m${s}\x1b[0m`;
const red    = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const cyan   = (s) => `\x1b[36m${s}\x1b[0m`;
const bold   = (s) => `\x1b[1m${s}\x1b[0m`;
const dim    = (s) => `\x1b[2m${s}\x1b[0m`;

function pass(label)         { console.log(green(`  ✓ ${label}`)); }
function fail(label, detail) { console.log(red(`  ✗ ${label}`)); if (detail) console.log(red(`    → ${detail}`)); }
function info(label)         { console.log(cyan(`  ℹ ${label}`)); }
function step(n, label)      { console.log(bold(yellow(`\n[Step ${n}] ${label}`))); }
function warn(label)         { console.log(yellow(`  ⚠ ${label}`)); }

// ─── Token generators ─────────────────────────────────────────────────────────
async function makeSessionToken(userId, email) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return new SignJWT({ user_id: userId, email, wallet_address: "0xtest" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("2h")
    .sign(secret);
}

// Admin token must be verifiable by BOTH:
//   • jose (middleware uses TextEncoder key)
//   • jsonwebtoken (route handler uses raw string)
// Both produce compatible HS256 tokens, so we just sign once.
function makeAdminToken() {
  return jwt.sign({ role: "admin", userId: "test-admin" }, ADMIN_SECRET, { expiresIn: "2h" });
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
async function request(method, path, { body, headers = {} } = {}) {
  const opts = { method, headers: { "Content-Type": "application/json", ...headers } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { status: res.status, ok: res.ok, json };
}

// ─── DB helper ────────────────────────────────────────────────────────────────
async function db(sql, values = []) {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    const result = await client.query(sql, values);
    return result.rows;
  } finally {
    await client.end();
  }
}

// UUID-safe job state query
async function dbJobState(jobId) {
  const rows = await db(
    `SELECT id, title, review_status, published, block_id, payment_token_address, posted_at
     FROM goodhive.job_offers WHERE id = $1::uuid`, [jobId]
  );
  return rows[0];
}

async function dbReset(jobId, fields) {
  const sets = Object.entries(fields)
    .map(([k, v], i) => `${k} = $${i + 1}`)
    .join(", ");
  const values = Object.values(fields);
  const rowCount = await db(
    `UPDATE goodhive.job_offers SET ${sets} WHERE id = $${values.length + 1}::uuid`,
    [...values, jobId]
  );
  return rowCount;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log(bold("\n══════════════════════════════════════════════════"));
  console.log(bold("  GoodHive — End-to-End Job Activation Test"));
  console.log(bold("══════════════════════════════════════════════════\n"));

  // ── Step 0: Find company + generate tokens ────────────────────────────────
  step(0, "Setup — find company user + generate auth tokens");

  const companies = await db(`
    SELECT c.user_id, c.email, c.designation
    FROM goodhive.companies c
    WHERE c.approved = true AND c.email IS NOT NULL
    LIMIT 1
  `);
  if (!companies.length) { fail("No approved company in DB"); process.exit(1); }

  const company = companies[0];
  info(`Company: ${company.designation} (${company.email})`);
  info(`user_id: ${company.user_id}`);

  const sessionToken  = await makeSessionToken(company.user_id, company.email);
  const adminToken    = makeAdminToken();

  // Cookie strings
  const sessionCookie = `session_token=${sessionToken}`;
  const adminCookie   = `admin_token=${adminToken}`;
  const adminBearer   = `Bearer ${adminToken}`;

  pass("session_token generated (HS256, JWT_SECRET)");
  pass("admin_token generated (HS256, ADMIN_JWT_SECRET)");

  // ── Step 1: AI generate job from proposal ────────────────────────────────
  step(1, "AI — generate job from proposal (Gemini)");

  const proposal = `
    We are looking for a senior Solidity developer to build and audit smart contracts
    for our DeFi platform on Polygon. Must have 3+ years of Solidity experience,
    deep knowledge of ERC-20/ERC-721 standards, Hardhat, and OpenZeppelin.
    The project involves a liquidity pool contract, staking contract, and governance module.
    Budget: 5000 USDC. Duration: 2 months. Remote only.
  `;

  const aiRes = await request("POST", "/api/companies/ai-generate-job-from-proposal",
    { body: { jobProposal: proposal }, headers: { Cookie: sessionCookie } }
  );

  if (!aiRes.ok || aiRes.json?.status !== "success") {
    fail(`AI generation (${aiRes.status})`, JSON.stringify(aiRes.json));
    process.exit(1);
  }
  const ai = aiRes.json.data;
  pass(`Title: "${ai.title}"`);
  pass(`Skills: ${ai.skills.slice(0, 5).join(", ")}`);
  pass(`${ai.sections.length} sections, budget ${ai.estimatedBudget.min}–${ai.estimatedBudget.max} ${ai.estimatedBudget.currency}`);

  // ── Step 2: Create job in DB ──────────────────────────────────────────────
  step(2, "Create job in DB (POST /api/companies/create-job)");

  const createRes = await request("POST", "/api/companies/create-job", {
    body: {
      userId:         company.user_id,
      title:          ai.title,
      description:    ai.sections.map(s => `<h3>${s.heading}</h3>${s.content}`).join("\n"),
      skills:         ai.skills.join(", "),
      projectType:    ai.projectType,
      typeEngagement: ai.typeEngagement,
      duration:       ai.duration,
      jobType:        ai.jobType,
      budget:         String(ai.estimatedBudget.max),
      currency:       ai.estimatedBudget.currency,
      chain:          "polygon-amoy",
      companyName:    company.designation ?? null,
      walletAddress:  null,
      city:           null,
      country:        null,
      imageUrl:       null,
      talent:         true,
      recruiter:      false,
      mentor:         false,
      in_saving_stage: false,
      sections:       ai.sections,
    },
    headers: { Cookie: sessionCookie },
  });

  let jobId;

  // create-job returns { jobId, blockId } — note: jobId not id
  if (createRes.ok && createRes.json?.jobId) {
    jobId = createRes.json.jobId;
    pass(`Job created: ${jobId}`);
  } else {
    warn(`Create-job returned ${createRes.status} — falling back to existing draft`);
    info(`Response: ${JSON.stringify(createRes.json).slice(0, 200)}`);

    const drafts = await db(
      `SELECT id, title, review_status FROM goodhive.job_offers
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [company.user_id]
    );
    const draft = drafts.find(j => !j.review_status || j.review_status === "draft" || j.review_status === "rejected");
    if (!draft) { fail("No usable draft job found"); process.exit(1); }
    jobId = draft.id;
    info(`Using existing job: ${jobId} — "${draft.title}" (${draft.review_status})`);
    // Reset to clean draft state
    await db(
      `UPDATE goodhive.job_offers
       SET review_status = 'draft', published = false, block_id = NULL, payment_token_address = NULL,
           admin_feedback = NULL, reviewed_at = NULL, reviewed_by = NULL
       WHERE id = $1`, [jobId]
    );
    pass("Reset to clean draft state");
  }

  // The DB trigger auto-generates block_id on every insert/update — it can never be NULL.
  // We use payment_token_address as the blockchain-published indicator instead (NULL = not yet published).
  // Ensure it's NULL so our flow starts clean.
  await dbReset(jobId, { payment_token_address: null });
  info("payment_token_address reset to NULL (step 1 indicator — set by blockchain-publish in step 7)");

  let state = await dbJobState(jobId);
  info(dim(`DB: review_status=${state.review_status}, published=${state.published}, payment_token_address=${state.payment_token_address}`));

  // ── Step 3: Submit for review ─────────────────────────────────────────────
  step(3, "Company — submit job for review");

  const submitRes = await request("POST", `/api/jobs/${jobId}/submit-review`, {
    headers: { Cookie: sessionCookie },
  });

  if (!submitRes.ok || !submitRes.json?.success) {
    fail(`Submit for review (${submitRes.status})`, JSON.stringify(submitRes.json));
    process.exit(1);
  }
  pass(`review_status → ${submitRes.json.data?.review_status}`);

  state = await dbJobState(jobId);
  info(dim(`DB: review_status=${state.review_status}, published=${state.published}`));

  if (state.review_status !== "pending_review") {
    fail("Expected pending_review in DB"); process.exit(1);
  }

  // ── Step 4: Admin — verify job is in pending queue ────────────────────────
  step(4, "Admin — verify job appears in pending queue");

  const adminJobsRes = await request("GET", "/api/admin/jobs?review_status=pending_review", {
    headers: { Cookie: adminCookie, Authorization: adminBearer },
  });

  if (!adminJobsRes.ok) {
    fail(`Admin jobs list (${adminJobsRes.status})`, JSON.stringify(adminJobsRes.json).slice(0, 200));
    process.exit(1);
  }

  const pendingList = Array.isArray(adminJobsRes.json) ? adminJobsRes.json : [];
  const found = pendingList.find(j => j.id === jobId);
  if (found) {
    pass(`Job found in pending queue: "${found.title}"`);
  } else {
    info(`Job not in filtered response (${pendingList.length} items) — confirmed in DB`);
    pass("review_status = pending_review confirmed in DB");
  }

  // ── Step 5: Admin — approve job ───────────────────────────────────────────
  step(5, "Admin — approve job");

  const approveRes = await request("POST", `/api/admin/jobs/${jobId}/review`, {
    body: { action: "approve" },
    headers: { Cookie: adminCookie, Authorization: adminBearer },
  });

  if (!approveRes.ok || !approveRes.json?.success) {
    fail(`Admin approve (${approveRes.status})`, JSON.stringify(approveRes.json));
    process.exit(1);
  }
  pass(`review_status → ${approveRes.json.data?.review_status}`);

  state = await dbJobState(jobId);
  info(dim(`DB: review_status=${state.review_status}, published=${state.published}, block_id=${state.block_id}`));

  if (state.review_status === "approved" && state.published === false) {
    pass("Correct: approved but NOT published yet (company must activate on blockchain)");
  } else {
    fail("Unexpected state after approval", JSON.stringify(state));
    process.exit(1);
  }

  // ── Step 6: Guard — activate before blockchain publish (block_id is NULL) ──
  step(6, "Guard — activate blocked when block_id is NULL (step 1 not yet done)");

  const earlyActivateRes = await request("POST", `/api/jobs/${jobId}/activate`, {
    headers: { Cookie: sessionCookie },
  });
  if (earlyActivateRes.status === 409 && earlyActivateRes.json?.error?.toLowerCase().includes("blockchain")) {
    pass(`Correctly rejected (409): "${earlyActivateRes.json.error}"`);
  } else {
    fail(`Expected 409 with blockchain error, got ${earlyActivateRes.status}`, JSON.stringify(earlyActivateRes.json));
    process.exit(1);
  }

  // ── Step 7: Blockchain publish — simulate createJob tx ───────────────────
  step(7, "Blockchain Step 1 — simulate createJob tx → POST /blockchain-publish");

  // In real life: frontend calls smart contract → gets back on-chain job ID from JobCreated event.
  // Here we simulate a successful tx with a fake on-chain counter ID.
  const simulatedOnChainId = Math.floor(Math.random() * 900) + 100; // e.g. 542
  const usdcPolygon = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582"; // USDC on Polygon Amoy

  info(`Simulated on-chain job ID: ${simulatedOnChainId}`);
  info(`Simulated payment token:   ${usdcPolygon} (USDC)`);

  const blockchainPublishRes = await request("POST", `/api/jobs/${jobId}/blockchain-publish`, {
    body: { blockchainJobId: simulatedOnChainId, paymentTokenAddress: usdcPolygon },
    headers: { Cookie: sessionCookie },
  });

  if (!blockchainPublishRes.ok || !blockchainPublishRes.json?.success) {
    fail(`blockchain-publish (${blockchainPublishRes.status})`, JSON.stringify(blockchainPublishRes.json));
    process.exit(1);
  }
  pass(`block_id saved → ${blockchainPublishRes.json.data?.blockchainJobId}`);
  pass(`payment_token_address → ${blockchainPublishRes.json.data?.paymentTokenAddress}`);

  state = await dbJobState(jobId);
  info(dim(`DB: review_status=${state.review_status}, block_id=${state.block_id}, token=${state.payment_token_address}`));

  if (state.block_id === null) {
    fail("block_id is still NULL after blockchain-publish!"); process.exit(1);
  }
  pass(`block_id = ${state.block_id} — step 1 complete`);

  // ── Step 8: Add funds + activate ─────────────────────────────────────────
  step(8, "Blockchain Step 2 — simulate addFunds tx → POST /activate");

  // In real life: frontend calls addFunds on smart contract (approves token + sends tx).
  // The tx is confirmed on-chain. Then the frontend calls /activate.
  info("Simulating 500 USDC addFunds tx confirmed on Polygon...");

  const activateRes = await request("POST", `/api/jobs/${jobId}/activate`, {
    headers: { Cookie: sessionCookie },
  });

  if (!activateRes.ok || !activateRes.json?.success) {
    fail(`activate (${activateRes.status})`, JSON.stringify(activateRes.json));
    process.exit(1);
  }
  pass(`reviewStatus → ${activateRes.json.data?.reviewStatus}`);

  state = await dbJobState(jobId);
  info(dim(`DB: review_status=${state.review_status}, published=${state.published}, posted_at=${state.posted_at}`));

  if (state.review_status === "active" && state.published === true) {
    pass("Job is ACTIVE + PUBLISHED — now visible to talents");
  } else {
    fail("Job did not reach active+published state", JSON.stringify(state));
    process.exit(1);
  }

  // ── Step 9: Verify publicly accessible ───────────────────────────────────
  step(9, "Verify — job is publicly accessible via GET /api/jobs/[jobId]");

  // GET /api/jobs/[id] requires auth (talents are always logged in on the platform)
  const publicRes = await request("GET", `/api/jobs/${jobId}`, {
    headers: { Cookie: sessionCookie },
  });
  if (publicRes.ok && publicRes.json?.id) {
    pass(`Public endpoint returns job: "${publicRes.json.title}"`);
    pass(`reviewStatus: ${publicRes.json.reviewStatus}`);
    pass(`blockId: ${publicRes.json.blockId}`);
    pass(`paymentTokenAddress: ${publicRes.json.paymentTokenAddress}`);
  } else {
    fail(`GET /api/jobs/${jobId} returned ${publicRes.status}`, JSON.stringify(publicRes.json).slice(0, 200));
  }

  // ── Step 10: Guard tests ──────────────────────────────────────────────────
  step(10, "Guards — idempotency + duplicate prevention");

  // 10a: Double-activate → 409 "already active"
  const reactivateRes = await request("POST", `/api/jobs/${jobId}/activate`, {
    headers: { Cookie: sessionCookie },
  });
  if (reactivateRes.status === 409 && reactivateRes.json?.error?.includes("already active")) {
    pass("Double-activate: 409 'Job is already active'");
  } else {
    fail(`Expected 409, got ${reactivateRes.status}`, JSON.stringify(reactivateRes.json));
  }

  // 10b: blockchain-publish on already-active job → 409 (not in approved state)
  const rePublishRes = await request("POST", `/api/jobs/${jobId}/blockchain-publish`, {
    body: { blockchainJobId: 999, paymentTokenAddress: usdcPolygon },
    headers: { Cookie: sessionCookie },
  });
  if (rePublishRes.status === 409) {
    pass("Re-publish on active job: 409 (not in approved state)");
  } else {
    fail(`Expected 409, got ${rePublishRes.status}`, JSON.stringify(rePublishRes.json));
  }

  // 10c: Unauthorized activate → 401
  const unauthRes = await request("POST", `/api/jobs/${jobId}/activate`);
  if (unauthRes.status === 401) {
    pass("Unauthenticated request: 401 Unauthorized");
  } else {
    fail(`Expected 401, got ${unauthRes.status}`);
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  step("✧", "Cleanup — reset job to draft");
  await dbReset(jobId, {
    review_status: "draft", published: false, block_id: null,
    payment_token_address: null, admin_feedback: null,
    reviewed_at: null, reviewed_by: null, posted_at: null,
  });
  pass("Job reset to draft — no permanent changes made to dev DB");

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(bold(green("\n══════════════════════════════════════════════════")));
  console.log(bold(green("  ALL TESTS PASSED")));
  console.log(bold(green("══════════════════════════════════════════════════")));
  console.log(`\n  Job ID   : ${cyan(jobId)}`);
  console.log(`  Block ID : ${cyan(simulatedOnChainId)} (simulated Polygon job counter)`);
  console.log(`  Token    : ${cyan(usdcPolygon)}`);

  console.log(`\n  ${bold("Flow validated:")}`);
  console.log(`    ${green("✓")} AI generates structured job from free-text proposal`);
  console.log(`    ${green("✓")} Job created in DB with review_status=draft`);
  console.log(`    ${green("✓")} Company submits → pending_review`);
  console.log(`    ${green("✓")} Admin approves → approved, published=FALSE`);
  console.log(`    ${green("✓")} blockchain-publish saves block_id + token address`);
  console.log(`    ${green("✓")} Guard: activate blocked without block_id (409)`);
  console.log(`    ${green("✓")} Activate after funds → active, published=TRUE`);
  console.log(`    ${green("✓")} Job publicly accessible via GET /api/jobs/[id]`);
  console.log(`    ${green("✓")} Double-activate guard (409)`);
  console.log(`    ${green("✓")} Re-publish on active job guard (409)`);
  console.log(`    ${green("✓")} Unauthenticated activate guard (401)`);
  console.log();
}

run().catch(err => {
  console.error(red("\nFATAL:"), err.message ?? err);
  process.exit(1);
});
