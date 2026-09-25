"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import { skills as ALL_SKILLS } from "@constants/skills";
import { jobEditorUi } from "./ui";

// Matching works best on concrete tools; these are highlighted so companies
// can see which of their skills carry little matching weight.
const SOFT_SKILLS = new Set(
  [
    "adaptability",
    "collaboration",
    "communication",
    "creativity",
    "critical thinking",
    "learning",
    "leadership",
    "problem solving",
    "teamwork",
    "time management",
  ].map((s) => s.toLowerCase()),
);

const SUGGESTION_POOL = [
  "Solidity",
  "TypeScript",
  "React",
  "Node.js",
  "Hardhat",
  "Foundry",
  "Ethers.js",
  "Rust",
  "Next.js",
  "Smart Contracts",
];

const MAX_MATCHES = 8;

export function isSoftSkill(skill: string) {
  return SOFT_SKILLS.has(skill.trim().toLowerCase());
}

export function SkillsField({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (skills: string[]) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => new Set(value.map((s) => s.toLowerCase())), [value]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    return (ALL_SKILLS as string[])
      .filter((skill) => skill.toLowerCase().includes(q) && !selected.has(skill.toLowerCase()))
      .slice(0, MAX_MATCHES);
  }, [query, selected]);

  const suggested = SUGGESTION_POOL.filter((s) => !selected.has(s.toLowerCase())).slice(0, 4);

  const add = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || selected.has(trimmed.toLowerCase())) return;
    onChange([...value, trimmed]);
    setQuery("");
  };

  return (
    <div>
      <div className="relative">
        <div
          className={`box-border flex min-h-[52px] flex-wrap items-center gap-2 rounded-[10px] border border-[#DCD8CC] px-2.5 py-2 focus-within:border-[#E0A800] focus-within:ring-[3px] focus-within:ring-[#F5B800]/25 ${
            disabled ? "bg-[#F3F1EA]" : "bg-white"
          }`}
        >
          {value.map((skill) => (
            <span
              key={skill}
              className={`inline-flex h-8 items-center gap-1 rounded-lg pl-3 pr-1 text-[13.5px] font-semibold text-[#2E2B24] ${
                isSoftSkill(skill) ? "bg-[#FFF1D6]" : "bg-[#F1EFE8]"
              }`}
            >
              {skill}
              <button
                type="button"
                aria-label={`Remove ${skill}`}
                disabled={disabled}
                onClick={() => onChange(value.filter((s) => s !== skill))}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[#6B665A] hover:bg-[#DCD8CC]"
              >
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </span>
          ))}
          <input
            aria-label="Add a skill"
            placeholder={value.length ? "Add a skill" : "Add a skill, e.g. Solidity"}
            value={query}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(matches[0] ?? query);
              } else if (e.key === "Backspace" && !query && value.length) {
                onChange(value.slice(0, -1));
              }
            }}
            className="h-8 min-w-[180px] flex-1 border-none bg-transparent text-sm font-medium outline-none"
          />
        </div>
        {open && query.trim() && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-[10px] border border-[#E8E5DC] bg-white py-1 shadow-lg">
            {matches.map((skill) => (
              <li key={skill}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add(skill)}
                  className="w-full px-3.5 py-2 text-left text-sm hover:bg-[#FBFAF6]"
                >
                  {skill}
                </button>
              </li>
            ))}
            {!matches.some((m) => m.toLowerCase() === query.trim().toLowerCase()) && (
              <li>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add(query)}
                  className="w-full px-3.5 py-2 text-left text-sm font-semibold text-[#8A5A00] hover:bg-[#FBFAF6]"
                >
                  + Add “{query.trim()}”
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {!disabled && suggested.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[12.5px] font-bold text-[#6B665A]">Suggested:</span>
          {suggested.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => add(skill)}
              className="h-[30px] rounded-full border border-[#E8E5DC] bg-white px-2.5 text-[12.5px] font-semibold text-[#3A372F] hover:border-[#BDB7A6]"
            >
              + {skill}
            </button>
          ))}
        </div>
      )}
      <p className={jobEditorUi.hint}>
        Press Enter to add. Backspace removes the last one.
      </p>
    </div>
  );
}
