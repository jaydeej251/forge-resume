"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  adminStatsRequest,
  adminUserResumesRequest,
  adminUsersRequest,
  type AdminStats,
  type AdminUserRow,
  type ResumeSummary,
} from "@/lib/api";
import { SESSION_STORAGE_KEY } from "@/templates/registry";

export default function AdminPage() {
  const router = useRouter();
  const { user, status } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingResumes, setLoadingResumes] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!user) {
      router.replace("/login?next=/admin");
      return;
    }
    if (!user.is_admin) {
      setLoading(false);
      return;
    }

    void Promise.all([adminStatsRequest(), adminUsersRequest()])
      .then(([nextStats, nextUsers]) => {
        setStats(nextStats);
        setUsers(nextUsers.users);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load admin data"),
      )
      .finally(() => setLoading(false));
  }, [user, status, router]);

  const loadUserResumes = async (row: AdminUserRow) => {
    setSelectedId(row.id);
    setSelectedEmail(row.email);
    setLoadingResumes(true);
    setError(null);
    try {
      const data = await adminUserResumesRequest(row.id);
      setResumes(data.resumes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resumes");
      setResumes([]);
    } finally {
      setLoadingResumes(false);
    }
  };

  const openResume = (sessionId: string) => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    } catch {
      /* ignore */
    }
    router.push("/builder");
  };

  if (status === "loading" || (user?.is_admin && loading)) {
    return (
      <div className="min-h-dvh bg-[var(--panel)] px-5 py-16 text-sm text-[var(--muted)]">
        Loading admin…
      </div>
    );
  }

  if (!user) return null;

  if (!user.is_admin) {
    return (
      <div className="min-h-dvh bg-[var(--panel)] px-5 py-16">
        <div className="mx-auto max-w-lg">
          <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">
            Forbidden
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Your account is not listed in ADMIN_EMAILS.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex cursor-pointer text-sm font-semibold text-[var(--accent)]"
          >
            Back to dashboard →
          </Link>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Users", value: stats?.users_count ?? 0 },
    { label: "Resumes", value: stats?.resumes_count ?? 0 },
    { label: "Owned", value: stats?.owned_resumes_count ?? 0 },
    { label: "Guest", value: stats?.guest_resumes_count ?? 0 },
  ];

  return (
    <div className="min-h-dvh bg-[var(--panel)]">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/"
              className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)]"
            >
              Forge Resume
            </Link>
            <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-[var(--ink)]">
              Admin
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Read-only overview · signed in as {user.email}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="cursor-pointer rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink-soft)] hover:bg-slate-50"
          >
            Dashboard
          </Link>
        </header>

        {error && (
          <p className="mt-6 text-sm text-[var(--danger)]">{error}</p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {kpi.label}
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--ink)]">
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Users</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Provider</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Resumes</th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => {
                  const active = selectedId === row.id;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => void loadUserResumes(row)}
                      className={[
                        "cursor-pointer border-b border-[var(--line)]/70 last:border-0 transition",
                        active ? "bg-[var(--accent-soft)]/50" : "hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <td className="px-4 py-3 font-medium text-[var(--ink)]">
                        {row.email}
                        {row.is_admin && (
                          <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                            admin
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-soft)]">
                        {row.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">{row.provider}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {new Date(row.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[var(--ink)]">
                        {row.resumes_count}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-[var(--muted)]"
                    >
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-[var(--ink)]">
            {selectedId
              ? `Resumes · ${selectedEmail}`
              : "Resumes"}
          </h2>
          {!selectedId && (
            <p className="mt-2 text-sm text-[var(--muted)]">
              Select a user to inspect their resumes.
            </p>
          )}
          {loadingResumes && (
            <p className="mt-4 text-sm text-[var(--muted)]">Loading resumes…</p>
          )}
          {!loadingResumes && selectedId && resumes.length === 0 && (
            <p className="mt-4 text-sm text-[var(--muted)]">
              This user has no owned resumes.
            </p>
          )}
          <ul className="mt-4 space-y-2">
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
                    className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-left transition hover:border-teal-700/35"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--ink)]">
                        {title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {resume.template} · {resume.step_label} · updated{" "}
                        {new Date(resume.updated_at).toLocaleString()}
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
        </section>
      </div>
    </div>
  );
}
