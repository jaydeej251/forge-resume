"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  claimSessionRequest,
  getStoredToken,
  googleAuthRequest,
  loginRequest,
  meRequest,
  setStoredToken,
  signupRequest,
  type AuthUser,
} from "@/lib/api";
import { SESSION_STORAGE_KEY } from "@/templates/registry";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  status: "loading" | "ready";
  signup: (input: {
    email: string;
    password: string;
    name?: string;
  }) => Promise<string | null>;
  login: (input: { email: string; password: string }) => Promise<string | null>;
  loginWithGoogle: (idToken: string) => Promise<string | null>;
  claimCurrentDraft: () => Promise<string | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function guestSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    const existing = getStoredToken();
    if (!existing) {
      setStatus("ready");
      return;
    }
    setToken(existing);
    void meRequest()
      .then(({ user: next }) => setUser(next))
      .catch(() => {
        setStoredToken(null);
        setToken(null);
        setUser(null);
      })
      .finally(() => setStatus("ready"));
  }, []);

  const applyAuth = useCallback(async (response: {
    token: string;
    user: AuthUser;
    claimed_session_id: string | null;
  }) => {
    setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);
    return response.claimed_session_id;
  }, []);

  const signup = useCallback(
    async (input: { email: string; password: string; name?: string }) => {
      const response = await signupRequest({
        ...input,
        session_id: guestSessionId(),
      });
      return applyAuth(response);
    },
    [applyAuth],
  );

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const response = await loginRequest({
        ...input,
        session_id: guestSessionId(),
      });
      return applyAuth(response);
    },
    [applyAuth],
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      const response = await googleAuthRequest({
        id_token: idToken,
        session_id: guestSessionId(),
      });
      return applyAuth(response);
    },
    [applyAuth],
  );

  const claimCurrentDraft = useCallback(async () => {
    const sessionId = guestSessionId();
    if (!sessionId || !getStoredToken()) return null;
    const { resume } = await claimSessionRequest(sessionId);
    return resume.session_id;
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      status,
      signup,
      login,
      loginWithGoogle,
      claimCurrentDraft,
      logout,
    }),
    [
      user,
      token,
      status,
      signup,
      login,
      loginWithGoogle,
      claimCurrentDraft,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
