"use client";

import { useState } from "react";
import { useResume } from "@/context/ResumeContext";
import { humanizeError } from "@/lib/errors";
import { TEMPLATES, type TemplateId } from "@/templates/registry";

export function TemplateSwitcher() {
  const { template, changeTemplate, llmStatus, status } = useResume();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSelect = async (next: TemplateId) => {
    if (next === template || busy) return;
    setBusy(true);
    setError(null);
    try {
      await changeTemplate(next);
    } catch (err) {
      setError(humanizeError(err, "Could not switch template"));
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy || status !== "ready" || llmStatus === "processing";

  return (
    <div className="min-w-0 max-w-full">
      <div
        role="group"
        aria-label="Resume template"
        className="template-switcher flex max-w-full flex-wrap items-center gap-0.5 rounded-lg bg-white/70 p-0.5 ring-1 ring-[var(--line)]"
      >
        {TEMPLATES.map((item) => {
          const active = item.id === template;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              title={item.blurb}
              onClick={() => void onSelect(item.id)}
              className={[
                "rounded-md px-2 py-1.5 text-[10px] font-semibold transition sm:text-[11px]",
                active
                  ? "bg-[var(--ink)] text-white shadow-sm"
                  : "text-[var(--ink-soft)] hover:bg-white hover:text-[var(--ink)]",
                disabled && !active ? "opacity-50" : "",
              ].join(" ")}
            >
              {item.name}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-1 text-[10px] text-[var(--danger)]">{error}</p>
      )}
      {busy && !error && (
        <p className="mt-1 text-[10px] text-[var(--muted)]">Updating layout…</p>
      )}
    </div>
  );
}
