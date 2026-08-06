"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  deleteResumePhoto,
  getResumeSession,
  streamResumeMessage,
  updateResumeSession,
  updateResumeTemplate,
  uploadResumePhoto,
  type LlmStatus,
  type ResumeMessage,
  type ResumeSession,
} from "@/lib/api";
import {
  createEmptyResumeState,
  type ResumeState,
} from "@/types/resume";
import { isFlowComplete, isResumeStep, type ResumeStep } from "@/types/steps";
import {
  isTemplateId,
  SESSION_STORAGE_KEY,
  type TemplateId,
} from "@/templates/registry";
import { humanizeError } from "@/lib/errors";
import { formatResumeProperNouns } from "@/lib/formatDisplay";

const SAVE_DEBOUNCE_MS = 700;

export type SessionStatus = "loading" | "ready" | "error" | "idle";
export type SaveStatus = "idle" | "saving" | "saved" | "error";

type ResumeContextValue = {
  resume: ResumeState;
  sessionId: string | null;
  template: TemplateId;
  photoUrl: string | null;
  status: SessionStatus;
  saveStatus: SaveStatus;
  llmStatus: LlmStatus;
  llmError: string | null;
  messages: ResumeMessage[];
  currentStep: ResumeStep;
  stepIndex: number;
  stepLabel: string;
  totalSteps: number;
  flowComplete: boolean;
  streamStatus: string | null;
  error: string | null;
  setResume: (resume: ResumeState | ((current: ResumeState) => ResumeState)) => void;
  updateResume: (partial: Partial<ResumeState>) => void;
  resetSession: () => void;
  loadSession: (sessionId?: string) => Promise<void>;
  reloadSession: () => Promise<void>;
  changeTemplate: (template: TemplateId) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearLlmError: () => void;
  uploadPhoto: (file: File) => Promise<void>;
  removePhoto: () => Promise<void>;
};

