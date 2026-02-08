"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

export type ContentItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  status: string;
  updatedAt: string;
};

type ContentItemManagerProps = {
  initialItems: ContentItem[];
};

type DraftItem = {
  type: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  status: string;
};

const EMPTY_DRAFT: DraftItem = {
  type: "post",
  title: "",
  body: "",
  ctaLabel: "",
  ctaUrl: "",
  status: "active",
};

export function ContentItemManager({ initialItems }: ContentItemManagerProps) {
  const [items, setItems] = useState<ContentItem[]>(initialItems);
  const [draft, setDraft] = useState<DraftItem>(EMPTY_DRAFT);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [items],
  );

  const updateDraft = (field: keyof DraftItem, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (id: string, field: keyof DraftItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const createItem = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/content-items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Failed to create content item");
      }

      const payload = (await response.json()) as { item: ContentItem };
      setItems((prev) => [payload.item, ...prev]);
      setDraft(EMPTY_DRAFT);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create content item";
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  const saveItem = async (item: ContentItem) => {
    setSavingId(item.id);
    setError(null);
    try {
      const response = await fetch(`/api/content-items/${item.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: item.type,
          title: item.title,
          body: item.body,
          ctaLabel: item.ctaLabel,
          ctaUrl: item.ctaUrl,
          status: item.status,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Failed to update content item");
      }

      const payload = (await response.json()) as { item: ContentItem };
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? payload.item : entry)));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update content item";
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={styles.form}>
        <div style={styles.formRow}>
          <input
            className="saas-input"
            style={styles.formInput}
            placeholder="Type (post, faq, case, job)"
            value={draft.type}
            onChange={(event) => updateDraft("type", event.target.value)}
          />
          <input
            className="saas-input"
            style={styles.formInput}
            placeholder="Title"
            value={draft.title}
            onChange={(event) => updateDraft("title", event.target.value)}
          />
          <input
            className="saas-input"
            style={styles.formInput}
            placeholder="CTA Label"
            value={draft.ctaLabel}
            onChange={(event) => updateDraft("ctaLabel", event.target.value)}
          />
          <input
            className="saas-input"
            style={styles.formInput}
            placeholder="CTA URL"
            value={draft.ctaUrl}
            onChange={(event) => updateDraft("ctaUrl", event.target.value)}
          />
        </div>
        <textarea
          className="saas-input"
          style={styles.formTextarea}
          placeholder="Body"
          rows={3}
          value={draft.body}
          onChange={(event) => updateDraft("body", event.target.value)}
        />
        <div style={styles.formRow}>
          <select
            className="saas-input"
            style={styles.statusSelect}
            value={draft.status}
            onChange={(event) => updateDraft("status", event.target.value)}
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
          <button className="saas-button" type="button" onClick={createItem} disabled={creating}>
            {creating ? "Creating..." : "Create Content Item"}
          </button>
        </div>
      </div>

      {error ? <p style={styles.error}>{error}</p> : null}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>CTA Label</th>
              <th style={styles.th}>CTA URL</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Updated</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item) => (
              <tr key={item.id} style={styles.tr}>
                <td style={styles.td}>
                  <input
                    className="saas-input"
                    style={styles.rowInput}
                    value={item.title}
                    onChange={(event) => updateItem(item.id, "title", event.target.value)}
                  />
                  <textarea
                    className="saas-input"
                    style={styles.rowTextarea}
                    rows={2}
                    value={item.body}
                    onChange={(event) => updateItem(item.id, "body", event.target.value)}
                  />
                </td>
                <td style={styles.td}>
                  <input
                    className="saas-input"
                    style={styles.rowInput}
                    value={item.type}
                    onChange={(event) => updateItem(item.id, "type", event.target.value)}
                  />
                </td>
                <td style={styles.td}>
                  <input
                    className="saas-input"
                    style={styles.rowInput}
                    value={item.ctaLabel}
                    onChange={(event) => updateItem(item.id, "ctaLabel", event.target.value)}
                  />
                </td>
                <td style={styles.td}>
                  <input
                    className="saas-input"
                    style={styles.rowInput}
                    value={item.ctaUrl}
                    onChange={(event) => updateItem(item.id, "ctaUrl", event.target.value)}
                  />
                </td>
                <td style={styles.td}>
                  <select
                    className="saas-input"
                    style={styles.rowInput}
                    value={item.status}
                    onChange={(event) => updateItem(item.id, "status", event.target.value)}
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </td>
                <td style={styles.td}>{new Date(item.updatedAt).toLocaleString()}</td>
                <td style={styles.td}>
                  <button
                    className="saas-button"
                    style={styles.saveButton}
                    type="button"
                    disabled={savingId === item.id}
                    onClick={() => saveItem(item)}
                  >
                    {savingId === item.id ? "Saving..." : "Save"}
                  </button>
                </td>
              </tr>
            ))}
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={7} style={styles.empty}>
                  No content items yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    border: "1px solid rgba(245, 158, 11, 0.25)",
    background: "#fffdf7",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    alignItems: "center",
  },
  formInput: {
    width: "100%",
  },
  formTextarea: {
    width: "100%",
    resize: "vertical",
  },
  statusSelect: {
    width: 160,
  },
  error: {
    margin: 0,
    color: "#dc2626",
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
    verticalAlign: "top",
  },
  tr: {
    background: "transparent",
  },
  rowInput: {
    width: "100%",
    padding: "6px 8px",
    fontSize: 12,
  },
  rowTextarea: {
    width: "100%",
    padding: "6px 8px",
    fontSize: 12,
    marginTop: 8,
    resize: "vertical",
  },
  saveButton: {
    padding: "6px 10px",
    fontSize: 12,
  },
  empty: {
    padding: 20,
    textAlign: "center",
    color: "#8a6c2f",
  },
};
