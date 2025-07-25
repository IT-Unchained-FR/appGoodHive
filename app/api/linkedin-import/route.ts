import { NextRequest, NextResponse } from "next/server";

const BRIGHTDATA_API_KEY = process.env.BRIGHTDATA_API_KEY as string;
const DATASET_ID =
  (process.env.BRIGHTDATA_DATASET_ID as string) || "gd_l1viktl72bvl7bjuj0"; // fallback to provided id

async function triggerScrape(linkedinUrl: string) {
  const response = await fetch(
    `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${DATASET_ID}&include_errors=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BRIGHTDATA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ url: linkedinUrl }]),
    },
  );

  if (!response.ok) throw new Error("Failed to trigger scrape");
  return response.json();
}

async function pollProgress(
  snapshotId: string,
  maxAttempts = 50,
  interval = 3000,
) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    const res = await fetch(
      `https://api.brightdata.com/datasets/v3/progress/${snapshotId}`,
      {
        headers: { Authorization: `Bearer ${BRIGHTDATA_API_KEY}` },
      },
    );
    console.log(res, "response of poll");
    if (!res.ok) throw new Error("Failed to check progress");
    const data = await res.json();
    console.log(data, "poll data...");
    if (data.status === "ready" || data.status === "error") return data;
    await new Promise((resolve) => setTimeout(resolve, interval));
    attempt++;
  }
  throw new Error("Scraping timed out");
}

async function fetchResult(snapshotId: string) {
  const res = await fetch(
    `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
    {
      headers: { Authorization: `Bearer ${BRIGHTDATA_API_KEY}` },
    },
  );
  if (!res.ok) throw new Error("Failed to fetch result");
  return res.json();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { message: "Username is required" },
      { status: 400 },
    );
  }

  const linkedinUrl = `https://www.linkedin.com/in/${username}`;

  try {
    // 1. Trigger scrape
    const trigger = await triggerScrape(linkedinUrl);
    console.log(trigger, "trigger response");
    const snapshotId = trigger.snapshot_id;
    console.log(snapshotId, "snap id");
    if (!snapshotId) throw new Error("No snapshot_id returned");

    // 2. Poll for progress
    const progress = await pollProgress(snapshotId);
    console.log(progress, "pollProgress");
    if (progress.status !== "ready") {
      return NextResponse.json(
        { message: "Scraping failed or not completed", progress },
        { status: 500 },
      );
    }

    // 3. Fetch result
    const result = await fetchResult(snapshotId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Bright Data LinkedIn scrape error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