const ResumeContext = createContext<ResumeContextValue | null>(null);

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [resume, setResumeState] = useState<ResumeState>(createEmptyResumeState);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [llmStatus, setLlmStatus] = useState<LlmStatus>("idle");
  const [llmError, setLlmError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ResumeMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<ResumeStep>("basics");
  const [stepIndex, setStepIndex] = useState(0);
  const [stepLabel, setStepLabel] = useState("Basics");
  const [totalSteps, setTotalSteps] = useState(3);
  const [flowComplete, setFlowComplete] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const skipNextSaveRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const commitResume = (
    value: ResumeState | ((current: ResumeState) => ResumeState),
  ) => {
    setResumeState((current) => {
      const next = typeof value === "function" ? value(current) : value;
      return formatResumeProperNouns(next);
    });
  };

  const setResume = (
    value: ResumeState | ((current: ResumeState) => ResumeState),
  ) => {
    commitResume(value);
  };

  const updateResume = (partial: Partial<ResumeState>) => {
    commitResume((current) => ({ ...current, ...partial }));
  };

  const applySession = useCallback((session: ResumeSession) => {
    skipNextSaveRef.current = true;
    localStorage.setItem(SESSION_STORAGE_KEY, session.session_id);
    setSessionId(session.session_id);
    setResumeState(formatResumeProperNouns(session.data));
    setTemplate(isTemplateId(session.template) ? session.template : "classic");
    setPhotoUrl(session.photo_url ?? null);
    setLlmStatus(session.llm_status ?? "idle");
    setLlmError(session.llm_error ?? null);
    setMessages(session.messages ?? []);
    if (session.current_step && isResumeStep(session.current_step)) {
      setCurrentStep(session.current_step);
    }
    if (typeof session.step_index === "number") setStepIndex(session.step_index);
    if (session.step_label) setStepLabel(session.step_label);
    if (typeof session.total_steps === "number") setTotalSteps(session.total_steps);
    const step =
      session.current_step && isResumeStep(session.current_step)
        ? session.current_step
        : "basics";
    setFlowComplete(
      isFlowComplete({
        currentStep: step,
        hasEducation: (session.data.education ?? []).length > 0,
        messages: session.messages ?? [],
      }),
    );
    setError(null);
    setSaveStatus("idle");
    setStatus("ready");
  }, []);

  const bootstrapSession = async () => {
    setStatus("loading");
    setError(null);

    try {
      const storedId = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!storedId) {
        setSessionId(null);
        setStatus("idle");
        return;
      }

      try {
        const existing = await getResumeSession(storedId);
        applySession(existing);
      } catch (err) {
        const message = humanizeError(err, "Couldn't restore your session.");
        const gone = /API 404|not found/i.test(
          err instanceof Error ? err.message : String(err),
        );
        if (gone) {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          setSessionId(null);
          setStatus("idle");
          return;
        }
        setSessionId(storedId);
        setError(message);
        setStatus("error");
      }
    } catch (err) {
      const message = humanizeError(err, "Couldn't restore your session.");
      setError(message);
      setStatus("error");
    }
  };

  const loadSession = async (sessionIdToLoad?: string) => {
    setStatus("loading");
    setError(null);
    const storedId =
      sessionIdToLoad ?? localStorage.getItem(SESSION_STORAGE_KEY);
    if (!storedId) {
      setSessionId(null);
      setStatus("idle");
      return;
    }
    try {
      const existing = await getResumeSession(storedId);
      applySession(existing);
    } catch (err) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setSessionId(null);
      setStatus("idle");
      throw new Error(humanizeError(err, "Failed to load resume session"));
    }
  };

  const reloadSession = async () => {
    await bootstrapSession();
  };

  const clearLlmError = () => {
    setLlmError(null);
    setLlmStatus((current) => (current === "failed" ? "idle" : current));
  };

  const resetSession = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    localStorage.removeItem(SESSION_STORAGE_KEY);
    skipNextSaveRef.current = true;
    setSessionId(null);
    setResumeState(createEmptyResumeState());
    setTemplate("classic");
    setPhotoUrl(null);
    setMessages([]);
    setLlmStatus("idle");
    setLlmError(null);
    setStreamStatus(null);
    setCurrentStep("basics");
    setStepIndex(0);
    setStepLabel("Basics");
    setTotalSteps(3);
    setFlowComplete(false);
    setStatus("idle");
    setError(null);
  };

  const uploadPhoto = async (file: File) => {
    if (!sessionId) return;
    const session = await uploadResumePhoto(sessionId, file);
    setPhotoUrl(session.photo_url);
  };

  const removePhoto = async () => {
    if (!sessionId) return;
    const session = await deleteResumePhoto(sessionId);
    setPhotoUrl(session.photo_url);
  };

  const changeTemplate = async (next: TemplateId) => {
    if (!sessionId || next === template) return;
    if (llmStatus === "processing") {
      throw new Error("Wait for the AI update to finish before switching templates.");
    }
    const session = await updateResumeTemplate(sessionId, next);
    setTemplate(isTemplateId(session.template) ? session.template : next);
  };

  const sendMessage = async (content: string) => {
    if (!sessionId) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLlmStatus("processing");
    setLlmError(null);
    setStreamStatus("Connecting…");

    let assistantId: number | null = null;
    let streamError: string | null = null;

    try {
      await streamResumeMessage(
        sessionId,
        content,
        {
          onMessageStart: (payload) => {
            assistantId = payload.assistant_message.id;
            setMessages((current) => [
              ...current,
              payload.user_message,
              payload.assistant_message,
            ]);
            if (isResumeStep(payload.current_step)) {
              setCurrentStep(payload.current_step);
            }
            setStepIndex(payload.step_index);
            setStepLabel(payload.step_label);
            setTotalSteps(payload.total_steps);
          },
          onStatus: (payload) => setStreamStatus(payload.message),
          onToken: (payload) => {
            if (assistantId == null) return;
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      content: `${message.content}${payload.content}`,
                      status: "pending",
                    }
                  : message,
              ),
            );
          },
          onResume: (payload) => {
            skipNextSaveRef.current = true;
            setResumeState(formatResumeProperNouns(payload.data));
          },
          onStep: (payload) => {
            if (isResumeStep(payload.current_step)) {
              setCurrentStep(payload.current_step);
            }
            setStepIndex(payload.step_index);
            setStepLabel(payload.step_label);
            setTotalSteps(payload.total_steps);
            if (typeof payload.flow_complete === "boolean") {
              setFlowComplete(payload.flow_complete);
            }
          },
          onAssistantDone: (payload) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === payload.id ? payload : message,
              ),
            );
          },
          onDone: (payload) => {
            setLlmStatus(payload.llm_status);
            setStreamStatus(null);
            if (typeof payload.flow_complete === "boolean") {
              setFlowComplete(payload.flow_complete);
            }
          },
          onError: (payload) => {
            const message = humanizeError(payload.message, "Chat update failed");
            streamError = message;
            setLlmStatus(payload.llm_status ?? "failed");
            setLlmError(message);
            setStreamStatus(null);
          },
        },
        controller.signal,
      );

      if (streamError) {
        throw new Error(streamError);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const message = humanizeError(err, "Failed to stream message");
      setLlmStatus("failed");
      setLlmError(message);
      setStreamStatus(null);
      throw new Error(message);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  };

  useEffect(() => {
    void bootstrapSession();
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (status !== "ready" || !sessionId) return;
    if (llmStatus === "processing") return;

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    setSaveStatus("saving");
    const timer = window.setTimeout(() => {
      void updateResumeSession(sessionId, resume)
        .then(() => setSaveStatus("saved"))
        .catch(() => setSaveStatus("error"));
    }, SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [resume, sessionId, status, llmStatus]);

  return (
    <ResumeContext.Provider
      value={{
        resume,
        sessionId,
        template,
        photoUrl,
        status,
        saveStatus,
        llmStatus,
        llmError,
        messages,
        currentStep,
        stepIndex,
        stepLabel,
        totalSteps,
        flowComplete,
        streamStatus,
        error,
        setResume,
        updateResume,
        resetSession,
        loadSession,
        reloadSession,
        changeTemplate,
        sendMessage,
        clearLlmError,
        uploadPhoto,
        removePhoto,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error("useResume must be used within a ResumeProvider");
  }
  return context;
}
