"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { CoachTip } from "@/components/chat/CoachTip";
import { SaveAccountBanner } from "@/components/chat/SaveAccountBanner";
import { AppTopBar } from "@/components/layout/AppTopBar";
import {
  MobilePaneTabs,
  type MobilePane,
} from "@/components/layout/MobilePaneTabs";
import { PreviewStage } from "@/components/layout/PreviewStage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useResume } from "@/context/ResumeContext";
import { isFlowComplete } from "@/types/steps";

export function BuilderShell() {
  const router = useRouter();
  const {
    resume,
    template,
    photoUrl,
    status,
    saveStatus,
    llmStatus,
    error,
    resetSession,
    reloadSession,
    currentStep,
    stepIndex,
    messages,
    flowComplete,
  } = useResume();

  const [mobilePane, setMobilePane] = useState<MobilePane>("chat");
  const [previewCue, setPreviewCue] = useState(false);
  const [lastLlm, setLastLlm] = useState(llmStatus);
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);
  const [reloading, setReloading] = useState(false);
  const skipIdleRedirectRef = useRef(false);

  const complete =
    flowComplete ||
    isFlowComplete({
      currentStep,
      hasEducation: resume.education.length > 0,
      messages,
    });

  useEffect(() => {
    if (lastLlm === "processing" && llmStatus === "idle") {
      setPreviewCue(true);
    }
    setLastLlm(llmStatus);
  }, [llmStatus, lastLlm]);

  useEffect(() => {
    if (status === "idle" && !skipIdleRedirectRef.current) {
      router.replace("/");
    }
    if (status === "ready") {
      skipIdleRedirectRef.current = false;
    }
  }, [status, router]);

  const openPreview = () => {
    setMobilePane("preview");
    setPreviewCue(false);
  };

  const handleNew = () => {
    skipIdleRedirectRef.current = true;
    resetSession();
    router.push("/templates");
  };

  const requestNew = () => setConfirmNewOpen(true);

  const retrySession = async () => {
    setReloading(true);
    try {
      await reloadSession();
    } finally {
      setReloading(false);
    }
  };

  const showChat = mobilePane === "chat";
  const showPreview = mobilePane === "preview";

  return (
    <div className="app-shell flex h-dvh max-h-dvh flex-col overflow-hidden">
      <AppTopBar
        resume={resume}
        template={template}
        photoUrl={photoUrl}
        status={status}
        saveStatus={saveStatus}
        llmStatus={llmStatus}
        error={error}
        currentStep={currentStep}
        stepIndex={stepIndex}
        complete={complete}
        onReset={requestNew}
      />

      {status === "error" && (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-[var(--danger)] sm:text-sm">
              {error || "Couldn't restore your session."}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={reloading}
                onClick={() => void retrySession()}
                className="cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-[var(--danger)] underline-offset-2 hover:underline disabled:opacity-50"
              >
                {reloading ? "Retrying…" : "Retry"}
              </button>
              <button
                type="button"
                onClick={requestNew}
                className="cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-[var(--ink-soft)] hover:bg-white/70"
              >
                New resume
              </button>
            </div>
          </div>
        </div>
      )}

      <MobilePaneTabs
        active={mobilePane}
        onChange={(pane) => {
          setMobilePane(pane);
          if (pane === "preview") setPreviewCue(false);
        }}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside
          className={[
            "chat-column min-h-0 w-full flex-col border-[var(--line)]/70 bg-[var(--chat-bg)]",
            "lg:w-[min(340px,32%)] lg:max-w-[360px] lg:shrink-0 lg:border-r",
            showChat ? "flex min-h-0 flex-1" : "hidden",
            "lg:flex",
          ].join(" ")}
        >
          {status === "ready" && <SaveAccountBanner />}
          {status === "ready" && <CoachTip />}
          <ChatPanel
            onViewPreview={openPreview}
            showPreviewCue={previewCue && showChat}
            onNewResume={requestNew}
          />
        </aside>

        <div
          className={[
            "preview-column min-h-0 w-full flex-col",
            showPreview ? "flex min-h-0 flex-1" : "hidden",
            "lg:flex lg:flex-1",
          ].join(" ")}
        >
          <PreviewStage
            complete={complete}
            showMobileDownload={showPreview}
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirmNewOpen}
        title="Start a new resume?"
        body="This clears the draft from this browser and returns you to templates. Signed-in users can reopen claimed resumes from the dashboard. Guest drafts in this tab will no longer auto-open."
        confirmLabel="Start new"
        cancelLabel="Keep editing"
        danger
        onCancel={() => setConfirmNewOpen(false)}
        onConfirm={() => {
          setConfirmNewOpen(false);
          handleNew();
        }}
      />
    </div>
  );
}
