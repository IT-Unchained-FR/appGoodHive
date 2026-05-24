"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext, DragEndEvent, DragStartEvent, DragOverlay,
  PointerSensor, useSensor, useSensors, useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Trash2, ExternalLink, ChevronDown, ChevronRight,
  UserPlus, Download, GitCompare, X, CheckCircle2, Circle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/contexts/AuthContext";

type Stage = "shortlisted" | "contacted" | "interviewing" | "hired" | "rejected";

interface PipelineEntry {
  id: string;
  talent_id: string;
  stage: Stage;
  notes: string | null;
  job_id: string | null;
  created_at: string;
  updated_at: string;
  talent_name: string | null;
  talent_image: string | null;
  talent_skills: string | null;
  talent_title: string | null;
}

type PipelineData = Record<Stage, PipelineEntry[]>;

const STAGES: { key: Stage; label: string; color: string; dot: string; bg: string }[] = [
  { key: "shortlisted", label: "Shortlisted", color: "border-t-amber-400",   dot: "bg-amber-400",   bg: "bg-amber-100 text-amber-700" },
  { key: "contacted",   label: "Contacted",   color: "border-t-blue-400",    dot: "bg-blue-400",    bg: "bg-blue-100 text-blue-700" },
  { key: "interviewing",label: "Interviewing",color: "border-t-purple-400",  dot: "bg-purple-400",  bg: "bg-purple-100 text-purple-700" },
  { key: "hired",       label: "Hired",       color: "border-t-emerald-400", dot: "bg-emerald-400", bg: "bg-emerald-100 text-emerald-700" },
  { key: "rejected",    label: "Rejected",    color: "border-t-rose-300",    dot: "bg-rose-300",    bg: "bg-rose-100 text-rose-600" },
];

const VALID_STAGES: Stage[] = ["shortlisted", "contacted", "interviewing", "hired", "rejected"];

