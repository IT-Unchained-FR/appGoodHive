"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight, MessageCircle, X } from "lucide-react";
import { SUPERBOT_NAME } from "@/lib/superbot/constants";
import styles from "./SuperbotWidget.module.css";

type ChatAction = {
  label: string;
  value?: string;
  callbackData?: string;
  url?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions?: ChatAction[];
};

type ChatResponse = {
  sessionId: string;
  messages: Array<{
    text: string;
    actions?: ChatAction[];
  }>;
};

const FALLBACK_SUGGESTED_QUESTIONS = [
  "What is GoodHive and who is it for?",
  "How does hiring work for companies?",
  "What fees do companies pay and what services are optional?",
  "How does GoodHive vet talent?",
  "How do I get started as a talent?",
  "Can I join as a recruiter or mentor?",
  "How are payments and escrow handled?",
  "What wallets are supported?",
  "How does GoodHive tokenomics work?",
  "Can I book a quick call to learn more?",
];

const linkPattern = /https?:\/\/[^\s<]+/g;

const renderTextWithLinks = (text: string, keyPrefix: string) => {
  const matches = text.match(linkPattern) ?? [];
  const parts = text.split(linkPattern);
  const nodes: ReactNode[] = [];
  parts.forEach((part, index) => {
    if (part) {
      nodes.push(
        <span key={`${keyPrefix}-text-${index}`}>{part}</span>,
      );
    }
    const link = matches[index];
    if (link) {
      const cleaned = link.replace(/[),.]+$/g, "");
      const trailing = link.slice(cleaned.length);
      nodes.push(
        <a
          key={`${keyPrefix}-link-${index}`}
          href={cleaned}
          target="_blank"
          rel="noreferrer"
          className={styles.link}
        >
          {cleaned}
        </a>,
      );
      if (trailing) {
        nodes.push(
          <span key={`${keyPrefix}-trail-${index}`}>{trailing}</span>,
        );
      }
    }
  });
  return nodes;
};

const renderInline = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
  return parts.flatMap((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`bold-${index}`}>
          {renderTextWithLinks(part.slice(2, -2), `bold-${index}`)}
        </strong>
      );
    }
    if (part.startsWith("_") && part.endsWith("_")) {
      return (
        <em key={`italic-${index}`}>
          {renderTextWithLinks(part.slice(1, -1), `italic-${index}`)}
        </em>
      );
    }
    return (
      <span key={`text-${index}`}>
        {renderTextWithLinks(part, `text-${index}`)}
      </span>
    );
  });
};

const SECTION_HEADER_REGEX = /^\s*\*\*(quick answer|key points|next step)\*\*/i;

const isSectionHeader = (line: string) => SECTION_HEADER_REGEX.test(line.trim());

const isListLine = (line: string) => /^[-\u2022]\s+/.test(line.trim());

const normalizeLines = (lines: string[]) =>
  lines
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .filter((line) => !/^\*+\s*$/.test(line.trim()));

const renderSectionHeader = (line: string, index: string) => (
  <div key={`section-${index}`} className={styles.sectionHeader}>
    {renderInline(line)}
  </div>
);

