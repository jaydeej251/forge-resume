import type { ResumeState } from "@/types/resume";
import type { ResumeStep } from "@/types/steps";
import type { TemplateId } from "@/templates/registry";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
export const AUTH_TOKEN_KEY = "forge_resume_token";

export type LlmStatus = "idle" | "processing" | "failed";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  provider: string;
  is_admin?: boolean;
};

export type AdminStats = {
  users_count: number;
  resumes_count: number;
  owned_resumes_count: number;
  guest_resumes_count: number;
};

export type AdminUserRow = {
  id: number;
  email: string;
  name: string;
  provider: string;
  created_at: string;
  resumes_count: number;
  is_admin: boolean;
};

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
  user_id?: number | null;
  data: ResumeState;
  template: TemplateId;
  photo_url: string | null;
  llm_status: LlmStatus;
  llm_error: string | null;
  current_step: ResumeStep;
  step_index: number;
  step_label: string;
  total_steps: number;
  updated_at?: string;
  messages: ResumeMessage[];
};

export type ResumeSummary = {
  id: number;
  session_id: string;
  user_id: number | null;
  template: TemplateId;
  current_step: ResumeStep;
  step_label: string;
  full_name: string;
  target_role: string;
  updated_at: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
  claimed_session_id: string | null;
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

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function authHeaders(extra: HeadersInit = {}): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(extra as Record<string, string>),
  };
  const token = getStoredToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    let message = body || response.statusText;
    try {
      const json = JSON.parse(body) as { error?: string; errors?: string[] };
      if (json.error) message = json.error;
      else if (json.errors?.length) message = json.errors.join(", ");
    } catch {
      /* keep text */
    }
    throw new Error(message || `API ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function signupRequest(input: {
  email: string;
  password: string;
  name?: string;
  session_id?: string | null;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/v1/auth/signup`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(input),
  });
  return parseJson<AuthResponse>(response);
}

export async function loginRequest(input: {
  email: string;
  password: string;
  session_id?: string | null;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(input),
  });
  return parseJson<AuthResponse>(response);
}

export async function googleAuthRequest(input: {
  id_token: string;
  session_id?: string | null;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/v1/auth/google`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(input),
  });
  return parseJson<AuthResponse>(response);
}

export async function meRequest(): Promise<{ user: AuthUser }> {
  const response = await fetch(`${API_URL}/api/v1/auth/me`, {
    method: "GET",
    headers: authHeaders(),
  });
  return parseJson<{ user: AuthUser }>(response);
}

export async function claimSessionRequest(
  sessionId: string,
): Promise<{ user: AuthUser; resume: ResumeSummary }> {
  const response = await fetch(`${API_URL}/api/v1/auth/claim`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ session_id: sessionId }),
  });
  return parseJson(response);
}

export async function listResumesRequest(): Promise<{ resumes: ResumeSummary[] }> {
  const response = await fetch(`${API_URL}/api/v1/resumes`, {
    method: "GET",
    headers: authHeaders(),
  });
  return parseJson(response);
}

export async function adminStatsRequest(): Promise<AdminStats> {
  const response = await fetch(`${API_URL}/api/v1/admin/stats`, {
    method: "GET",
    headers: authHeaders(),
  });
  return parseJson(response);
}

export async function adminUsersRequest(): Promise<{ users: AdminUserRow[] }> {
  const response = await fetch(`${API_URL}/api/v1/admin/users`, {
    method: "GET",
    headers: authHeaders(),
  });
  return parseJson(response);
}

export async function adminUserResumesRequest(
  userId: number,
): Promise<{
  user: { id: number; email: string; name: string };
  resumes: ResumeSummary[];
}> {
  const response = await fetch(
    `${API_URL}/api/v1/admin/users/${userId}/resumes`,
    {
      method: "GET",
      headers: authHeaders(),
    },
  );
  return parseJson(response);
}

export async function createResumeSession(
  template: TemplateId = "classic",
): Promise<ResumeSession> {
  const response = await fetch(`${API_URL}/api/v1/resumes`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
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
      headers: authHeaders(),
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
      headers: authHeaders({ "Content-Type": "application/json" }),
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
      headers: authHeaders({ "Content-Type": "application/json" }),
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
      headers: authHeaders(),
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
      headers: authHeaders(),
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
      headers: authHeaders({
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      }),
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