/* ═══════════════════════════════════════════════
   COMPARE MODAL
═══════════════════════════════════════════════ */
function CompareModal({
  entries,
  onClose,
}: {
  entries: PipelineEntry[];
  onClose: () => void;
}) {
  // Find shared skills
  const skillSets = entries.map((e) =>
    new Set((e.talent_skills ?? "").split(",").map((s) => s.trim()).filter(Boolean))
  );
  const sharedSkills = skillSets.length > 1
    ? [...skillSets[0]].filter((s) => skillSets.slice(1).every((set) => set.has(s)))
    : [];

  const stageMeta = (stage: Stage) => STAGES.find((s) => s.key === stage);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", background: "rgba(15,23,42,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <GitCompare className="w-4.5 h-4.5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Candidate Comparison</h2>
              <p className="text-xs text-slate-400">Side-by-side evaluation</p>
            </div>
          </div>
          {sharedSkills.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">{sharedSkills.length} shared skill{sharedSkills.length > 1 ? "s" : ""}</span>
            </div>
          )}
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Columns */}
        <div className="overflow-y-auto flex-1">
          <div className={`grid divide-x divide-slate-100 h-full`} style={{ gridTemplateColumns: `repeat(${entries.length}, 1fr)` }}>
            {entries.map((entry) => {
              const skills = (entry.talent_skills ?? "").split(",").map((s) => s.trim()).filter(Boolean);
              const stage = stageMeta(entry.stage);
              const initial = entry.talent_name?.[0]?.toUpperCase() ?? "T";

              return (
                <div key={entry.id} className="p-6 space-y-5 min-w-0">

                  {/* Avatar + name */}
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden">
                      {entry.talent_image
                        ? <img src={entry.talent_image} alt={entry.talent_name ?? ""} className="w-full h-full object-cover" />
                        : initial}
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900 leading-tight">{entry.talent_name ?? "Unknown"}</p>
                      {entry.talent_title && (
                        <p className="text-sm text-slate-500 mt-0.5">{entry.talent_title}</p>
                      )}
                    </div>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${stage?.bg ?? "bg-slate-100 text-slate-600"}`}>
                      {stage?.label ?? entry.stage}
                    </span>
                  </div>

                  <div className="h-px bg-slate-100" />

                  {/* Skills */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Skills</p>
                    {skills.length === 0
                      ? <p className="text-xs text-slate-400 italic">No skills listed</p>
                      : (
                        <div className="flex flex-wrap gap-1.5">
                          {skills.map((skill) => (
                            <span
                              key={skill}
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                                sharedSkills.includes(skill)
                                  ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {sharedSkills.includes(skill) && "✦ "}{skill}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>

                  <div className="h-px bg-slate-100" />

                  {/* Notes */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Notes</p>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl px-3 py-2.5 min-h-[60px]">
                      {entry.notes ?? <span className="text-slate-300 italic">No notes added</span>}
                    </p>
                  </div>

                  <div className="h-px bg-slate-100" />

                  {/* Meta */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Details</p>
                    <div className="space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Added</span>
                        <span className="font-medium text-slate-700">
                          {entry.created_at ? new Date(entry.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Last updated</span>
                        <span className="font-medium text-slate-700">
                          {entry.updated_at ? new Date(entry.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <a
                    href={`/talents/${entry.talent_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-slate-900 hover:bg-amber-500 text-white text-sm font-semibold py-2.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Full Profile
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shared skills footer */}
        {sharedSkills.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-3 bg-amber-50 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Shared skills:</span>
            {sharedSkills.map((s) => (
              <span key={s} className="text-[11px] font-semibold bg-white border border-amber-200 text-amber-700 px-2.5 py-0.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TALENT CARD
═══════════════════════════════════════════════ */
function TalentCard({
  entry,
  onDelete,
  onMove,
  selected,
  onToggleSelect,
}: {
  entry: PipelineEntry;
  onDelete: (id: string) => void;
  onMove: (id: string, stage: Stage) => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id });
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(entry.notes ?? "");

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const saveNotes = async () => {
    try {
      await fetch(`/api/pipeline/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      setEditingNotes(false);
    } catch {
      toast.error("Failed to save notes");
    }
  };

  const skills = entry.talent_skills
    ? entry.talent_skills.split(",").map((s: string) => s.trim()).filter(Boolean).slice(0, 3)
    : [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-150 ${
        selected ? "border-amber-400 ring-2 ring-amber-200" : "border-slate-200"
      }`}
    >
      {/* Select bar */}
      {onToggleSelect && (
        <button
          type="button"
          onClick={() => onToggleSelect(entry.id)}
          className={`w-full flex items-center gap-1.5 px-3 pt-2.5 pb-1 text-[11px] font-semibold transition-colors ${
            selected ? "text-amber-600" : "text-slate-300 hover:text-slate-500"
          }`}
        >
          {selected
            ? <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
            : <Circle className="w-3.5 h-3.5" />}
          {selected ? "Selected for compare" : "Add to compare"}
        </button>
      )}

      <div className="flex items-start gap-2 px-3 pb-3">
        <button
          type="button"
          className="flex-shrink-0 mt-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-xs flex-shrink-0 overflow-hidden">
              {entry.talent_image
                ? <img src={entry.talent_image} alt={entry.talent_name ?? ""} className="w-full h-full object-cover" />
                : (entry.talent_name?.[0]?.toUpperCase() ?? "T")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{entry.talent_name ?? "Talent"}</p>
              {entry.talent_title && <p className="text-xs text-slate-500 truncate">{entry.talent_title}</p>}
            </div>
          </div>

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {skills.map((skill) => (
                <span key={skill} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{skill}</span>
              ))}
            </div>
          )}

          {editingNotes ? (
            <div className="mt-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs resize-none focus:border-amber-400 focus:outline-none"
                autoFocus
              />
              <div className="flex gap-2 mt-1">
                <button type="button" onClick={() => void saveNotes()} className="text-xs text-amber-700 font-medium hover:text-amber-900">Save</button>
                <button type="button" onClick={() => setEditingNotes(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingNotes(true)}
              className="mt-1.5 text-xs text-slate-400 hover:text-slate-600 text-left w-full truncate"
            >
              {entry.notes ? `"${entry.notes}"` : "Add note..."}
            </button>
          )}

          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
            <select
              value={entry.stage}
              onChange={(e) => onMove(entry.id, e.target.value as Stage)}
              className="flex-1 text-xs rounded-lg border border-slate-200 px-2 py-1 bg-white focus:border-amber-400 focus:outline-none"
            >
              {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <a href={`/talents/${entry.talent_id}`} target="_blank" rel="noopener noreferrer" className="p-1 text-slate-400 hover:text-slate-600">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button type="button" onClick={() => onDelete(entry.id)} className="p-1 text-slate-400 hover:text-rose-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   KANBAN COLUMN
═══════════════════════════════════════════════ */
function KanbanColumn({
  stage, entries, onDelete, onMove, collapsed, onToggleCollapse, selectedIds, onToggleSelect,
}: {
  stage: (typeof STAGES)[number];
  entries: PipelineEntry[];
  onDelete: (id: string) => void;
  onMove: (id: string, s: Stage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: stage.key });

  return (
    <div className={`flex-shrink-0 w-72 flex flex-col rounded-2xl border-t-4 border border-slate-200 bg-slate-50 ${stage.color}`}>
      <button type="button" onClick={onToggleCollapse} className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${stage.dot}`} />
          <span className="text-sm font-semibold text-slate-800">{stage.label}</span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">{entries.length}</span>
        </div>
        {collapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {!collapsed && (
        <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div
            ref={setDropRef}
            className={`flex flex-col gap-2 px-3 pb-3 min-h-[80px] rounded-b-2xl transition-colors ${isOver ? "bg-amber-50" : ""}`}
          >
            {entries.length === 0 ? (
              <div className={`flex-1 rounded-xl border-2 border-dashed flex items-center justify-center py-6 text-xs transition-colors ${isOver ? "border-amber-300 text-amber-500" : "border-slate-200 text-slate-400"}`}>
                Drop here
              </div>
            ) : (
              entries.map((entry) => (
                <TalentCard
                  key={entry.id}
                  entry={entry}
                  onDelete={onDelete}
                  onMove={onMove}
                  selected={selectedIds.has(entry.id)}
                  onToggleSelect={onToggleSelect}
                />
              ))
            )}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
export default function RecruiterTalentPipelinePage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch("/api/pipeline", { cache: "no-store" });
      if (res.status === 401) { setPipeline(null); setErrorState("unauthorized"); return; }
      if (res.status === 403) { setPipeline(null); setErrorState("forbidden"); return; }
      if (!res.ok) { setPipeline(null); setErrorState("failed"); return; }
      const json = await res.json();
      if (json.success) { setPipeline(json.data); setErrorState(null); }
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
      for (const stage of VALID_STAGES) next[stage] = prev[stage].filter((e) => e.id !== entryId);
      next[newStage] = [...prev[newStage], { ...entry, stage: newStage }];
      return next;
    });
    try {
      await fetch(`/api/pipeline/${entryId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
    } catch { toast.error("Failed to move card"); void fetchPipeline(); }
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !pipeline) return;
    const overId = String(over.id);
    const targetStage = STAGES.find((s) => s.key === overId)?.key
      ?? Object.entries(pipeline).find(([, entries]) =>
          (entries as PipelineEntry[]).some((e) => e.id === overId)
        )?.[0] as Stage | undefined;
    if (!targetStage) return;
    void handleMove(String(active.id), targetStage);
  };

  const handleDelete = async (entryId: string) => {
    if (!window.confirm("Remove this talent from your pipeline?")) return;
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(entryId); return n; });
    setPipeline((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      for (const stage of VALID_STAGES) next[stage] = prev[stage].filter((e) => e.id !== entryId);
      return next;
    });
    try {
      await fetch(`/api/pipeline/${entryId}`, { method: "DELETE" });
    } catch { toast.error("Failed to remove"); void fetchPipeline(); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else if (next.size < 3) { next.add(id); }
      else { toast("You can compare up to 3 candidates at a time.", { icon: "ℹ️" }); }
      return next;
    });
  };

  const selectedEntries = pipeline
    ? Object.values(pipeline).flat().filter((e) => selectedIds.has(e.id))
    : [];

  if (isAuthLoading || loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
    </div>
  );
  if (errorState === "unauthorized") return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-slate-500">Please log in as a recruiter to view your pipeline.</p>
    </div>
  );
  if (errorState === "forbidden") return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <p className="text-center text-slate-500">Approved recruiter access is required.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-full">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Recruiter Dashboard</p>
            <h1 className="text-2xl font-semibold text-slate-900 mt-0.5">Talent Pipeline</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track and manage your candidates through the hiring process.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!pipeline) return;
                const rows = STAGES.flatMap(({ key, label }) =>
                  (pipeline[key] ?? []).map((e) => [
                    e.talent_name ?? "", e.talent_title ?? "", e.talent_skills ?? "",
                    label, e.notes ?? "",
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
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => router.push("/recruiter/dashboard/find-talents")}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition"
            >
              <UserPlus className="w-4 h-4" />
              Find Talents
            </button>
          </div>
        </div>
      </div>

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
                onToggleCollapse={() => setCollapsed((prev) => ({ ...prev, [stage.key]: !prev[stage.key] }))}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
          <DragOverlay>
            {activeId && (() => {
              const entry = Object.values(pipeline).flat().find((e) => e.id === activeId);
              return entry ? <TalentCard entry={entry} onDelete={() => {}} onMove={() => {}} /> : null;
            })()}
          </DragOverlay>
        </DndContext>
      )}

      {/* ── Floating compare bar ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex -space-x-2">
            {selectedEntries.map((e) => (
              <div key={e.id} className="w-7 h-7 rounded-full bg-amber-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                {e.talent_image
                  ? <img src={e.talent_image} alt="" className="w-full h-full object-cover" />
                  : e.talent_name?.[0]?.toUpperCase() ?? "?"}
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
    </div>
  );
}
