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
  onRetry?: () => void;
  retryLabel?: string;
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
  onRetry,
  retryLabel = "Retry",
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
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-[var(--danger)]">
            {error}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={busy}
              className="cursor-pointer shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold text-[var(--danger)] underline-offset-2 hover:underline disabled:opacity-50"
            >
              {retryLabel}
            </button>
          )}
        </div>
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
            className="composer-send cursor-pointer"
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
