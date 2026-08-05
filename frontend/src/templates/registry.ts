export const TEMPLATE_IDS = [
  "classic",
  "modern",
  "compact",
  "executive",
  "creative",
  "two_column",
  "minimal",
  "timeline",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  blurb: string;
  supportsPhoto: boolean;
  badge: string;
};

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "classic",
    name: "Classic",
    blurb: "Centered serif header with clean section rules — timeless and interview-ready.",
    supportsPhoto: true,
    badge: "Photo optional",
  },
  {
    id: "modern",
    name: "Modern",
    blurb: "Left-aligned hierarchy with a teal accent — contemporary product-style layout.",
    supportsPhoto: true,
    badge: "Photo optional",
  },
  {
    id: "compact",
    name: "Compact",
    blurb: "Dense single-column layout optimized for ATS parsers and tight one-pagers.",
    supportsPhoto: false,
    badge: "ATS-safe · no photo",
  },
  {
    id: "executive",
    name: "Executive",
    blurb: "Wide serif presence with generous spacing — senior and leadership roles.",
    supportsPhoto: true,
    badge: "Photo optional",
  },
  {
    id: "creative",
    name: "Creative",
    blurb: "Bold color header band — stands out for design and marketing profiles.",
    supportsPhoto: true,
    badge: "Photo optional",
  },
  {
    id: "two_column",
    name: "Two-column",
    blurb: "Skills sidebar beside the main story — clear scannable structure.",
    supportsPhoto: true,
    badge: "Photo optional",
  },
  {
    id: "minimal",
    name: "Minimal",
    blurb: "Monochrome hairlines and quiet type — refined and ATS-friendly.",
    supportsPhoto: false,
    badge: "ATS-safe · no photo",
  },
  {
    id: "timeline",
    name: "Timeline",
    blurb: "Vertical experience track — great when career progression is the story.",
    supportsPhoto: true,
    badge: "Photo optional",
  },
];

export function isTemplateId(value: string | null | undefined): value is TemplateId {
  return TEMPLATE_IDS.includes(value as TemplateId);
}

export function templateLabel(id: TemplateId): string {
  return TEMPLATES.find((item) => item.id === id)?.name ?? id;
}

export function templateSupportsPhoto(id: TemplateId): boolean {
  return TEMPLATES.find((item) => item.id === id)?.supportsPhoto ?? false;
}

export const SESSION_STORAGE_KEY = "resume_builder_session_id";
