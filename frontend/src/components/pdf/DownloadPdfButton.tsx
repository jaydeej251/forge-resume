"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { ResumePdfDocument } from "@/components/pdf/ResumePdfDocument";
import { humanizeError } from "@/lib/errors";
import type { ResumeState } from "@/types/resume";
import type { TemplateId } from "@/templates/registry";

type DownloadPdfButtonProps = {
  resume: ResumeState;
  template?: TemplateId;
  photoUrl?: string | null;
  variant?: "primary" | "accent" | "ghost";
  size?: "sm" | "md";
  className?: string;
};

export function DownloadPdfButton({
  resume,
  template = "classic",
  photoUrl = null,
  variant = "primary",
  size = "md",
  className = "",
}: DownloadPdfButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setBusy(true);
    setError(null);
    try {
      const blob = await pdf(
        <ResumePdfDocument
          resume={resume}
          template={template}
          photoUrl={photoUrl}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const baseName =
        resume.personal_info.full_name.trim().replace(/\s+/g, "_") || "resume";
      anchor.href = url;
      anchor.download = `${baseName}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(humanizeError(err, "Couldn't prepare the PDF"));
    } finally {
      setBusy(false);
    }
  };

  const styles =
    variant === "accent"
      ? "bg-[var(--accent)] text-white hover:brightness-110"
      : variant === "ghost"
        ? "border border-[var(--line)] bg-white text-[var(--ink)] hover:bg-slate-50"
        : "bg-[var(--ink)] text-white hover:bg-[var(--ink-soft)]";

  const sizing =
    size === "sm" ? "rounded-lg px-2.5 py-1.5 text-xs" : "rounded-lg px-3.5 py-2 text-sm";

  return (
    <div className="inline-flex max-w-full flex-col items-stretch gap-1">
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={busy}
        className={`inline-flex cursor-pointer items-center justify-center font-semibold transition disabled:opacity-60 ${sizing} ${styles} ${className}`}
      >
        {busy ? "Preparing…" : size === "sm" ? "Download" : "Download PDF"}
      </button>
      {error && (
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={busy}
          className="cursor-pointer text-left text-[10px] font-semibold text-[var(--danger)] underline-offset-2 hover:underline disabled:opacity-50"
        >
          {error} · Retry
        </button>
      )}
    </div>
  );
}
