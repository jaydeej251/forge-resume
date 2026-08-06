"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { listResumesRequest, type ResumeSummary } from "@/lib/api";
import { humanizeError } from "@/lib/errors";
import { SESSION_STORAGE_KEY } from "@/templates/registry";

export default function DashboardPage() {
  const router = useRouter();
  const { user, status, logout } = useAuth();
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!user) {
      router.replace("/login?next=/dashboard");
      return;
    }

    let cancelled = false;
    setLoading(true);
    void listResumesRequest()
      .then(({ resumes: rows }) => {
        if (!cancelled) {
          setResumes(rows);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(humanizeError(err, "Failed to load resumes"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, status, router]);

  const reload = () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    void listResumesRequest()
      .then(({ resumes: rows }) => setResumes(rows))
      .catch((err) => setError(humanizeError(err, "Failed to load resumes")))
      .finally(() => setLoading(false));
  };

  const openResume = (sessionId: string) => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    } catch {
      /* ignore */
    }
    router.push("/builder");
  };

  if (status === "loading" || (user && loading)) {
    return (
      <div className="min-h-dvh bg-[var(--panel)] px-5 py-16 text-sm text-[var(--muted)]">
        Loading your resumes…
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-[var(--panel)]">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/"
              className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)]"
            >
              Forge Resume
            </Link>
            <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-[var(--ink)]">
              Your resumes
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Signed in as {user.email}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user.is_admin && (
              <Link
                href="/admin"
                className="cursor-pointer rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--accent)] hover:bg-slate-50"
              >
                Admin
              </Link>
            )}
            <Link
              href="/templates"
              className="cursor-pointer rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              New resume
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="cursor-pointer rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink-soft)] hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </header>

        {error && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
            <p className="text-sm text-[var(--danger)]">{error}</p>
            <button
              type="button"
              onClick={reload}
              className="cursor-pointer text-xs font-semibold text-[var(--danger)] underline-offset-2 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && resumes.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-[var(--line)] bg-white/70 px-6 py-10 text-center">
            <p className="text-sm text-[var(--muted)]">
              No saved resumes yet. Start from a template — we’ll attach it to
              your account automatically.
            </p>
            <Link
              href="/templates"
              className="mt-4 inline-flex cursor-pointer text-sm font-semibold text-[var(--accent)]"
            >
              Browse templates →
            </Link>
          </div>
        )}

        <ul className="mt-8 space-y-3">
          {resumes.map((resume) => {
            const title =
              resume.full_name.trim() ||
              resume.target_role.trim() ||
              "Untitled resume";
            return (
              <li key={resume.id}>
                <button
                  type="button"
                  onClick={() => openResume(resume.session_id)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white px-4 py-4 text-left transition hover:border-teal-700/35 hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--ink)]">
                      {title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {resume.template} · {resume.step_label}
                      {resume.target_role
                        ? ` · ${resume.target_role}`
                        : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-[var(--accent)]">
                    Open →
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
