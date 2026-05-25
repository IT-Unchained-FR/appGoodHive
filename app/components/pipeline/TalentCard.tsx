"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Trash2, ExternalLink, CheckCircle2, Circle, Send,
} from "lucide-react";
import toast from "react-hot-toast";
import { PipelineAvatar } from "./PipelineAvatar";
import { STAGES, type PipelineEntry, type Stage } from "./pipeline-types";

interface TalentCardProps {
  entry: PipelineEntry;
  onDelete: (id: string) => void;
  onMove: (id: string, stage: Stage) => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onSendToClient?: (entry: PipelineEntry) => void;
}

export function TalentCard({
  entry,
  onDelete,
  onMove,
  selected,
  onToggleSelect,
  onSendToClient,
}: TalentCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id });
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(entry.notes ?? "");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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
        {/* Drag handle */}
        <button
          type="button"
          className="flex-shrink-0 mt-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          {/* Name + avatar */}
          <div className="flex items-center gap-2">
            <PipelineAvatar src={entry.talent_image} name={entry.talent_name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{entry.talent_name ?? "Talent"}</p>
              {entry.talent_title && <p className="text-xs text-slate-500 truncate">{entry.talent_title}</p>}
            </div>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {skills.map((skill) => (
                <span key={skill} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
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
                <button
                  type="button"
                  onClick={() => void saveNotes()}
                  className="text-xs text-amber-700 font-medium hover:text-amber-900"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingNotes(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
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

          {/* Actions row */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
            <select
              value={entry.stage}
              onChange={(e) => onMove(entry.id, e.target.value as Stage)}
              className="flex-1 text-xs rounded-lg border border-slate-200 px-2 py-1 bg-white focus:border-amber-400 focus:outline-none"
            >
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>

            {onSendToClient && (
              <button
                type="button"
                title="Send to Client"
                onClick={() => onSendToClient(entry)}
                className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}

            <a
              href={`/talents/${entry.talent_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => onDelete(entry.id)}
              className="p-1 text-slate-400 hover:text-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
