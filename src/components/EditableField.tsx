"use client";

import { useRef, useState } from "react";

/**
 * A field that looks like text until you tap it. Rendering a real <input> at
 * all times (rather than swapping a label for an input on tap) means one tap
 * both focuses and places the caret — swapping on tap costs a second tap on
 * mobile and loses the caret position.
 */
export function EditableField({
  display,
  editValue,
  onCommit,
  label,
  inputMode = "text",
  className = "",
}: {
  /** Formatted text shown when the field isn't focused, e.g. "$14.50". */
  display: string;
  /** Raw text loaded into the box on focus, e.g. "14.50". */
  editValue: string;
  onCommit: (raw: string) => void;
  label: string;
  inputMode?: "text" | "decimal" | "numeric";
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const cancelled = useRef(false);

  const editing = draft !== null;

  return (
    <input
      aria-label={label}
      inputMode={inputMode}
      value={editing ? draft : display}
      onFocus={(e) => {
        cancelled.current = false;
        setDraft(editValue);
        // Select-all so a correction overwrites rather than appends.
        requestAnimationFrame(() => e.target.select());
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (!cancelled.current && draft !== null) onCommit(draft);
        setDraft(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          cancelled.current = true;
          e.currentTarget.blur();
        }
      }}
      className={[
        "-mx-1 min-w-0 rounded-md border border-transparent bg-transparent px-1 py-0.5",
        "hover:border-slate-200 hover:bg-slate-50",
        "focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100",
        className,
      ].join(" ")}
    />
  );
}
