"use client";

import { useEffect, useState } from "react";

const TIP_KEY = "forge_resume_tip_dismissed";

export function CoachTip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(TIP_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(TIP_KEY, "1");
    } catch {
      /* ignore quota */
    }
    setVisible(false);
  };

  return (
    <div className="coach-tip shrink-0 border-b border-[var(--accent)]/20 bg-[var(--accent-soft)]/80 px-4 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs leading-relaxed text-[var(--ink-soft)] sm:text-[13px]">
          <span className="font-semibold text-[var(--ink)]">Quick tip: </span>
          Chat drafts on the left · hover-edit the canvas · download when ready.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)] hover:bg-white/70"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
