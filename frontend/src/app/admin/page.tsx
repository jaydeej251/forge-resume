"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import {
  adminDeleteUserRequest,
  adminDeleteUserResumeRequest,
  adminStatsRequest,
  adminUserResumesRequest,
  adminUsersRequest,
  type AdminStats,
  type AdminUserRow,
  type ResumeSummary,
} from "@/lib/api";
import { humanizeError } from "@/lib/errors";
import { SESSION_STORAGE_KEY } from "@/templates/registry";

type PendingDelete =
  | { kind: "resume"; resume: ResumeSummary }
  | { kind: "user"; user: AdminUserRow }
  | null;

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
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [deleting, setDeleting] = useState(false);

  const refreshOverview = async () => {
    const [nextStats, nextUsers] = await Promise.all([
      adminStatsRequest(),
      adminUsersRequest(),
    ]);
    setStats(nextStats);
    setUsers(nextUsers.users);
  };

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

    void refreshOverview()
      .catch((err) =>
        setError(humanizeError(err, "Failed to load admin data")),
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
      setError(humanizeError(err, "Failed to load resumes"));
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

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError(null);
    try {
      if (pendingDelete.kind === "resume") {
        const userId = selectedId;
        if (userId == null) throw new Error("Select a user first");
        await adminDeleteUserResumeRequest(
          userId,
          pendingDelete.resume.session_id,
        );
        setResumes((rows) =>
          rows.filter(
            (row) => row.session_id !== pendingDelete.resume.session_id,
          ),
        );
        try {
          if (
            localStorage.getItem(SESSION_STORAGE_KEY) ===
            pendingDelete.resume.session_id
          ) {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        } catch {
          /* ignore */
        }
        await refreshOverview();
      } else {
        await adminDeleteUserRequest(pendingDelete.user.id);
        setUsers((rows) =>
          rows.filter((row) => row.id !== pendingDelete.user.id),
        );
        if (selectedId === pendingDelete.user.id) {
          setSelectedId(null);
          setSelectedEmail("");
          setResumes([]);
        }
        await refreshOverview();
      }
      setPendingDelete(null);
    } catch (err) {
      setError(humanizeError(err, "Delete failed"));
    } finally {
      setDeleting(false);
    }
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
            You don&apos;t have admin access on this account.
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

  const dialogTitle =
    pendingDelete?.kind === "user"
      ? "Delete this user?"
      : "Delete this resume?";
  const dialogBody =
    pendingDelete?.kind === "user"
      ? `“${pendingDelete.user.email}” and all of their resumes will be permanently deleted.`
      : pendingDelete?.kind === "resume"
        ? `“${
            pendingDelete.resume.full_name.trim() ||
            pendingDelete.resume.target_role.trim() ||
            "Untitled resume"
          }” will be permanently deleted.`
        : "";

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
              Manage users &amp; resumes · signed in as {user.email}
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
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
            <p className="text-sm text-[var(--danger)]">{error}</p>
            <button
              type="button"
              onClick={() => {
                if (selectedId != null) {
                  const row = users.find((u) => u.id === selectedId);
                  if (row) void loadUserResumes(row);
                  return;
                }
                setLoading(true);
                setError(null);
                void refreshOverview()
                  .catch((err) =>
                    setError(humanizeError(err, "Failed to load admin data")),
                  )
                  .finally(() => setLoading(false));
              }}
              className="cursor-pointer text-xs font-semibold text-[var(--danger)] underline-offset-2 hover:underline"
            >
              Retry
            </button>
          </div>
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
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => {
                  const active = selectedId === row.id;
                  const isSelf = row.id === user.id;
                  return (
                    <tr
                      key={row.id}
                      className={[
                        "border-b border-[var(--line)]/70 last:border-0 transition",
                        active ? "bg-[var(--accent-soft)]/50" : "hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <td className="px-4 py-3 font-medium text-[var(--ink)]">
                        <button
                          type="button"
                          onClick={() => void loadUserResumes(row)}
                          className="cursor-pointer text-left hover:underline"
                        >
                          {row.email}
                          {row.is_admin && (
                            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                              admin
                            </span>
                          )}
                        </button>
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
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={isSelf}
                          title={
                            isSelf
                              ? "You can't delete your own admin account here"
                              : "Delete user"
                          }
                          onClick={() => setPendingDelete({ kind: "user", user: row })}
                          className="cursor-pointer text-xs font-semibold text-[var(--danger)] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
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
            {selectedId ? `Resumes · ${selectedEmail}` : "Resumes"}
          </h2>
          {!selectedId && (
            <p className="mt-2 text-sm text-[var(--muted)]">
              Select a user to inspect or delete their resumes.
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
                <li
                  key={resume.id}
                  className="flex items-stretch gap-2 rounded-xl border border-[var(--line)] bg-white p-2"
                >
                  <button
                    type="button"
                    onClick={() => openResume(resume.session_id)}
                    className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2 text-left transition hover:bg-slate-50"
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
                  <button
                    type="button"
                    onClick={() =>
                      setPendingDelete({ kind: "resume", resume })
                    }
                    className="shrink-0 cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold text-[var(--danger)] hover:bg-red-50"
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={dialogTitle}
        body={dialogBody}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        cancelLabel="Keep"
        danger
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (!deleting) void confirmDelete();
        }}
      />
    </div>
  );
}
