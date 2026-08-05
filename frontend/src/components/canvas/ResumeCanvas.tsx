"use client";

import { ClassicCanvas } from "@/components/canvas/ClassicCanvas";
import { CompactCanvas } from "@/components/canvas/CompactCanvas";
import { CreativeCanvas } from "@/components/canvas/CreativeCanvas";
import { ExecutiveCanvas } from "@/components/canvas/ExecutiveCanvas";
import { MinimalCanvas } from "@/components/canvas/MinimalCanvas";
import { ModernCanvas } from "@/components/canvas/ModernCanvas";
import { TimelineCanvas } from "@/components/canvas/TimelineCanvas";
import { TwoColumnCanvas } from "@/components/canvas/TwoColumnCanvas";
import { useResume } from "@/context/ResumeContext";

export function ResumeCanvas() {
  const { template } = useResume();

  switch (template) {
    case "modern":
      return <ModernCanvas />;
    case "compact":
      return <CompactCanvas />;
    case "executive":
      return <ExecutiveCanvas />;
    case "creative":
      return <CreativeCanvas />;
    case "two_column":
      return <TwoColumnCanvas />;
    case "minimal":
      return <MinimalCanvas />;
    case "timeline":
      return <TimelineCanvas />;
    case "classic":
    default:
      return <ClassicCanvas />;
  }
}
