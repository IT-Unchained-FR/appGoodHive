"use client";

import { useState } from "react";

type HandoffFormProps = {
  leadId: string;
};

export function HandoffForm({ leadId }: HandoffFormProps) {
  const [assignedTo, setAssignedTo] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await fetch(`/api/superbot/leads/${leadId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "handoff",
          assignedTo: assignedTo || undefined,
          note: note || undefined,
        }),
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to mark handoff", error);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        className="saas-input"
        style={{ width: 120, padding: "6px 8px" }}
        placeholder="Assignee"
        value={assignedTo}
        onChange={(event) => setAssignedTo(event.target.value)}
        disabled={loading}
      />
      <input
        className="saas-input"
        style={{ width: 160, padding: "6px 8px" }}
        placeholder="Note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        disabled={loading}
      />
      <button
        className="saas-button"
        style={{ padding: "6px 10px", fontSize: 12 }}
        type="button"
        onClick={submit}
        disabled={loading}
      >
        {loading ? "Saving..." : "Handoff"}
      </button>
    </div>
  );
}
