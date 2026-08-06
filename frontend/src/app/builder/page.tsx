"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BuilderShell } from "@/components/layout/BuilderShell";
import { SESSION_STORAGE_KEY } from "@/templates/registry";

export default function BuilderPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(SESSION_STORAGE_KEY)) {
      router.replace("/templates");
    }
  }, [router]);

  return <BuilderShell />;
}
