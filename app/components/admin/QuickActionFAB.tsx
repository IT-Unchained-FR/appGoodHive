"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import styles from "./QuickActionFAB.module.css";

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface QuickActionFABProps {
  actions: QuickAction[];
}

function ActionButton({ icon: Icon, label, href, onClick }: QuickAction) {
  const content = (
    <div className={`${styles.actionButton} ${styles.stagger}`}>
      <Icon className={styles.actionIcon} />
      <span>{label}</span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-flex w-full">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="inline-flex w-full">
      {content}
    </button>
  );
}

export function QuickActionFAB({ actions }: QuickActionFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${styles.fabContainer} md:hidden`}
      aria-live="polite"
    >
      {isOpen && (
        <button
          className={styles.backdrop}
          aria-label="Close quick actions"
          onClick={() => setIsOpen(false)}
        />
      )}

      {isOpen && (
        <div className={`${styles.actionList} ${styles.actionListOpen}`}>
          {actions.map((action, idx) => (
            <div key={idx} style={{ "--delay": `${idx * 50}ms` } as any}>
              <ActionButton
                {...action}
                onClick={() => {
                  action.onClick?.();
                  setIsOpen(false);
                }}
              />
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className={styles.mainFab}
        aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? <X /> : <Plus />}
      </button>
    </div>
  );
}
