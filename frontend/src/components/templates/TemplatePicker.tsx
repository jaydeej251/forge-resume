"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useResume } from "@/context/ResumeContext";
import { createResumeSession, getResumeSession } from "@/lib/api";
import {
  SESSION_STORAGE_KEY,
  TEMPLATES,
  type TemplateId,
} from "@/templates/registry";

export function TemplatePicker() {
  const router = useRouter();
  const { loadSession } = useResume();
  const [selected, setSelected] = useState<TemplateId>("classic");
  const [hasDraft, setHasDraft] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      setHasDraft(false);
      return;
    }
    void getResumeSession(id)
      .then(() => setHasDraft(true))
      .catch(() => {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setHasDraft(false);
      });
  }, []);

  const startFresh = async () => {
    setBusy(true);
    setError(null);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      const session = await createResumeSession(selected);
      await loadSession(session.session_id);
      router.push("/builder");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
      setBusy(false);
    }
  };

  const continueDraft = async () => {
    setBusy(true);
    setError(null);
    try {
      await loadSession();
      router.push("/builder");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open draft");
      setBusy(false);
    }
  };

  return (
    <div className="picker-shell min-h-dvh overflow-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-10 sm:px-6 sm:py-14">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <Link
              href="/"
              className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] transition hover:text-[var(--accent)] sm:text-4xl"
            >
              Forge Resume
            </Link>
            <p className="mt-2 text-base text-[var(--ink-soft)] sm:text-lg">
              Choose a template, then draft with AI and fine-tune on the live canvas.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Link
              href="/dashboard"
              className="cursor-pointer text-sm font-semibold text-[var(--accent)]"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="cursor-pointer rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--ink-soft)]"
            >
              Sign in
            </Link>
          </div>
        </header>

        {hasDraft && (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3">
            <p className="text-sm text-[var(--ink-soft)]">
              You have a draft in this browser.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void continueDraft()}
              className="rounded-lg bg-[var(--ink)] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[var(--ink-soft)] disabled:opacity-60"
            >
              Continue draft
            </button>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((template) => {
            const active = selected === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelected(template.id)}
                className={[
                  "template-card text-left transition",
                  active ? "template-card-active" : "",
                ].join(" ")}
              >
                <TemplateMiniPreview id={template.id} />
                <div className="mt-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-[var(--ink)]">{template.name}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {template.badge}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                    {template.blurb}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void startFresh()}
            className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {busy
              ? "Starting…"
              : `Use ${TEMPLATES.find((t) => t.id === selected)?.name}`}
          </button>
          <p className="text-xs text-[var(--muted)]">
            You can edit every field after the AI drafts — PDF matches this look.
          </p>
        </div>
      </div>
    </div>
  );
}

function TemplateMiniPreview({ id }: { id: TemplateId }) {
  if (id === "modern") {
    return (
      <div className="relative h-36 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/80">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-teal-700" />
        <div className="flex h-full gap-3 p-4 pl-5">
          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-300/90" />
          <div className="min-w-0 flex-1 space-y-2 pt-1">
            <div className="h-2.5 w-20 rounded bg-slate-800/80" />
            <div className="h-1.5 w-16 rounded bg-teal-700/50" />
            <div className="mt-2 h-1.5 w-full rounded bg-slate-300/80" />
            <div className="h-1.5 w-4/5 rounded bg-slate-300/70" />
          </div>
        </div>
      </div>
    );
  }

  if (id === "compact" || id === "minimal") {
    return (
      <div className="h-36 overflow-hidden rounded-xl bg-white p-3 ring-1 ring-slate-200/80">
        <div className="space-y-1.5">
          <div className="h-2 w-24 rounded bg-slate-800" />
          <div className="h-1.5 w-32 rounded bg-slate-400" />
          <div className="mt-2 border-t border-slate-300 pt-2">
            <div className="h-1.5 w-full rounded bg-slate-300" />
            <div className="mt-1 h-1.5 w-full rounded bg-slate-300" />
            <div className="mt-1 h-1.5 w-4/5 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (id === "executive") {
    return (
      <div className="h-36 overflow-hidden rounded-xl bg-[#fafafa] p-4 ring-1 ring-slate-200/80">
        <div className="flex justify-between border-b-2 border-slate-900 pb-2">
          <div className="space-y-1.5">
            <div className="h-3 w-28 rounded bg-slate-900" />
            <div className="h-1.5 w-20 rounded bg-slate-500" />
          </div>
          <div className="h-10 w-10 rounded bg-slate-300" />
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="h-1.5 w-full rounded bg-slate-300" />
          <div className="h-1.5 w-5/6 rounded bg-slate-300" />
        </div>
      </div>
    );
  }

  if (id === "creative") {
    return (
      <div className="h-36 overflow-hidden rounded-xl ring-1 ring-slate-200/80">
        <div className="flex items-center gap-2 bg-teal-700 px-3 py-3">
          <div className="h-8 w-8 rounded bg-white/30" />
          <div className="space-y-1">
            <div className="h-2 w-20 rounded bg-white/90" />
            <div className="h-1.5 w-14 rounded bg-teal-100/70" />
          </div>
        </div>
        <div className="space-y-1.5 bg-white p-3">
          <div className="h-1.5 w-full rounded bg-slate-300" />
          <div className="h-1.5 w-4/5 rounded bg-slate-300" />
        </div>
      </div>
    );
  }

  if (id === "two_column") {
    return (
      <div className="flex h-36 overflow-hidden rounded-xl ring-1 ring-slate-200/80">
        <div className="w-[34%] bg-slate-900 p-2">
          <div className="h-8 w-8 rounded bg-slate-600" />
          <div className="mt-2 h-1.5 w-full rounded bg-slate-500" />
          <div className="mt-3 h-1 w-full rounded bg-teal-500/50" />
          <div className="mt-1 h-1 w-4/5 rounded bg-slate-600" />
        </div>
        <div className="flex-1 space-y-1.5 bg-white p-3">
          <div className="h-1.5 w-full rounded bg-slate-300" />
          <div className="h-1.5 w-5/6 rounded bg-slate-300" />
          <div className="h-1.5 w-4/6 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (id === "timeline") {
    return (
      <div className="h-36 overflow-hidden rounded-xl bg-white p-3 ring-1 ring-slate-200/80">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-300" />
          <div className="h-2 w-20 rounded bg-slate-800" />
        </div>
        <div className="ml-2 space-y-2 border-l-2 border-teal-600 pl-3">
          <div className="h-1.5 w-full rounded bg-slate-300" />
          <div className="h-1.5 w-5/6 rounded bg-slate-300" />
          <div className="h-1.5 w-4/6 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-36 overflow-hidden rounded-xl bg-[#fafafa] p-4 ring-1 ring-slate-200/80">
      <div className="flex flex-col items-center">
        <div className="h-9 w-9 rounded-full bg-slate-300" />
        <div className="mt-2 h-2.5 w-24 rounded bg-slate-800" />
        <div className="mt-1 h-1.5 w-20 rounded bg-slate-400" />
      </div>
      <div className="mt-3 space-y-1.5 border-t border-slate-800/80 pt-2">
        <div className="h-1.5 w-full rounded bg-slate-300" />
        <div className="h-1.5 w-5/6 rounded bg-slate-300" />
      </div>
    </div>
  );
}
