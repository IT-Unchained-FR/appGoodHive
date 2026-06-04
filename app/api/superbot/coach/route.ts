import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import { buildTalentContext } from "@/lib/ai/superbot-context";
import { buildCareerCoachSystemPrompt } from "@/lib/ai/superbot-prompt";
import { generateWithFallback } from "@/lib/ai/groq";

export const dynamic = "force-dynamic";

const MAX_HISTORY = 10;

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql<{ id: string; role: string; content: string; created_at: string }[]>`
      SELECT id, role, content, created_at
      FROM goodhive.superbot_coach_messages
      WHERE user_id = ${sessionUser.user_id}::uuid
      ORDER BY created_at ASC
      LIMIT 100
    `;

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Failed to fetch coach history:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { message?: unknown };
    const userMessage = typeof body.message === "string" ? body.message.trim() : null;

    if (!userMessage || userMessage.length === 0) {
      return NextResponse.json({ success: false, error: "message is required" }, { status: 400 });
    }

    if (userMessage.length > 2000) {
      return NextResponse.json({ success: false, error: "Message too long (max 2000 chars)" }, { status: 400 });
    }

    const userId = sessionUser.user_id;

    const historyRows = await sql<{ role: string; content: string }[]>`
      SELECT role, content
      FROM goodhive.superbot_coach_messages
      WHERE user_id = ${userId}::uuid
      ORDER BY created_at DESC
      LIMIT ${MAX_HISTORY}
    `;
    const history = historyRows.reverse();

    const context = await buildTalentContext(userId);
    const systemPrompt = buildCareerCoachSystemPrompt(context);

    await sql`
      INSERT INTO goodhive.superbot_coach_messages (user_id, role, content)
      VALUES (${userId}::uuid, 'user', ${userMessage})
    `;

    // Build conversation as a single prompt with history inlined
    const historyText = history
      .map((msg) => `${msg.role === "assistant" ? "Assistant" : "User"}: ${msg.content}`)
      .join("\n");

    const prompt = historyText
      ? `${historyText}\nUser: ${userMessage}`
      : userMessage;

    const reply = (await generateWithFallback(prompt, { systemPrompt })).trim();

    await sql`
      INSERT INTO goodhive.superbot_coach_messages (user_id, role, content)
      VALUES (${userId}::uuid, 'assistant', ${reply})
    `;

    return NextResponse.json({ success: true, data: { reply } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Career coach error:", message);
    return NextResponse.json({ success: false, error: "Failed to get response", detail: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await sql`
      DELETE FROM goodhive.superbot_coach_messages
      WHERE user_id = ${sessionUser.user_id}::uuid
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to clear coach history:", error);
    return NextResponse.json({ success: false, error: "Failed to clear history" }, { status: 500 });
  }
}
