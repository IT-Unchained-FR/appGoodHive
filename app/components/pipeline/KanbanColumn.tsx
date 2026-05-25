"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TalentCard } from "./TalentCard";
import { STAGES, type PipelineEntry, type Stage } from "./pipeline-types";

interface KanbanColumnProps {
  stage: (typeof STAGES)[number];
  entries: PipelineEntry[];
  onDelete: (id: string) => void;
  onMove: (id: string, stage: Stage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSendToClient: (entry: PipelineEntry) => void;
}

export function KanbanColumn({
  stage,
  entries,
  onDelete,
  onMove,
  collapsed,
  onToggleCollapse,
  selectedIds,
  onToggleSelect,
  onSendToClient,
}: KanbanColumnProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: stage.key });

  return (
    <div
      className={`flex-shrink-0 w-72 flex flex-col rounded-2xl border-t-4 border border-slate-200 bg-slate-50 ${stage.color}`}
    >
      {/* Column header */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${stage.dot}`} />
          <span className="text-sm font-semibold text-slate-800">{stage.label}</span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
            {entries.length}
          </span>
        </div>
        {collapsed
          ? <ChevronRight className="w-4 h-4 text-slate-400" />
          : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {/* Cards */}
      {!collapsed && (
        <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div
            ref={setDropRef}
            className={`flex flex-col gap-2 px-3 pb-3 min-h-[80px] rounded-b-2xl transition-colors ${
              isOver ? "bg-amber-50" : ""
            }`}
          >
            {entries.length === 0 ? (
              <div
                className={`flex-1 rounded-xl border-2 border-dashed flex items-center justify-center py-6 text-xs transition-colors ${
                  isOver ? "border-amber-300 text-amber-500" : "border-slate-200 text-slate-400"
                }`}
              >
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
                  onSendToClient={onSendToClient}
                />
              ))
            )}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
