"use client";

import {
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
  busy?: boolean;
  statusText?: string;
  error?: string | null;
};

export function Composer({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
  busy = false,
  statusText,
  error,
}: ComposerProps) {
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim() || disabled || busy) return;
    onSubmit();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!value.trim() || disabled || busy) return;
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="composer-dock">
      {error && (
        <p className="mb-2 text-xs text-[var(--danger)]">{error}</p>
      )}
      <div className="composer-shell">
        <textarea
          ref={areaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          maxLength={4000}
          disabled={disabled || busy}
          placeholder={placeholder}
          className="composer-input"
        />
        <div className="flex items-end justify-between gap-2 px-1 pb-1">
          <p className="min-h-[1rem] text-[11px] text-[var(--muted)]">
            {busy
              ? statusText || "Updating resume…"
              : "Enter to send · Shift+Enter for line break"}
          </p>
          <button
            type="submit"
            disabled={disabled || busy || !value.trim()}
            aria-label="Send message"
            className="composer-send"
          >
            {busy ? (
              <span className="text-xs font-semibold">…</span>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
