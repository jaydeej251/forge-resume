"use client";

export function TypingIndicator({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[var(--muted)]">
      <span className="typing-dots" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      <span className="text-xs italic">{label || "Thinking…"}</span>
    </span>
  );
}
