"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/context/AuthContext";
import { humanizeError } from "@/lib/errors";

function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const search = useSearchParams();
  const { login, signup, loginWithGoogle } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const nextPath = search.get("next") || "/dashboard";

  const finish = (claimedSessionId: string | null) => {
    if (claimedSessionId && nextPath === "/builder") {
      router.push("/builder");
      return;
    }
    if (claimedSessionId) {
      router.push("/dashboard");
      return;
    }
    router.push(nextPath.startsWith("/") ? nextPath : "/dashboard");
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const claimed =
        mode === "signup"
          ? await signup({ email, password, name: name.trim() || undefined })
          : await login({ email, password });
      finish(claimed);
    } catch (err) {
      setError(humanizeError(err, "Authentication failed"));
      setBusy(false);
    }
  };

  const onGoogle = async (idToken: string) => {
    setBusy(true);
    setError(null);
    try {
      const claimed = await loginWithGoogle(idToken);
      finish(claimed);
    } catch (err) {
      setError(humanizeError(err, "Google sign-in failed"));
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-5 py-12 sm:py-16">
      <Link
        href="/"
        className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)]"
      >
        Forge Resume
      </Link>
      <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight text-[var(--ink)]">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {mode === "signup"
          ? "Save drafts across devices and manage multiple resumes."
          : "Sign in to open your saved resumes."}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {mode === "signup" && (
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              autoComplete="name"
            />
          </label>
        )}
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Password
          </span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </label>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full cursor-pointer rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {busy
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-[var(--muted)]">
        <span className="h-px flex-1 bg-[var(--line)]" />
        or
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>

      <GoogleSignInButton onCredential={onGoogle} disabled={busy} />

      <p className="mt-8 text-center text-sm text-[var(--muted)]">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link
              href={`/login?next=${encodeURIComponent(nextPath)}`}
              className="font-semibold text-[var(--accent)]"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link
              href={`/signup?next=${encodeURIComponent(nextPath)}`}
              className="font-semibold text-[var(--accent)]"
            >
              Create an account
            </Link>
          </>
        )}
      </p>

      <p className="mt-4 text-center text-sm">
        <Link href="/templates" className="text-[var(--muted)] hover:text-[var(--ink)]">
          Continue as guest →
        </Link>
      </p>
    </div>
  );
}

function AuthPageShell({ mode }: { mode: "login" | "signup" }) {
  return (
    <div className="min-h-dvh bg-[var(--panel)]">
      <Suspense
        fallback={
          <div className="px-5 py-16 text-sm text-[var(--muted)]">Loading…</div>
        }
      >
        <AuthForm mode={mode} />
      </Suspense>
    </div>
  );
}

export function LoginPage() {
  return <AuthPageShell mode="login" />;
}

export function SignupPage() {
  return <AuthPageShell mode="signup" />;
}
