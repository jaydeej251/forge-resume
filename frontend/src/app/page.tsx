import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Forge Resume — AI Resume Builder",
  description:
    "Draft a strong resume in minutes. Chat with an AI coach, edit a live canvas, and download a clean PDF.",
};

export default function HomePage() {
  return <LandingPage />;
}
