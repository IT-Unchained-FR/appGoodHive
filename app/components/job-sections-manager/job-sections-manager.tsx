"use client";

import { IJobSection } from "@/interfaces/job-offer";
import { PlusIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import JobSectionEditor from "../job-section-editor/job-section-editor";

// Sortable wrapper for JobSectionEditor
interface SortableJobSectionProps {
  section: IJobSection;
  onUpdate: (section: IJobSection) => void;
  onDelete: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const SortableJobSection: React.FC<SortableJobSectionProps> = ({
  section,
  onUpdate,
  onDelete,
  isCollapsed,
  onToggleCollapse,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.sort_order.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <JobSectionEditor
        section={section}
        onUpdate={onUpdate}
        onDelete={onDelete}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

interface JobSectionsManagerProps {
  sections: IJobSection[];
  onSectionsChange: (sections: IJobSection[]) => void;
}

const DEFAULT_SECTION_TEMPLATES = [
  "About the Role",
  "What You'll Do",
  "Your DNA",
  "Requirements",
  "Benefits",
  "About the Company",
  "The Team",
  "Next Steps",
];

export const JobSectionsManager: React.FC<JobSectionsManagerProps> = ({
  sections,
  onSectionsChange,
}) => {
  // One section open at a time, as an accordion; the first by default.
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [showTemplates, setShowTemplates] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addSection = (heading: string = "") => {
    const newSection: IJobSection = {
      heading,
      content: "",
      sort_order: sections.length,
    };
    onSectionsChange([...sections, newSection]);
    setOpenIndex(sections.length);
  };

  const updateSection = (index: number, updatedSection: IJobSection) => {
    onSectionsChange(
      sections.map((section, i) => (i === index ? updatedSection : section))
    );
  };

  const deleteSection = (index: number) => {
    onSectionsChange(
      sections
        .filter((_, i) => i !== index)
        .map((section, i) => ({ ...section, sort_order: i }))
    );
    setOpenIndex((current) =>
      current === null || current === index
        ? null
        : current > index
          ? current - 1
          : current
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex(
      (section) => section.sort_order.toString() === active.id
    );
    const newIndex = sections.findIndex(
      (section) => section.sort_order.toString() === over.id
    );

    onSectionsChange(
      arrayMove(sections, oldIndex, newIndex).map((section, index) => ({
        ...section,
        sort_order: index,
      }))
    );
    // Keep the same section open after it moves.
    setOpenIndex((current) => {
      if (current === null) return null;
      if (current === oldIndex) return newIndex;
      if (oldIndex < current && current <= newIndex) return current - 1;
      if (newIndex <= current && current < oldIndex) return current + 1;
      return current;
    });
  };

  return (
    <div>
      {sections.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((section) => section.sort_order.toString())}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2.5">
              {sections.map((section, index) => (
                <SortableJobSection
                  key={`section-${index}`}
                  section={section}
                  onUpdate={(updatedSection) => updateSection(index, updatedSection)}
                  onDelete={() => deleteSection(index)}
                  isCollapsed={openIndex !== index}
                  onToggleCollapse={() =>
                    setOpenIndex((current) => (current === index ? null : index))
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="rounded-xl border border-dashed border-[#C9C3B2] bg-[#FCFBF8] px-6 py-8 text-center">
          <p className="text-sm text-[#6B665A]">
            No sections yet. Start with &ldquo;About the role&rdquo; and add more as you go.
          </p>
          <button
            type="button"
            onClick={() => addSection("About the role")}
            className="mt-4 inline-flex h-11 items-center rounded-[10px] bg-[#F5B800] px-5 text-sm font-bold text-[#1C1B17] hover:bg-[#E0A800]"
          >
            Add first section
          </button>
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => addSection()}
          className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-dashed border-[#C9C3B2] bg-white px-4 text-sm font-bold text-[#3A372F] hover:border-[#A39E8F]"
        >
          <PlusIcon className="h-4 w-4" strokeWidth={2.2} />
          Add section
        </button>
        <button
          type="button"
          onClick={() => setShowTemplates((open) => !open)}
          aria-expanded={showTemplates}
          className="h-11 px-3 text-sm font-semibold text-[#8A5A00] hover:underline"
        >
          Insert from template
        </button>
      </div>

      {showTemplates && (
        <div className="mt-3 rounded-xl border border-[#E8E5DC] bg-[#FCFBF8] p-4">
          <p className="mb-3 text-[13px] font-bold text-[#3A372F]">Pick a section heading</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {DEFAULT_SECTION_TEMPLATES.map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => {
                  addSection(template);
                  setShowTemplates(false);
                }}
                className="rounded-lg border border-[#E8E5DC] bg-white px-3 py-2 text-left text-[13px] font-semibold text-[#3A372F] hover:border-[#E0A800] hover:bg-[#FFFBEB]"
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSectionsManager;
