import type { ResumeState } from "@/types/resume";
import type { ResumeStep } from "@/types/steps";
import type { TemplateId } from "@/templates/registry";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type LlmStatus = "idle" | "processing" | "failed";

export type ResumeMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
};

export type ResumeSession = {
  id: number;
  session_id: string;
  data: ResumeState;
  template: TemplateId;
  photo_url: string | null;
  llm_status: LlmStatus;
  llm_error: string | null;
  current_step: ResumeStep;
  step_index: number;
  step_label: string;
  total_steps: number;
  messages: ResumeMessage[];
};

export type StreamHandlers = {
  onMessageStart?: (payload: {
    user_message: ResumeMessage;
    assistant_message: ResumeMessage;
    current_step: string;
    step_index: number;
    step_label: string;
    total_steps: number;
  }) => void;
  onStatus?: (payload: { message: string }) => void;
  onToken?: (payload: { content: string }) => void;
  onResume?: (payload: { data: ResumeState }) => void;
  onStep?: (payload: {
    current_step: string;
    step_index: number;
    step_label: string;
    total_steps: number;
    advanced: boolean;
    flow_complete?: boolean;
  }) => void;
  onAssistantDone?: (payload: ResumeMessage) => void;
  onDone?: (payload: { llm_status: LlmStatus; flow_complete?: boolean }) => void;
  onError?: (payload: { message: string; llm_status?: LlmStatus }) => void;
};

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `API ${response.status}: ${body || response.statusText}`,
    );
  }
  return response.json() as Promise<T>;
}

export async function createResumeSession(
  template: TemplateId = "classic",
): Promise<ResumeSession> {
  const response = await fetch(`${API_URL}/api/v1/resumes`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ template }),
  });
  return parseJson<ResumeSession>(response);
}

export async function getResumeSession(
  sessionId: string,
): Promise<ResumeSession> {
  const response = await fetch(
    `${API_URL}/api/v1/resumes/${encodeURIComponent(sessionId)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );
  return parseJson<ResumeSession>(response);
}

export async function updateResumeSession(
  sessionId: string,
  data: ResumeState,
): Promise<ResumeSession> {
  const response = await fetch(
    `${API_URL}/api/v1/resumes/${encodeURIComponent(sessionId)}`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    },
  );
  return parseJson<ResumeSession>(response);
}

export async function updateResumeTemplate(
  sessionId: string,
  template: TemplateId,
): Promise<ResumeSession> {
  const response = await fetch(
    `${API_URL}/api/v1/resumes/${encodeURIComponent(sessionId)}`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ template }),
    },
  );
  return parseJson<ResumeSession>(response);
}

export async function uploadResumePhoto(
  sessionId: string,
  file: File,
): Promise<ResumeSession> {
  const form = new FormData();
  form.append("photo", file);
  const response = await fetch(
    `${API_URL}/api/v1/resumes/${encodeURIComponent(sessionId)}/photo`,
    {
      method: "POST",
      headers: { Accept: "application/json" },
      body: form,
    },
  );
  return parseJson<ResumeSession>(response);
}

export async function deleteResumePhoto(
  sessionId: string,
): Promise<ResumeSession> {
  const response = await fetch(
    `${API_URL}/api/v1/resumes/${encodeURIComponent(sessionId)}/photo`,
    {
      method: "DELETE",
      headers: { Accept: "application/json" },
    },
  );
  return parseJson<ResumeSession>(response);
}

function dispatchSseEvent(
  eventName: string,
  data: string,
  handlers: StreamHandlers,
) {
  let payload: unknown = {};
  try {
    payload = JSON.parse(data);
  } catch {
    payload = { message: data };
  }

  const record = payload as Record<string, unknown>;

  switch (eventName) {
    case "message_start":
      handlers.onMessageStart?.(payload as Parameters<NonNullable<StreamHandlers["onMessageStart"]>>[0]);
      break;
    case "status":
      handlers.onStatus?.(payload as { message: string });
      break;
    case "token":
      handlers.onToken?.(payload as { content: string });
      break;
    case "resume":
      handlers.onResume?.(payload as { data: ResumeState });
      break;
    case "step":
      handlers.onStep?.(payload as Parameters<NonNullable<StreamHandlers["onStep"]>>[0]);
      break;
    case "assistant_done":
      handlers.onAssistantDone?.(payload as ResumeMessage);
      break;
    case "done":
      handlers.onDone?.(payload as { llm_status: LlmStatus; flow_complete?: boolean });
      break;
    case "error":
      handlers.onError?.({
        message: String(record.message ?? "Stream error"),
        llm_status: record.llm_status as LlmStatus | undefined,
      });
      break;
    default:
      break;
  }
}

export async function streamResumeMessage(
  sessionId: string,
  content: string,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/v1/resumes/${encodeURIComponent(sessionId)}/messages/stream`,
    {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
      signal,
    },
  );

  if (!response.ok || !response.body) {
    const body = await response.text();
    throw new Error(`API ${response.status}: ${body || response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventName = "message";
  let dataLines: string[] = [];

  const flush = () => {
    if (dataLines.length === 0) return;
    dispatchSseEvent(eventName, dataLines.join("\n"), handlers);
    eventName = "message";
    dataLines = [];
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line === "") {
        flush();
        continue;
      }
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
    }
  }

  flush();
}
