"use client";

import { Pencil, Plus } from "lucide-react";
import { ComponentType, ReactNode, SVGProps, useEffect, useRef, useState } from "react";

type IconComponent = ComponentType<{ className?: string }>;

const strokeIcon = (props: SVGProps<SVGSVGElement>) => ({
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

// Lucide has no Stack Overflow or X glyphs, so these match its stroke style.
export const StackOverflowIcon = ({ className }: { className?: string }) => (
  <svg {...strokeIcon({ className })}>
    <path d="M4 15v5h14v-5" />
    <path d="M8 16.5h6" />
    <path d="m8.3 12.8 6 1.3" />
    <path d="m9.3 8.7 5.5 2.6" />
    <path d="m11.3 4.9 4.7 3.9" />
  </svg>
);

export const XIcon = ({ className }: { className?: string }) => (
  <svg {...strokeIcon({ className })}>
    <path d="M4 4l16 16" />
    <path d="M20 4 4 20" />
  </svg>
);

// Shared class tokens for the editorial company profile layout.
export const ui = {
  divider: "border-stone-900/20",
  muted: "text-stone-600",
  input:
    "block w-full h-9 px-2.5 text-sm text-stone-900 bg-[#fbf4e2] border border-stone-900/25 rounded-none placeholder:text-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors",
  btnSecondary:
    "inline-flex items-center gap-2 h-9 px-3.5 text-sm font-bold text-stone-900 border border-stone-900/40 bg-transparent hover:border-amber-500 hover:bg-amber-50 transition-colors",
  btnAccent:
    "inline-flex items-center gap-2 h-9 px-3.5 text-sm font-bold text-amber-700 border border-amber-500 bg-transparent hover:bg-amber-500 hover:text-white transition-colors",
  btnPrimary:
    "inline-flex items-center gap-2 h-9 px-3.5 text-sm font-bold text-white bg-amber-500 border border-transparent hover:bg-amber-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
  btnGhost:
    "inline-flex items-center gap-1.5 h-9 px-1 text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors",
};

export const hexClip = "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)";

export const SectionTitle = ({
  index,
  children,
  className = "",
}: {
  index: string;
  children: ReactNode;
  className?: string;
}) => (
  <h6
    className={`m-0 text-[13px] font-extrabold uppercase tracking-[0.08em] text-stone-900 ${className}`}
  >
    <span className="text-amber-600">{index}</span> {children}
  </h6>
);

export const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;

export const FieldRow = ({
  label,
  icon: Icon,
  htmlFor,
  last = false,
  children,
}: {
  label: string;
  icon?: IconComponent;
  htmlFor?: string;
  last?: boolean;
  children: ReactNode;
}) => {
  const border = `border-t ${ui.divider} ${last ? `border-b` : ""}`;
  return (
    <>
      <label
        htmlFor={htmlFor}
        className={`flex items-center gap-2 self-stretch py-2.5 text-stone-600 ${border}`}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 text-amber-600" />}
        {label}
      </label>
      <div className={`py-1.5 ${border}`}>{children}</div>
    </>
  );
};

export const LinkRow = ({
  name,
  label,
  icon: Icon,
  placeholder,
  value,
  onChange,
}: {
  name: string;
  label: string;
  icon: IconComponent;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  return (
    <div
      className={`grid min-h-[49px] grid-cols-[150px_minmax(0,1fr)_auto] items-center gap-x-3 border-b ${ui.divider} text-[13px]`}
    >
      <span className="flex items-center gap-2 font-semibold text-stone-900">
        <Icon className="h-4 w-4 shrink-0 text-amber-600" />
        {label}
      </span>
      {isEditing ? (
        <input
          ref={inputRef}
          name={name}
          className={ui.input}
          placeholder={placeholder}
          maxLength={255}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              e.preventDefault();
              setIsEditing(false);
            }
          }}
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={`cursor-text truncate ${value ? "text-stone-900" : "text-stone-400"}`}
        >
          {value || "Not linked"}
        </span>
      )}
      {!isEditing &&
        (value ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className={`${ui.btnGhost} text-stone-900 hover:text-amber-600`}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        ) : (
          <button type="button" onClick={() => setIsEditing(true)} className={ui.btnGhost}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        ))}
      {isEditing && <span />}
    </div>
  );
};
