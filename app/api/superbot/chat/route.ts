import { getOrCreateSession, handleIncomingMessage, logChatMessage, type EngineMessage } from "@/lib/superbot/engine";
import { SUPERBOT_NAME } from "@/lib/superbot/constants";

export const dynamic = "force-dynamic";

type WebChatRequest = {
  sessionId?: string;
  message?: string;
  action?: "start" | "message";
  payload?: string | null;
};

type WebChatResponse = {
  sessionId: string;
  messages: EngineMessage[];
};

const formatWebReply = (text: string, actions?: EngineMessage["actions"]) => {
  let body = text.trim();

  body = body.replace(/(\s)(\d+\))/g, "\n  $2");
  body = body.replace(/\n {2}1\)/, "\n\n  1)");
  body = body.replace(/,(\n\s*\d+\))/g, "$1");
  body = body
    .replace(/(^|\n)\s*(?:\*\*)?Quick Answer(?:\*\*)?:\s*/gi, "$1**Quick answer**\n")
    .replace(/(^|\n)\s*(?:\*\*)?Key Points?(?:\*\*)?:\s*/gi, "$1**Key points**\n")
    .replace(/(^|\n)\s*(?:\*\*)?Next Step(?:\*\*)?:\s*/gi, "$1**Next step**\n")
    .replace(/(\*\*Quick answer\*\*|\*\*Key points\*\*|\*\*Next step\*\*)\n+/g, "$1\n")
    .replace(/(^|\n)\s*\*\*\s+(?=\S)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!body.startsWith("**")) {
    body = `**${SUPERBOT_NAME}**\n_GoodHive support guide_\n\n${body}`;
  }

  if (actions && actions.length > 0) {
    const navLines = actions.map((action) => {
      const isTalent =
        action.callbackData === "create_talent" ||
        action.url?.includes("/talents/");
      const isCompany =
        action.callbackData === "create_company" ||
        action.url?.includes("/companies/");
      const label = isTalent
        ? "Join as a Talent"
        : isCompany
        ? "Join as a Company"
        : action.label;
      const link = action.url ? action.url : "";
      const suffix = link ? ` - ${link}` : "";
      return `- ${label}${suffix}`;
    });
    body += `\n\n**Navigation**\n${navLines.join("\n")}`;
  }

  return body.trim();
};

export async function POST(req: Request) {
  let body: WebChatRequest;

  try {
    body = (await req.json()) as WebChatRequest;
  } catch (error) {
    console.error("Invalid web chat payload", error);
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const action = body.action ?? "message";
  const message = body.message?.trim() ?? "";

  if (!message && action !== "start") {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  const session = await getOrCreateSession({
    channel: "web",
    sessionId: body.sessionId ?? null,
  });

  const messages: EngineMessage[] = [];
  const send = async (payload: EngineMessage) => {
    const formatted: EngineMessage = {
      ...payload,
      text: formatWebReply(payload.text, payload.actions),
    };
    messages.push(formatted);
    await logChatMessage(session.id, "assistant", formatted.text, { actions: formatted.actions });
  };

  await handleIncomingMessage({
    channel: "web",
    session,
    text: message || null,
    payload: action === "start" ? (body.payload ?? null) : undefined,
    userMeta: {
      userAgent: req.headers.get("user-agent") ?? undefined,
      referrer: req.headers.get("referer") ?? undefined,
    },
    send,
  });

  const response: WebChatResponse = {
    sessionId: session.id,
    messages,
  };

  return Response.json(response);
}