const renderParagraphs = (block: string) => {
  const paragraphs = block
    .split(/\n{2,}/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const nodes: ReactNode[] = [];

  for (let index = 0; index < paragraphs.length; index += 1) {
    const lines = normalizeLines(paragraphs[index].split("\n"));
    if (lines.length === 0) continue;

    const nextParagraph = paragraphs[index + 1];
    const nextLines = nextParagraph
      ? normalizeLines(nextParagraph.split("\n"))
      : [];

    if (lines.length === 1 && isSectionHeader(lines[0]) && nextLines.length > 0) {
      const isNextList = nextLines.every(isListLine);
      nodes.push(
        <div key={`section-merge-${index}`} className={styles.sectionBlock}>
          {renderSectionHeader(lines[0], `${index}-head`)}
          {isNextList ? (
            <ul className={styles.list}>
              {nextLines.map((line, lineIndex) => (
                <li key={`li-${index}-${lineIndex}`} className={styles.listItem}>
                  {renderInline(line.replace(/^[-\u2022]\s+/, ""))}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.paragraph}>
              {nextLines.map((line, lineIndex) => (
                <span key={`section-line-${index}-${lineIndex}`}>
                  {renderInline(line)}
                  {lineIndex < nextLines.length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
          )}
        </div>,
      );
      index += 1;
      continue;
    }

    if (lines.length === 1 && isSectionHeader(lines[0])) {
      nodes.push(renderSectionHeader(lines[0], `${index}-solo`));
      continue;
    }

    if (lines.length > 1 && isSectionHeader(lines[0]) && !lines.slice(1).every(isListLine)) {
      nodes.push(
        <div key={`section-text-${index}`} className={styles.sectionBlock}>
          {renderSectionHeader(lines[0], `${index}-head`)}
          <p className={styles.paragraph}>
            {lines.slice(1).map((line, lineIndex) => (
              <span key={`section-line-${index}-${lineIndex}`}>
                {renderInline(line)}
                {lineIndex < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        </div>,
      );
      continue;
    }

    if (lines.length > 1 && isSectionHeader(lines[0]) && lines.slice(1).every(isListLine)) {
      nodes.push(
        <div key={`section-list-${index}`} className={styles.sectionBlock}>
          {renderSectionHeader(lines[0], `${index}-head`)}
          <ul className={styles.list}>
            {lines.slice(1).map((line, lineIndex) => (
              <li key={`li-${index}-${lineIndex}`} className={styles.listItem}>
                {renderInline(line.replace(/^[-\u2022]\s+/, ""))}
              </li>
            ))}
          </ul>
        </div>,
      );
      continue;
    }

    const isList = lines.length > 1 && lines.every(isListLine);

    if (isList) {
      nodes.push(
        <ul key={`list-${index}`} className={styles.list}>
          {lines.map((line, lineIndex) => (
            <li key={`li-${index}-${lineIndex}`} className={styles.listItem}>
              {renderInline(line.replace(/^[-\u2022]\s+/, ""))}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    nodes.push(
      <p key={`p-${index}`} className={styles.paragraph}>
        {lines.map((line, lineIndex) => (
          <span key={`line-${index}-${lineIndex}`}>
            {renderInline(line)}
            {lineIndex < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>,
    );
  }

  return nodes;
};

const renderMessageText = (text: string) => {
  const blocks = text.split(/```/);
  return blocks.map((block, index) => {
    if (index % 2 === 1) {
      return (
        <pre key={`code-${index}`} className={styles.codeBlock}>
          <code>{block.trim()}</code>
        </pre>
      );
    }
    return (
      <div key={`block-${index}`} className={styles.textBlock}>
        {renderParagraphs(block)}
      </div>
    );
  });
};

export function SuperbotWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const params = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasUnread, setHasUnread] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(
    FALLBACK_SUGGESTED_QUESTIONS,
  );
  const [showSuggestionsHint, setShowSuggestionsHint] = useState(false);
  const startedRef = useRef(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);
  const hasStartedChatting = messages.length > 0 || input.trim().length > 0;

  const parseChatResponse = useCallback(async (response: Response) => {
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Chat request failed (${response.status}): ${body || "empty response"}`);
    }
    const body = await response.text();
    if (!body) {
      throw new Error("Chat request returned an empty response.");
    }
    return JSON.parse(body) as ChatResponse;
  }, []);

  const startConversation = useCallback(async (existingSession?: string, payload?: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/superbot/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: existingSession,
          action: "start",
          payload: payload ?? null,
        }),
      });

      const data = await parseChatResponse(response);
      if (!data.sessionId) {
        throw new Error("Chat response missing sessionId.");
      }
      setSessionId(data.sessionId);
      window.localStorage.setItem("superbot_session_id", data.sessionId);

      if (data.messages?.length) {
        const botMessages: ChatMessage[] = data.messages.map((message, index) => ({
          id: `${Date.now()}-${index}`,
          role: "assistant",
          text: message.text,
          actions: message.actions,
        }));
        setMessages((prev) => [...prev, ...botMessages]);
      }
    } catch (error) {
      console.error("Failed to start chat", error);
    } finally {
      setLoading(false);
    }
  }, [parseChatResponse]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const storedSession = window.localStorage.getItem("superbot_session_id");
    const payload = params.get("payload") ?? params.get("start");
    startConversation(storedSession ?? undefined, payload ?? undefined);
  }, [params, startConversation]);

  useEffect(() => {
    let active = true;

    const loadSuggestions = async () => {
      try {
        const response = await fetch("/api/content-items?type=faq&status=active");
        if (!response.ok) return;
        const data = (await response.json()) as {
          items?: Array<{ title?: string }>;
        };
        const items = data.items ?? [];
        const questions = items
          .map((item) => item.title?.trim() ?? "")
          .filter((title) => title.length > 4);
        if (questions.length > 0 && active) {
          const merged = Array.from(
            new Set([...questions, ...FALLBACK_SUGGESTED_QUESTIONS]),
          );
          setSuggestedQuestions(merged.slice(0, 10));
        }
      } catch (error) {
        console.warn("Failed to load suggested questions", error);
      }
    };

    void loadSuggestions();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!endRef.current) return;
    endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!hasStartedChatting) {
      setShowSuggestionsHint(false);
      return;
    }
    const row = suggestionsRef.current;
    if (!row) return;

    const update = () => {
      const canScroll = row.scrollWidth > row.clientWidth + 1;
      const atEnd = row.scrollLeft >= row.scrollWidth - row.clientWidth - 1;
      setShowSuggestionsHint(canScroll && !atEnd);
    };

    update();
    row.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      row.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [hasStartedChatting, suggestedQuestions.length]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!isOpen && last?.role === "assistant") {
      setHasUnread(true);
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const resizeInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 120);
    el.style.height = `${Math.max(next, 44)}px`;
  }, []);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTimeout(resizeInput, 0);
    setLoading(true);

    try {
      const response = await fetch("/api/superbot/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: trimmed,
        }),
      });

      const data = await parseChatResponse(response);
      if (!data.sessionId) {
        throw new Error("Chat response missing sessionId.");
      }
      setSessionId(data.sessionId);
      window.localStorage.setItem("superbot_session_id", data.sessionId);

      if (data.messages?.length) {
        const botMessages: ChatMessage[] = data.messages.map((message, index) => ({
          id: `${Date.now()}-bot-${index}`,
          role: "assistant",
          text: message.text,
          actions: message.actions,
        }));
        setMessages((prev) => [...prev, ...botMessages]);
      }
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: ChatAction) => {
    if (action.url) {
      if (sessionId) {
        void fetch("/api/superbot/events", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId,
            type: "cta_click",
            metadata: {
              label: action.label,
              url: action.url,
            },
          }),
        });
      }
      window.open(action.url, "_blank", "noopener,noreferrer");
      return;
    }

    const value = action.value ?? action.label;
    void sendMessage(value);
  };

  return (
    <div className={styles.widgetRoot}>
      <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}>
        <div className={styles.header}>
          <div>
            <p className={styles.headerTitle}>{SUPERBOT_NAME}</p>
            <p className={styles.headerSubtitle}>GoodHive helper for hiring and talent.</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.headerStatus}>
              <span className={styles.headerDot} />
              <span>Online</span>
            </div>
            <button
              type="button"
              className={styles.headerButton}
              aria-label="Close chat"
              onClick={() => setIsOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className={styles.messages}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${message.role === "user" ? styles.messageUser : styles.messageBot}`}
            >
              <div
                className={`${styles.bubble} ${message.role === "user" ? styles.bubbleUser : styles.bubbleBot}`}
              >
                {renderMessageText(message.text)}
              </div>
              {message.actions && message.actions.length > 0 && message.role === "assistant" ? (
                <div className={styles.actionRow}>
                  {message.actions.map((action, index) =>
                    action.url ? (
                      <a
                        key={`${message.id}-action-${index}`}
                        href={action.url}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.actionButton}
                      >
                        {action.label}
                      </a>
                    ) : (
                      <button
                        key={`${message.id}-action-${index}`}
                        className={styles.actionButtonSecondary}
                        type="button"
                        onClick={() => handleAction(action)}
                        disabled={loading}
                      >
                        {action.label}
                      </button>
                    ),
                  )}
                </div>
              ) : null}
            </div>
          ))}
          {loading ? <div className={styles.typing}>Superbot is thinking...</div> : null}
          <div ref={endRef} />
        </div>

        {hasStartedChatting ? (
          <div className={styles.suggestions}>
            <p className={styles.suggestionsLabel}>Suggested questions</p>
            <div className={styles.suggestionsRowWrap}>
              <div ref={suggestionsRef} className={styles.suggestionsRow}>
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    className={styles.suggestionPill}
                    onClick={() => sendMessage(question)}
                    disabled={loading}
                  >
                    {question}
                  </button>
                ))}
              </div>
              <div
                className={`${styles.suggestionsFade} ${showSuggestionsHint ? "" : styles.suggestionsFadeHidden}`}
                aria-hidden="true"
              />
              <div
                className={`${styles.suggestionsScrollHint} ${showSuggestionsHint ? "" : styles.suggestionsScrollHintHidden}`}
                aria-hidden="true"
              >
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        ) : null}

        <div className={styles.composer}>
          <textarea
            ref={inputRef}
            className={styles.input}
            placeholder="Ask about GoodHive..."
            value={input}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
              setInput(event.target.value);
              resizeInput();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                if (!event.shiftKey) {
                  event.preventDefault();
                  void sendMessage(input);
                }
              }
            }}
            disabled={loading}
            rows={1}
          />
          <button
            className={styles.sendButton}
            type="button"
            onClick={() => sendMessage(input)}
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>

      <button
        type="button"
        className={styles.toggleButton}
        aria-label={isOpen ? "Close GoodHive helper" : "Open GoodHive helper"}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {hasUnread ? <span className={styles.toggleBadge} /> : null}
        <span className={styles.toggleIcon}>
          <MessageCircle size={26} />
        </span>
      </button>
    </div>
  );
}
