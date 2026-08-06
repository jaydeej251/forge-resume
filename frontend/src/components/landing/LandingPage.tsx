"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LandingSampleResume } from "@/components/landing/LandingSampleResume";
import { useAuth } from "@/context/AuthContext";
import { getResumeSession } from "@/lib/api";
import { SESSION_STORAGE_KEY, TEMPLATES } from "@/templates/registry";

export function LandingPage() {
  const router = useRouter();
  const { user, status } = useAuth();
  const [hasDraft, setHasDraft] = useState(false);

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

  const previewLooks = TEMPLATES.filter((t) =>
    ["classic", "modern", "creative", "two_column"].includes(t.id),
  );

  return (
    <div className="landing-shell min-h-dvh overflow-x-hidden">
      <section className="landing-hero relative min-h-dvh overflow-hidden">
        <div className="landing-hero-visual" aria-hidden />
        <div className="landing-hero-grain" aria-hidden />

        <div className="relative z-10 mx-auto grid min-h-dvh max-w-6xl grid-cols-1 px-5 pb-10 pt-8 sm:px-8 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,44%)] lg:items-stretch lg:gap-8 lg:pb-0">
          <div className="flex flex-col">
            <nav className="landing-reveal landing-reveal-1 flex items-center justify-between gap-4">
              <p className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Forge Resume
              </p>
              <div className="flex items-center gap-2">
                {status === "ready" && user ? (
                  <>
                    {user.is_admin && (
                      <Link
                        href="/admin"
                        className="cursor-pointer rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/18"
                      >
                        Admin
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      className="cursor-pointer rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/18"
                    >
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="cursor-pointer px-2 py-1.5 text-sm font-semibold text-white/85 transition hover:text-white"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="cursor-pointer rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/18"
                    >
                      Sign up
                    </Link>
                  </>
                )}
                <Link
                  href="/templates"
                  className="cursor-pointer rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/18"
                >
                  Templates
                </Link>
              </div>
            </nav>

            <div className="mt-auto max-w-xl pb-6 pt-20 sm:pb-14 sm:pt-24 lg:pb-20">
              <h1 className="landing-reveal landing-reveal-2 font-display text-[2.35rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
                Draft a strong resume in minutes, not hours.
              </h1>
              <p className="landing-reveal landing-reveal-3 mt-4 max-w-md text-base leading-relaxed text-slate-300 sm:text-lg">
                Chat with an AI coach, edit the live canvas, and export a clean PDF
                that matches your template.
              </p>
              <div className="landing-reveal landing-reveal-4 mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/templates"
                  className="landing-cta-primary cursor-pointer rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-950/40 transition hover:brightness-110 active:scale-[0.98]"
                >
                  Build my resume
                </Link>
                {user ? (
                  <Link
                    href="/dashboard"
                    className="cursor-pointer rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-[0.98]"
                  >
                    My resumes
                  </Link>
                ) : hasDraft ? (
                  <button
                    type="button"
                    onClick={() => router.push("/builder")}
                    className="cursor-pointer rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-[0.98]"
                  >
                    Continue draft
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div
            className="landing-hero-resume pointer-events-none relative flex items-end justify-center pb-6 pt-2 lg:items-center lg:pb-10 lg:pt-16"
            aria-hidden
          >
            <div className="landing-hero-resume-stage">
              <LandingSampleResume />
            </div>
          </div>
        </div>
      </section>

      <section className="landing-how border-t border-[var(--line)] px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Process
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
              How it works
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)] sm:text-base">
              Three focused steps — from conversation to a finish-ready PDF.
            </p>
          </div>

          <ol className="landing-how-grid mt-12">
            {[
              {
                step: "01",
                title: "Chat to draft",
                body: "Share basics and roles. The coach expands rough notes into clear, strong bullets.",
                mark: (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-5 w-5">
                    <path
                      d="M5 6.5h14M5 12h10M5 17.5h12"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Edit the canvas",
                body: "Hover any field on the live A4 preview. Switch templates anytime without losing content.",
                mark: (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-5 w-5">
                    <path
                      d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 17 19.5H7A1.5 1.5 0 0 1 5.5 18V6A1.5 1.5 0 0 1 7 4.5Z"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    />
                    <path
                      d="M8.5 9h7M8.5 12.5h5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Download PDF",
                body: "Export a print-ready file that matches what you see — layout, type, and spacing included.",
                mark: (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-5 w-5">
                    <path
                      d="M12 5v10m0 0 3.5-3.5M12 15l-3.5-3.5M6 19h12"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
              },
            ].map((item, index) => (
              <li key={item.step} className="landing-how-step">
                <div className="landing-how-rail" aria-hidden>
                  <span className="landing-how-icon">{item.mark}</span>
                  {index < 2 && <span className="landing-how-connector" />}
                </div>
                <div className="landing-how-copy">
                  <p className="landing-how-index">{item.step}</p>
                  <h3 className="landing-how-title">{item.title}</h3>
                  <p className="landing-how-body">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing-templates border-t border-[var(--line)] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
                Templates that look finished
              </h2>
              <p className="mt-2 max-w-lg text-sm text-[var(--muted)] sm:text-base">
                Classic to creative — switch styles anytime without losing content.
              </p>
            </div>
            <Link
              href="/templates"
              className="landing-text-link cursor-pointer text-sm font-semibold text-[var(--accent)]"
            >
              See all templates →
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {previewLooks.map((template) => (
              <Link
                key={template.id}
                href="/templates"
                className="landing-template-card group block cursor-pointer overflow-hidden rounded-xl border border-[var(--line)] bg-white transition hover:-translate-y-0.5 hover:border-teal-700/35 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
              >
                <LandingTemplateThumb id={template.id} />
                <div className="px-3 py-2.5">
                  <p className="text-sm font-semibold text-[var(--ink)] transition group-hover:text-[var(--accent)]">
                    {template.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                    {template.badge}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta border-t border-[var(--line)] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
            Start with a blank page. Leave with a resume.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--muted)] sm:text-base">
            Pick a look, talk through your experience, and export when it feels right.
          </p>
          <Link
            href="/templates"
            className="mt-8 inline-flex cursor-pointer rounded-xl bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--ink-soft)] active:scale-[0.98]"
          >
            Build my resume
          </Link>
        </div>
      </section>
    </div>
  );
}

function LandingTemplateThumb({ id }: { id: string }) {
  if (id === "modern") {
    return (
      <div className="relative h-40 bg-slate-50">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-teal-700" />
        <div className="space-y-2 p-4 pl-5">
          <div className="h-2.5 w-24 rounded-sm bg-slate-800/85" />
          <div className="h-1.5 w-20 rounded-sm bg-teal-700/55" />
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-full rounded-sm bg-slate-300/90" />
            <div className="h-1.5 w-[92%] rounded-sm bg-slate-300/90" />
            <div className="h-1.5 w-[78%] rounded-sm bg-slate-300/90" />
          </div>
          <div className="mt-3 h-1 w-14 rounded-sm bg-slate-400/70" />
          <div className="h-1.5 w-full rounded-sm bg-slate-300/80" />
          <div className="h-1.5 w-4/5 rounded-sm bg-slate-300/80" />
        </div>
      </div>
    );
  }
  if (id === "creative") {
    return (
      <div className="h-40 overflow-hidden bg-white">
        <div className="h-16 bg-teal-700 px-3 py-3">
          <div className="h-2.5 w-24 rounded-sm bg-white/95" />
          <div className="mt-1.5 h-1.5 w-16 rounded-sm bg-teal-100/75" />
          <div className="mt-2 flex gap-1">
            <div className="h-1 w-10 rounded-sm bg-white/40" />
            <div className="h-1 w-8 rounded-sm bg-white/40" />
          </div>
        </div>
        <div className="space-y-1.5 p-3">
          <div className="h-1.5 w-full rounded-sm bg-slate-300" />
          <div className="h-1.5 w-[88%] rounded-sm bg-slate-300" />
          <div className="h-1.5 w-[72%] rounded-sm bg-slate-300" />
        </div>
      </div>
    );
  }
  if (id === "two_column") {
    return (
      <div className="flex h-40">
        <div className="w-[34%] space-y-2 bg-slate-900 p-2.5">
          <div className="mx-auto h-8 w-8 rounded-full bg-slate-600" />
          <div className="h-1.5 w-full rounded-sm bg-slate-500" />
          <div className="h-1.5 w-4/5 rounded-sm bg-slate-600" />
          <div className="mt-3 h-1 w-10 rounded-sm bg-teal-500/70" />
          <div className="h-1.5 w-full rounded-sm bg-slate-600" />
          <div className="h-1.5 w-3/4 rounded-sm bg-slate-600" />
        </div>
        <div className="flex-1 space-y-1.5 bg-white p-3">
          <div className="h-1.5 w-16 rounded-sm bg-slate-800/70" />
          <div className="h-1.5 w-full rounded-sm bg-slate-300" />
          <div className="h-1.5 w-5/6 rounded-sm bg-slate-300" />
          <div className="mt-2 h-1.5 w-14 rounded-sm bg-slate-800/60" />
          <div className="h-1.5 w-full rounded-sm bg-slate-300" />
          <div className="h-1.5 w-4/5 rounded-sm bg-slate-300" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-40 flex-col items-center bg-[#f7f8fa] px-4 pt-5">
      <div className="h-9 w-9 rounded-full bg-slate-300" />
      <div className="mt-2 h-2 w-28 rounded-sm bg-slate-800" />
      <div className="mt-1 h-1.5 w-20 rounded-sm bg-slate-400/80" />
      <div className="mt-4 w-full space-y-1.5">
        <div className="h-1.5 w-full rounded-sm bg-slate-300" />
        <div className="h-1.5 w-4/5 rounded-sm bg-slate-300" />
        <div className="h-1.5 w-[90%] rounded-sm bg-slate-300" />
      </div>
    </div>
  );
}
