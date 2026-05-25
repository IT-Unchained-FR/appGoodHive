"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext, DragEndEvent, DragStartEvent, DragOverlay,
  PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import { Download, GitCompare, UserPlus, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/contexts/AuthContext";

import { KanbanColumn } from "./KanbanColumn";
import { TalentCard } from "./TalentCard";
import { CompareModal } from "./CompareModal";
import { SendToClientModal } from "./SendToClientModal";
import { PipelineAvatar } from "./PipelineAvatar";
import { STAGES, VALID_STAGES, type PipelineEntry, type PipelineData, type Stage } from "./pipeline-types";

export interface PipelineBoardProps {
  /** Label shown in the header breadcrumb */
  roleLabel: string;
  /** Where the "Find Talents" CTA points */
  findTalentsHref: string;
  /** Button label for "Find Talents" CTA */
  findTalentsLabel?: string;
}

export function PipelineBoard({
  roleLabel,
  findTalentsHref,
  findTalentsLabel = "Find Talents",
}: PipelineBoardProps) {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const router = useRouter();

  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<"unauthorized" | "forbidden" | "failed" | null>(null);
  const [collapsed, setCollapsed] = useState<Record<Stage, boolean>>({
    shortlisted: false, contacted: false, interviewing: false, hired: true, rejected: true,
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const [clientSummaryEntry, setClientSummaryEntry] = useState<PipelineEntry | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch("/api/pipeline", { cache: "no-store" });
      if (res.status === 401) { setPipeline(null); setErrorState("unauthorized"); return; }
      if (res.status === 403) { setPipeline(null); setErrorState("forbidden"); return; }
      if (!res.ok) { setPipeline(null); setErrorState("failed"); return; }
      const json = await res.json() as { success: boolean; data?: PipelineData };
      if (json.success) { setPipeline(json.data ?? null); setErrorState(null); }
      else { setPipeline(null); setErrorState("failed"); }
    } catch {
      setPipeline(null); setErrorState("failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) { setLoading(false); setPipeline(null); setErrorState("unauthorized"); return; }
    setLoading(true);
    void fetchPipeline();
  }, [fetchPipeline, isAuthenticated, isAuthLoading]);

  const handleMove = async (entryId: string, newStage: Stage) => {
    setPipeline((prev) => {
      if (!prev) return prev;
      const allEntries = Object.values(prev).flat();
      const entry = allEntries.find((e) => e.id === entryId);
      if (!entry || entry.stage === newStage) return prev;
      const next = { ...prev };
      for (const s of VALID_STAGES) next[s] = prev[s].filter((e) => e.id !== entryId);
      next[newStage] = [...prev[newStage], { ...entry, stage: newStage }];
      return next;
    });
    try {
      await fetch(`/api/pipeline/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
    } catch {
      toast.error("Failed to move card");
      void fetchPipeline();
    }
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !pipeline) return;
    const overId = String(over.id);
    const targetStage =
      STAGES.find((s) => s.key === overId)?.key ??
      (Object.entries(pipeline).find(([, entries]) =>
        (entries as PipelineEntry[]).some((e) => e.id === overId)
      )?.[0] as Stage | undefined);
    if (!targetStage) return;
    void handleMove(String(active.id), targetStage);
  };

  const handleDelete = async (entryId: string) => {
    if (!window.confirm("Remove this talent from your pipeline?")) return;
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(entryId); return n; });
    setPipeline((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      for (const s of VALID_STAGES) next[s] = prev[s].filter((e) => e.id !== entryId);
      return next;
    });
    try {
      await fetch(`/api/pipeline/${entryId}`, { method: "DELETE" });
    } catch {
      toast.error("Failed to remove");
      void fetchPipeline();
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      } else {
        toast("You can compare up to 3 candidates at a time.", { icon: "ℹ️" });
      }
      return next;
    });
  };

  const handleExportCsv = () => {
    if (!pipeline) return;
    const rows = STAGES.flatMap(({ key, label }) =>
      (pipeline[key] ?? []).map((e) => [
        e.talent_name ?? "",
        e.talent_title ?? "",
        e.talent_skills ?? "",
        label,
        e.notes ?? "",
        e.created_at ? new Date(e.created_at).toLocaleDateString() : "",
      ])
    );
    const header = ["Name", "Title", "Skills", "Stage", "Notes", "Added"];
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `pipeline-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // Open or create a direct message thread with a pipeline talent
  const handleMessage = useCallback(async (entry: PipelineEntry) => {
    if (!user?.user_id) {
      toast.error("Please log in to message talents.");
      return;
    }
    const toastId = toast.loading("Opening conversation…");
    try {
      const res = await fetch("/api/messenger/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyUserId: user.user_id,
          talentUserId: entry.talent_id,
        }),
      });
      const json = await res.json() as { thread?: { id: string }; message?: string };
      if (!res.ok) {
        toast.error(json.message ?? "Could not open conversation", { id: toastId });
        return;
      }
      toast.success("Opening conversation…", { id: toastId });
      router.push(`/messages?thread=${json.thread?.id ?? ""}`);
    } catch {
      toast.error("Failed to open conversation", { id: toastId });
    }
  }, [user, router]);

  const selectedEntries = pipeline
    ? Object.values(pipeline).flat().filter((e) => selectedIds.has(e.id))
    : [];

  // ── Loading / error states ──
  if (isAuthLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (errorState === "unauthorized") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Please log in to view your pipeline.</p>
      </div>
    );
  }
  if (errorState === "forbidden") {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-6">
        <p className="text-center text-slate-500">Access is required to view the pipeline.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-full">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">{roleLabel}</p>
            <h1 className="text-2xl font-semibold text-slate-900 mt-0.5">Talent Pipeline</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Track and manage your candidates through the hiring process.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => router.push(findTalentsHref)}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition"
            >
              <UserPlus className="w-4 h-4" />
              {findTalentsLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Kanban board */}
      {!pipeline ? (
        <div className="text-center py-20 text-slate-500">Failed to load pipeline</div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 p-6 overflow-x-auto min-h-[calc(100vh-180px)]">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage.key}
                stage={stage}
                entries={pipeline[stage.key] ?? []}
                onDelete={handleDelete}
                onMove={handleMove}
                collapsed={collapsed[stage.key]}
                onToggleCollapse={() =>
                  setCollapsed((prev) => ({ ...prev, [stage.key]: !prev[stage.key] }))
                }
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onSendToClient={setClientSummaryEntry}
                onMessage={handleMessage}
              />
            ))}
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeId && (() => {
              const entry = Object.values(pipeline).flat().find((e) => e.id === activeId);
              return entry
                ? <TalentCard entry={entry} onDelete={() => {}} onMove={() => {}} />
                : null;
            })()}
          </DragOverlay>
        </DndContext>
      )}

      {/* Floating compare bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex -space-x-2">
            {selectedEntries.map((e) => (
              <div key={e.id} className="w-7 h-7 rounded-full border-2 border-slate-900 overflow-hidden">
                <PipelineAvatar src={e.talent_image} name={e.talent_name} size="sm" />
              </div>
            ))}
          </div>
          <span className="text-sm font-semibold">{selectedIds.size} selected</span>
          <span className="text-slate-500 text-xs">·</span>
          <span className="text-xs text-slate-400">{3 - selectedIds.size} more max</span>
          <button
            onClick={() => setCompareOpen(true)}
            disabled={selectedIds.size < 2}
            className="ml-1 inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-1.5 rounded-xl transition"
          >
            <GitCompare className="w-3.5 h-3.5" />
            Compare
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Compare modal */}
      {compareOpen && selectedEntries.length >= 2 && (
        <CompareModal entries={selectedEntries} onClose={() => setCompareOpen(false)} />
      )}

      {/* Send to Client modal */}
      {clientSummaryEntry && (
        <SendToClientModal
          entry={clientSummaryEntry}
          onClose={() => setClientSummaryEntry(null)}
        />
      )}
    </div>
  );
}
