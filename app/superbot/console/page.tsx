import type { CSSProperties } from "react";
import Link from "next/link";
import sql from "@/lib/ragDb";
import { getDateRange, getSuperbotMetrics } from "@/lib/superbot/analytics";
import { ContentItemManager } from "./ContentItemManager";
import { HandoffForm } from "./HandoffForm";

export const dynamic = "force-dynamic";

const PAGE_LIMIT = 25;

type SearchParams = {
  q?: string;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
  sessionId?: string;
};

export default async function SuperbotConsolePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const query = searchParams?.q?.trim();
  const typeFilter = searchParams?.type?.trim();
  const statusFilter = searchParams?.status?.trim();
  const range = getDateRange({ from: searchParams?.from, to: searchParams?.to });

  const sessionsPromise = query
    ? sql`
        SELECT
          s.id,
          s.telegram_chat_id,
          s.channel,
          s.updated_at,
          (
            SELECT text
            FROM goodhive.chat_messages m
            WHERE m.session_id = s.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) as last_message
        FROM goodhive.chat_sessions s
        WHERE s.id ILIKE ${`%${query}%`} OR s.telegram_chat_id ILIKE ${`%${query}%`}
        ORDER BY s.updated_at DESC
        LIMIT ${PAGE_LIMIT};
      `
    : sql`
        SELECT
          s.id,
          s.telegram_chat_id,
          s.channel,
          s.updated_at,
          (
            SELECT text
            FROM goodhive.chat_messages m
            WHERE m.session_id = s.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) as last_message
        FROM goodhive.chat_sessions s
        ORDER BY s.updated_at DESC
        LIMIT ${PAGE_LIMIT};
      `;

  const leadsPromise = sql`
    SELECT id, session_id, type, status, score, updated_at
    FROM goodhive.superbot_leads
    WHERE ${typeFilter ? sql`type = ${typeFilter}` : sql`true`}
      AND ${statusFilter ? sql`status = ${statusFilter}` : sql`true`}
    ORDER BY updated_at DESC
    LIMIT ${PAGE_LIMIT};
  `;

  const handoffsPromise = sql`
    SELECT id, lead_id, assigned_to, note, created_at
    FROM goodhive.handoffs
    ORDER BY created_at DESC
    LIMIT ${PAGE_LIMIT};
  `;

  const contentItemsPromise = sql`
    SELECT id, type, title, body, cta_label, cta_url, status, updated_at
    FROM goodhive.content_items
    ORDER BY updated_at DESC
    LIMIT ${PAGE_LIMIT};
  `;

  const [metrics, sessions, leads, handoffs, contentItems] = await Promise.all([
    getSuperbotMetrics(range),
    sessionsPromise,
    leadsPromise,
    handoffsPromise,
    contentItemsPromise,
  ]);

  const selectedSessionId = searchParams?.sessionId;
  const sessionMessages = selectedSessionId
    ? await sql`
        SELECT id, role, text, created_at
        FROM goodhive.chat_messages
        WHERE session_id = ${selectedSessionId}
        ORDER BY created_at ASC
        LIMIT 200;
      `
    : [];

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <section style={styles.header}>
          <div>
            <h1 style={styles.title}>Superbot Operator Console</h1>
            <p style={styles.subtitle}>Monitor sessions, leads, handoffs, and messaging performance.</p>
          </div>
          <div style={styles.headerActions}>
            <Link href="/superbot" className="saas-button" style={styles.headerButton}>
              Open Widget Preview
            </Link>
            <a
              className="saas-button"
              style={styles.headerButtonSecondary}
              href={`/api/superbot/analytics/export?from=${searchParams?.from ?? ""}&to=${searchParams?.to ?? ""}`}
            >
              Export CSV
            </a>
          </div>
        </section>

        <section style={styles.metricsGrid}>
          <MetricCard label="Active Sessions" value={metrics.sessions} />
          <MetricCard label="New Sessions" value={metrics.newSessions} />
          <MetricCard label="Leads" value={metrics.leads} />
          <MetricCard label="Handoffs" value={metrics.handoffs} />
          <MetricCard label="Inbound Messages" value={metrics.messagesInbound} />
          <MetricCard label="CTA Clicks" value={metrics.ctaClicks} />
        </section>

        <section className="saas-card" style={styles.filterCard}>
          <form style={styles.filterForm} method="get">
            <input
              className="saas-input"
              style={styles.filterInput}
              name="q"
              defaultValue={query ?? ""}
              placeholder="Search session or chat ID"
            />
            <input
              className="saas-input"
              style={styles.filterInput}
              name="from"
              type="date"
              defaultValue={searchParams?.from ?? ""}
            />
            <input
              className="saas-input"
              style={styles.filterInput}
              name="to"
              type="date"
              defaultValue={searchParams?.to ?? ""}
            />
            <select className="saas-input" style={styles.filterInput} name="type" defaultValue={typeFilter ?? ""}>
              <option value="">All Types</option>
              <option value="talent">Talent</option>
              <option value="company">Company</option>
            </select>
            <select className="saas-input" style={styles.filterInput} name="status" defaultValue={statusFilter ?? ""}>
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="handoff">Handoff</option>
            </select>
            <button className="saas-button" style={styles.filterButton} type="submit">
              Apply
            </button>
          </form>
        </section>

        <section style={styles.grid}>
          <div className="saas-card" style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h2 style={styles.cardTitle}>Recent Sessions</h2>
              <span className="saas-badge saas-badge-neutral">{sessions.length}</span>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Session</th>
                    <th style={styles.th}>Channel</th>
                    <th style={styles.th}>Last Message</th>
                    <th style={styles.th}>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} style={styles.tr}>
                      <td style={styles.td}>
                        <Link href={`/superbot/console?sessionId=${session.id}`} style={styles.link}>
                          {session.telegram_chat_id ?? session.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td style={styles.td}>{session.channel}</td>
                      <td style={styles.td} className="text-muted">
                        {session.last_message ?? "-"}
                      </td>
                      <td style={styles.td}>{new Date(session.updated_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={styles.empty}>
                        No sessions found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="saas-card" style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h2 style={styles.cardTitle}>Leads</h2>
              <span className="saas-badge saas-badge-neutral">{leads.length}</span>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Lead</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Score</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Updated</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} style={styles.tr}>
                      <td style={styles.td}>{lead.id.slice(0, 8)}</td>
                      <td style={styles.td}>{lead.type}</td>
                      <td style={styles.td}>{lead.score}</td>
                      <td style={styles.td}>
                        <span
                          className={`saas-badge ${lead.status === "handoff" ? "saas-badge-success" : "saas-badge-neutral"}`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td style={styles.td}>{new Date(lead.updated_at).toLocaleString()}</td>
                      <td style={styles.td}>
                        {lead.status === "handoff" ? "-" : <HandoffForm leadId={lead.id} />}
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={styles.empty}>
                        No leads yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="saas-card" style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h2 style={styles.cardTitle}>Content Items</h2>
            <span className="saas-badge saas-badge-neutral">{contentItems.length}</span>
          </div>
          <div style={{ padding: 20 }}>
            <ContentItemManager
              initialItems={contentItems.map((item) => ({
                id: item.id,
                type: item.type,
                title: item.title,
                body: item.body,
                ctaLabel: item.cta_label,
                ctaUrl: item.cta_url,
                status: item.status,
                updatedAt: new Date(item.updated_at).toISOString(),
              }))}
            />
          </div>
        </section>

        <section style={styles.grid}>
          <div className="saas-card" style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h2 style={styles.cardTitle}>Handoffs</h2>
              <span className="saas-badge saas-badge-neutral">{handoffs.length}</span>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Lead</th>
                    <th style={styles.th}>Assignee</th>
                    <th style={styles.th}>Note</th>
                    <th style={styles.th}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {handoffs.map((handoff) => (
                    <tr key={handoff.id} style={styles.tr}>
                      <td style={styles.td}>{handoff.lead_id.slice(0, 8)}</td>
                      <td style={styles.td}>{handoff.assigned_to ?? "-"}</td>
                      <td style={styles.td}>{handoff.note ?? "-"}</td>
                      <td style={styles.td}>{new Date(handoff.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {handoffs.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={styles.empty}>
                        No handoffs created yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="saas-card" style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h2 style={styles.cardTitle}>Conversation</h2>
              {selectedSessionId ? (
                <span className="saas-badge saas-badge-neutral">{selectedSessionId.slice(0, 8)}</span>
              ) : null}
            </div>
            <div style={styles.conversation}>
              {selectedSessionId ? (
                sessionMessages.length > 0 ? (
                  sessionMessages.map((message) => (
                    <div key={message.id} style={message.role === "user" ? styles.messageUser : styles.messageBot}>
                      <div style={message.role === "user" ? styles.bubbleUser : styles.bubbleBot}>
                        {message.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={styles.emptyText}>No messages for this session.</p>
                )
              ) : (
                <p style={styles.emptyText}>Select a session to view messages.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="saas-card" style={styles.metricCard}>
      <p style={styles.metricLabel}>{label}</p>
      <h3 style={styles.metricValue}>{value}</h3>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "40px 24px",
    display: "flex",
    justifyContent: "center",
    background: "linear-gradient(180deg, #fff7e1 0%, #ffffff 45%, #fff7e1 100%)",
  },
  container: {
    width: "100%",
    maxWidth: 1280,
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
    color: "#2d2a1f",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#7a5c22",
  },
  headerActions: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  headerButton: {
    padding: "8px 14px",
    fontSize: 13,
  },
  headerButtonSecondary: {
    padding: "8px 14px",
    fontSize: 13,
    background: "#fffaf0",
    color: "#7a5c22",
    border: "1px solid rgba(245, 158, 11, 0.35)",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
  },
  metricCard: {
    padding: 16,
  },
  metricLabel: {
    margin: 0,
    color: "#8a6c2f",
    fontSize: 13,
  },
  metricValue: {
    margin: "8px 0 0",
    fontSize: 22,
  },
  filterCard: {
    padding: 16,
  },
  filterForm: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
    alignItems: "center",
  },
  filterInput: {
    width: "100%",
  },
  filterButton: {
    padding: "10px 16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 24,
  },
  tableCard: {
    padding: 0,
    display: "flex",
    flexDirection: "column",
  },
  tableHeader: {
    padding: "16px 20px",
    borderBottom: "1px solid rgba(245, 158, 11, 0.2)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255, 243, 196, 0.6)",
  },
  cardTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#8a6c2f",
  },
  td: {
    padding: "12px 16px",
    borderTop: "1px solid rgba(245, 158, 11, 0.2)",
    fontSize: 13,
  },
  tr: {
    background: "transparent",
  },
  link: {
    color: "#b45309",
  },
  empty: {
    padding: 20,
    textAlign: "center",
    color: "#8a6c2f",
  },
  conversation: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    maxHeight: 480,
    overflowY: "auto",
  },
  messageUser: {
    alignSelf: "flex-end",
    maxWidth: "80%",
  },
  messageBot: {
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  bubbleUser: {
    background: "linear-gradient(135deg, #f59e0b, #f97316)",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 13,
    whiteSpace: "pre-wrap",
  },
  bubbleBot: {
    background: "#fff",
    border: "1px solid rgba(245, 158, 11, 0.2)",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 13,
    whiteSpace: "pre-wrap",
  },
  emptyText: {
    margin: 0,
    color: "#8a6c2f",
    fontSize: 13,
  },
};
