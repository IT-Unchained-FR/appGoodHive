import { getGeminiModel } from "./gemini";
import { retrieveRagContexts, type RagContext } from "./ragEngine";

const CHAT_MODEL =
  process.env.GEMINI_CHAT_MODEL ?? "models/gemini-1.5-flash";
const FAST_MODEL =
  process.env.GEMINI_FAST_MODEL ?? "models/gemini-1.5-flash";
let resolvedChatModelName: string | null = null;

const getRagSourceLabel = (context: RagContext) => {
  if (context.sourceDisplayName) return context.sourceDisplayName;
  if (!context.sourceUri) return null;
  try {
    const url = new URL(context.sourceUri);
    return url.hostname.replace(/^www\./, "");
  } catch {
    const fallback = context.sourceUri.split("/").filter(Boolean).pop();
    return fallback || context.sourceUri;
  }
};

const buildRagKnowledgeBase = (contexts: RagContext[]) => {
  if (contexts.length === 0) return "";
  return contexts
    .map((context, index) => {
      const label = getRagSourceLabel(context);
      const header = label
        ? `Source ${index + 1} (${label}):`
        : `Source ${index + 1}:`;
      return `${header}\n${context.text.trim()}`;
    })
    .join("\n\n");
};

const isModelNotFoundError = (error: unknown) => {
  const status = (error as { status?: number })?.status;
  if (status === 404) return true;
  const message = (error as { message?: string })?.message ?? "";
  return (
    message.toLowerCase().includes("not found") ||
    message.toLowerCase().includes("not supported for generatecontent")
  );
};

const createGeminiContentGenerator = (
  primaryModelName: string,
  fallbackModelName?: string,
  onFallback?: (resolvedModelName: string) => void
) => {
  let activeModelName = primaryModelName;
  let fallbackUsed = false;

  return async (prompt: string) => {
    try {
      const model = getGeminiModel(activeModelName);
      return await model.generateContent(prompt);
    } catch (error) {
      if (
        fallbackModelName &&
        !fallbackUsed &&
        activeModelName !== fallbackModelName &&
        isModelNotFoundError(error)
      ) {
        fallbackUsed = true;
        activeModelName = fallbackModelName;
        onFallback?.(activeModelName);
        console.warn(
          `Gemini model ${primaryModelName} unavailable; falling back to ${fallbackModelName}`
        );
        const fallbackModel = getGeminiModel(activeModelName);
        return await fallbackModel.generateContent(prompt);
      }
      throw error;
    }
  };
};

export type ChatChannel = "telegram" | "web";

type DraftChatResponse = {
  reply: string;
  showProfileCta: boolean;
  ctaType?: "talent" | "company" | "both";
};

const buildSystemPrompt = (knowledgeBase: string, channel: ChatChannel) => {
  const channelGuidance =
    channel === "telegram"
      ? "Keep replies short (1-3 sentences, under 450 characters when possible)."
      : "Write a helpful 2-5 sentence reply. Be concise but not too short.";

  return `You are the GoodHive AI Assistant, a helpful and knowledgeable chatbot for GoodHive - the Web3-native collaborative recruitment platform.

YOUR ROLE:
- Answer questions about GoodHive, its platform, features, tokenomics, and how it works.
- Help users understand how to get started as talent or a company.
- Provide accurate information based ONLY on the knowledge base provided.
- Guide users to create their profiles when appropriate.

TONE & STYLE:
- Friendly, professional, and human. Use contractions.
- Do not say "As an AI" or mention policies.
- ${channelGuidance}
- Be helpful but not pushy. Ask a short follow-up question when useful.
- Use simple language and avoid jargon unless asked.
- Format lists clearly: put each step on a new line (e.g. "1) ...", "2) ...", "3) ...").
- If the answer is more than 2 sentences or has multiple points, use short sections and bold labels:
  - **Quick answer**: 1 sentence
  - **Key points**: 2-4 short bullets
  - **Next step**: 1 short question or suggestion
- If the answer is simple, reply in 1-2 sentences without section headers.
- For telegram, keep it to **Quick answer** + **Key points** (max 3 bullets) when sections are used.
- Do NOT include sources or citations in the reply.

IMPORTANT RULES:
1) ONLY answer based on the provided knowledge base.
2) If the knowledge base does not cover the question, say you don't have enough information and suggest asking a more specific question. If they need a deeper answer, invite them to book a quick call: https://calendly.com/benoit-kulesza/virtual-coffe-10-mins
3) NEVER make up information about fees, features, or processes.
4) When users ask about creating accounts, profiles, signing up, joining, applying, or hiring - you MUST indicate they should create a profile.
5) Detect user intent: if they seem like a talent/developer, suggest talent profile. If they seem like a company/hiring, suggest company profile.
6) If the user asks about supported wallets, include this line at the end: "If you don't see your wallet in the connect modal, contact support: https://www.goodhive.io/contact"

PROFILE CREATION TRIGGERS - Set showProfileCta to true when user mentions:
- Creating account/profile/signup/register/join
- Looking for work/jobs/opportunities (talent)
- Hiring/recruiting/finding developers (company)
- How to get started/begin
- Applying to GoodHive
- Becoming a talent/recruiter/mentor

KNOWLEDGE BASE:
${knowledgeBase}`;
};

export type ChatResponse = {
  reply: string;
  showProfileCta: boolean;
  ctaType?: "talent" | "company" | "both";
};

