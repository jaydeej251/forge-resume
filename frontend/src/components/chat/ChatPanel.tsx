"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Composer } from "@/components/chat/Composer";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { DownloadPdfButton } from "@/components/pdf/DownloadPdfButton";
import { useResume } from "@/context/ResumeContext";
import { humanizeError } from "@/lib/errors";
import {
  isFlowComplete,
  isResumeStep,
  STEP_HINTS,
  type ResumeStep,
} from "@/types/steps";
import { templateSupportsPhoto } from "@/templates/registry";

const PLACEHOLDERS: Record<ResumeStep, string> = {
  basics: "e.g. Matt Santos, matt@email.com, Software Engineer",
  summary: "e.g. Emphasize B2B sales and customer demos — or looks good",
  skills: "e.g. Add Salesforce, remove Excel — or looks good",
  experience: "e.g. Acme Corp, Sales Engineer, 2017–2023. Did X and Y…",
  education: "e.g. Patts College, BS Aeronautical Engineering, 2012–2017",
};

const SUGGESTIONS: Record<ResumeStep, string[]> = {
  basics: [
    "I'm Alex Rivera, alex@email.com, applying for Product Designer",
    "Jordan Lee, jordan@work.com, Software Engineer",
  ],
  summary: [
    "Draft a summary for my target role",
    "looks good",
  ],
  skills: [
    "Suggest skills for my role",
    "looks good",
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

const COMPLETE_SUGGESTIONS = [
  "Tighten my summary",
  "Add another role at...",
  "Make my bullets more specific",
];

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
    clearLlmError,
    currentStep,
    streamStatus,
    flowComplete,
  } = useResume();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastFailed, setLastFailed] = useState<string | null>(null);
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

  const step: ResumeStep = isResumeStep(currentStep) ? currentStep : "basics";

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
    clearLlmError();
    setDraft("");
    try {
      await sendMessage(trimmed);
      setLastFailed(null);
    } catch (err) {
      const message = humanizeError(err, "Failed to send");
      setLastFailed(trimmed);
      setDraft(trimmed);
      setSendError(message);
    } finally {
      setSending(false);
    }
  };

  const retry = () => {
    const content = lastFailed?.trim();
    if (!content) return;
    void submit(content);
  };

  const busy = sending || llmStatus === "processing";
  const chipSource = complete ? COMPLETE_SUGGESTIONS : SUGGESTIONS[step];
  const lastIsAssistant =
    messages.length === 0 || messages[messages.length - 1]?.role === "assistant";
  const showChips = !busy && lastIsAssistant;
  const composedError = sendError || llmError;
  const canRetry = Boolean(lastFailed) && !busy && status === "ready";

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
              ? "Draft ready — keep chatting to polish, edit the canvas, or export."
              : STEP_HINTS[step]}
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
                  : message.status === "failed"
                    ? "rounded-2xl rounded-bl-md bg-red-50 text-[var(--danger)] ring-1 ring-red-200"
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
            {chipSource.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setDraft(chip)}
                className="suggestion-chip cursor-pointer"
              >
                {chip === "done" || chip === "skip" || chip === "looks good"
                  ? chip
                  : truncateChip(chip)}
              </button>
            ))}
          </div>
        )}

        {showPreviewCue && onViewPreview && (
          <button
            type="button"
            onClick={onViewPreview}
            className="message-enter suggestion-chip cursor-pointer border-[var(--accent)]/30 text-[var(--accent)] lg:hidden"
          >
            View preview →
          </button>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--line)]/70 bg-[var(--panel-elevated)]/90 px-3 py-3 backdrop-blur-md sm:px-4">
        {complete && (
          <div className="ready-dock mb-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display text-base font-semibold text-[var(--ink)]">
                  Resume ready
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--ink-soft)]">
                  Download anytime — or keep chatting below to polish.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <DownloadPdfButton
                  resume={resume}
                  template={template}
                  photoUrl={templateSupportsPhoto(template) ? photoUrl : null}
                  variant="accent"
                  size="sm"
                />
                {onViewPreview && (
                  <button
                    type="button"
                    onClick={onViewPreview}
                    className="cursor-pointer rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-slate-50 lg:hidden"
                  >
                    Preview
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onNewResume?.()}
                  className="cursor-pointer rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-slate-50"
                >
                  New
                </button>
              </div>
            </div>
          </div>
        )}

        <Composer
          value={draft}
          onChange={setDraft}
          onSubmit={() => void submit(draft)}
          placeholder={
            complete
              ? "e.g. Make my summary stronger for senior roles…"
              : PLACEHOLDERS[step]
          }
          disabled={status !== "ready"}
          busy={busy}
          statusText={streamStatus || undefined}
          error={composedError}
          onRetry={canRetry ? retry : undefined}
          retryLabel="Retry send"
        />
      </div>
    </div>
  );
}

function truncateChip(text: string) {
  return text.length > 42 ? `${text.slice(0, 40)}…` : text;
}
