"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function SaveAccountBanner() {
  const { user, status } = useAuth();

  if (status !== "ready" || user) return null;

  return (
    <div className="shrink-0 border-b border-[var(--line)] bg-white/90 px-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--ink-soft)] sm:text-[13px]">
          Guest draft —{" "}
          <span className="font-semibold text-[var(--ink)]">
            save an account
          </span>{" "}
          to keep this resume across devices.
        </p>
        <Link
          href="/signup?next=/builder"
          className="cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)]"
        >
          Save account
        </Link>
      </div>
    </div>
  );
}