const formatReply = (reply: string) => {
  const withSteps = reply.replace(/(\s)(\d+\))/g, "\n$2");
  return withSteps.replace(/\n{3,}/g, "\n\n").trim();
};

const stripSources = (reply: string) =>
  reply.replace(/\n?Sources?:[^\n]*$/i, "").trim();

const extractModelText = (result: unknown) => {
  const response = (result as { response?: unknown })?.response ?? result;
  if (!response) return "";

  const responseWithText = response as { text?: () => string | string };
  if (typeof responseWithText.text === "function") {
    return responseWithText.text();
  }
  if (typeof responseWithText.text === "string") {
    return responseWithText.text;
  }

  const candidates = (response as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
    ?.candidates;
  if (candidates?.length) {
    const parts = candidates[0]?.content?.parts ?? [];
    return parts.map((part) => part.text ?? "").join("");
  }

  return "";
};

const safeParseJson = <T>(text: string): T | null => {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
};

export async function generateChatResponse(
  userMessage: string,
  conversationHistory?: string,
  channel: ChatChannel = "telegram"
): Promise<ChatResponse> {
  try {
    const generateChatContent = createGeminiContentGenerator(
      resolvedChatModelName ?? CHAT_MODEL,
      FAST_MODEL,
      (resolvedModelName) => {
        resolvedChatModelName = resolvedModelName;
      }
    );
    let ragContexts: RagContext[] = [];
    try {
      const ragResult = await retrieveRagContexts(userMessage);
      ragContexts = ragResult?.contexts ?? [];
    } catch (error) {
      console.warn("[rag-engine] Failed to retrieve contexts:", error);
    }
    if (ragContexts.length === 0) {
      const isWalletQuestion = /wallet/i.test(userMessage);
      const meetingLine =
        "If you'd like a deeper walkthrough, book a quick call: https://calendly.com/benoit-kulesza/virtual-coffe-10-mins";
      return {
        reply: isWalletQuestion
          ? `I couldn't find enough information in my knowledge base to answer that. If you don't see your wallet in the connect modal, contact support: https://www.goodhive.io/contact\n\n${meetingLine}`
          : `I couldn't find enough information in my knowledge base to answer that. Could you rephrase or ask a more specific GoodHive question?\n\n${meetingLine}`,
        showProfileCta: false,
      };
    }
    const historyContext = conversationHistory
      ? `\n\nRECENT CONVERSATION:\n${conversationHistory}\n`
      : "";

    const ragKnowledgeBase = buildRagKnowledgeBase(ragContexts);
    const prompt = `${buildSystemPrompt(ragKnowledgeBase, channel)}${historyContext}

USER MESSAGE: "${userMessage}"

Analyze the user's message and respond with a JSON object (no markdown, just pure JSON):
{
  "reply": "Your helpful response here",
  "showProfileCta": true/false (true if user is asking about creating profile, joining, applying, hiring, or getting started),
  "ctaType": "talent" | "company" | "both" (only if showProfileCta is true - "talent" if they're a developer/job seeker, "company" if they're hiring, "both" if unclear)
}`;

    const result = await generateChatContent(prompt);
    const text = extractModelText(result);

    const parsed = safeParseJson<DraftChatResponse>(text);
    if (!parsed) {
      throw new Error("Failed to parse model JSON response");
    }

    const finalReply = stripSources(
      formatReply(
        parsed.reply || "I'm here to help! Ask me anything about GoodHive."
      )
    );
    const finalShowProfileCta = parsed.showProfileCta ?? false;
    const finalCtaType = parsed.ctaType;

    return {
      reply: finalReply,
      showProfileCta: finalShowProfileCta ?? false,
      ctaType: finalCtaType,
    };
  } catch (error) {
    console.error("Chat response generation failed:", error);
    return {
      reply:
        "I'm having trouble processing that. Could you rephrase your question? You can ask me about GoodHive's platform, tokenomics, or how to get started!\n\nIf you'd like a deeper walkthrough, book a quick call: https://calendly.com/benoit-kulesza/virtual-coffe-10-mins",
      showProfileCta: false,
    };
  }
}

export async function generateAIResponse(userQuery: string) {
  const response = await generateChatResponse(userQuery);
  return response.reply;
}

export async function classifyIntent(userText: string) {
  try {
    const prompt = `Classify the user's intent into one category.\nUser said: "${userText}"\n\nCategories:\n- "hiring": They want to hire talent, build a team, or have a project\n- "applying": They are a developer/talent looking for work or to join\n- "question": They are asking about GoodHive, pricing, features, tokenomics\n- "general": Greetings, vague statements, or unclear intent\n\nReturn only JSON (no markdown): {"intent": "hiring" | "applying" | "question" | "general"}`;

    const model = getGeminiModel(FAST_MODEL);
    const result = await model.generateContent(prompt);
    const text = extractModelText(result);
    const jsonStr = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Intent classification failed:", error);
    return { intent: "general" };
  }
}

export async function analyzeInput(userText: string, fieldName: string) {
  try {
    const prompt = `You are a form validator. The user was asked for: "${fieldName}".\nUser replied: "${userText}".\n\nIs this a valid, direct answer? Return only JSON (no markdown):\n{"type": "answer" | "question" | "invalid", "valid": boolean}`;

    const model = getGeminiModel(FAST_MODEL);
    const result = await model.generateContent(prompt);
    const text = extractModelText(result);
    const jsonStr = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Input analysis failed:", error);
    return { type: "answer", valid: userText.length > 2 };
  }
}
