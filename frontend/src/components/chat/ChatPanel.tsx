"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Composer } from "@/components/chat/Composer";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { DownloadPdfButton } from "@/components/pdf/DownloadPdfButton";
import { useResume } from "@/context/ResumeContext";
import { isFlowComplete, STEP_HINTS } from "@/types/steps";
import { templateSupportsPhoto } from "@/templates/registry";

const PLACEHOLDERS = {
  basics: "e.g. Matt Santos, matt@email.com, Software Engineer",
  experience: "e.g. Acme Corp, Sales Engineer, 2017–2023. Did X and Y…",
  education: "e.g. Patts College, BS Aeronautical Engineering, 2012–2017",
} as const;

const SUGGESTIONS: Record<
  "basics" | "experience" | "education",
  string[]
> = {
  basics: [
    "I'm Alex Rivera, alex@email.com, applying for Product Designer",
    "Jordan Lee, jordan@work.com, Software Engineer",
  ],
  experience: [
    "Acme Corp, Sales Engineer, 2019–2023. Closed deals and ran demos.",
    "done",
  ],
  education: [
    "State University, BS Computer Science, 2015–2019",
    "skip",
  ],
};

type ChatPanelProps = {
  onViewPreview?: () => void;
  showPreviewCue?: boolean;
  onNewResume?: () => void;
};

export function ChatPanel({
  onViewPreview,
  showPreviewCue = false,
  onNewResume,
}: ChatPanelProps) {
  const {
    resume,
    template,
    photoUrl,
    messages,
    llmStatus,
    llmError,
    status,
    sendMessage,
    currentStep,
    streamStatus,
    resetSession,
    flowComplete,
  } = useResume();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastScrollKeyRef = useRef<string>("");

  const complete = useMemo(
    () =>
      flowComplete ||
      isFlowComplete({
        currentStep,
        hasEducation: resume.education.length > 0,
        messages,
      }),
    [flowComplete, currentStep, resume.education.length, messages],
  );

  useEffect(() => {
    const last = messages[messages.length - 1];
    const scrollKey = `${messages.length}:${last?.id ?? ""}:${last?.content.length ?? 0}:${llmStatus}`;
    if (scrollKey === lastScrollKeyRef.current) return;
    lastScrollKeyRef.current = scrollKey;

    const list = listRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [messages, llmStatus]);

  const submit = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || sending || llmStatus === "processing" || status !== "ready") {
      return;
    }

    setSending(true);
    setSendError(null);
    setDraft("");
    try {
      await sendMessage(trimmed);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const busy = sending || llmStatus === "processing";
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const showChips = !complete && !busy && userMessageCount === 0;

  return (
    <div className="chat-panel flex min-h-0 flex-1 flex-col bg-[var(--chat-bg)]">
      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4"
      >
        <div className="message-enter mb-4 px-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Coach
          </p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            {complete
              ? "Your draft is ready — polish on the canvas, then export."
              : STEP_HINTS[currentStep]}
          </p>
        </div>

        {messages.map((message) => (
          <div
            key={message.id}
            className={[
              "message-enter flex max-w-[94%]",
              message.role === "user" ? "ml-auto justify-end" : "mr-auto",
            ].join(" ")}
          >
            <div
              className={[
                "whitespace-pre-wrap px-3.5 py-2.5 text-[13px] leading-relaxed",
                message.role === "user"
                  ? "rounded-2xl rounded-br-md bg-[var(--ink)] text-white"
                  : "rounded-2xl rounded-bl-md bg-[var(--assistant-bubble)] text-[var(--ink-soft)] ring-1 ring-[var(--line)]/70",
              ].join(" ")}
            >
              {message.status === "pending" && !message.content ? (
                <TypingIndicator label={streamStatus || "Thinking…"} />
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}

        {showChips && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS[currentStep].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setDraft(chip)}
                className="suggestion-chip"
              >
                {chip === "done" || chip === "skip" ? chip : truncateChip(chip)}
              </button>
            ))}
          </div>
        )}

        {showPreviewCue && onViewPreview && (
          <button
            type="button"
            onClick={onViewPreview}
            className="message-enter suggestion-chip border-[var(--accent)]/30 text-[var(--accent)] lg:hidden"
          >
            View preview →
          </button>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--line)]/70 bg-[var(--panel-elevated)]/90 px-3 py-3 backdrop-blur-md sm:px-4">
        {complete ? (
          <div className="ready-dock">
            <p className="font-display text-base font-semibold text-[var(--ink)]">
              Resume ready
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ink-soft)]">
              Fine-tune the canvas, download a PDF, or start a new session.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <DownloadPdfButton
                resume={resume}
                template={template}
                photoUrl={templateSupportsPhoto(template) ? photoUrl : null}
                variant="accent"
              />
              {onViewPreview && (
                <button
                  type="button"
                  onClick={onViewPreview}
                  className="rounded-lg border border-[var(--line)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-slate-50 lg:hidden"
                >
                  Open preview
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (onNewResume) onNewResume();
                  else resetSession();
                }}
                className="rounded-lg border border-[var(--line)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-slate-50"
              >
                New resume
              </button>
            </div>
          </div>
        ) : (
          <Composer
            value={draft}
            onChange={setDraft}
            onSubmit={() => void submit(draft)}
            placeholder={PLACEHOLDERS[currentStep]}
            disabled={status !== "ready"}
            busy={busy}
            statusText={streamStatus || undefined}
            error={sendError || llmError}
          />
        )}
      </div>
    </div>
  );
}

function truncateChip(text: string) {
  return text.length > 42 ? `${text.slice(0, 40)}…` : text;
}
