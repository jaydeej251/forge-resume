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
    currentStep,
    stepIndex,
    messages,
    flowComplete,
  } = useResume();

  const [mobilePane, setMobilePane] = useState<MobilePane>("chat");
  const [previewCue, setPreviewCue] = useState(false);
  const [lastLlm, setLastLlm] = useState(llmStatus);
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
        onReset={handleNew}
      />

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
            onNewResume={handleNew}
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
    </div>
  );
}
