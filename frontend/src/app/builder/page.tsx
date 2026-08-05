"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BuilderShell } from "@/components/layout/BuilderShell";
import { useResume } from "@/context/ResumeContext";
import { SESSION_STORAGE_KEY } from "@/templates/registry";

export default function BuilderPage() {
  const router = useRouter();
  const { status, error } = useResume();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(SESSION_STORAGE_KEY)) {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    if (status === "error" && error?.includes("start")) {
      router.replace("/");
    }
  }, [status, error, router]);

  return <BuilderShell />;
}
