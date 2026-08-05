"use client";

export type MobilePane = "chat" | "preview";

type MobilePaneTabsProps = {
  active: MobilePane;
  onChange: (pane: MobilePane) => void;
};

const TABS: { id: MobilePane; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "preview", label: "Preview" },
];

export function MobilePaneTabs({ active, onChange }: MobilePaneTabsProps) {
  return (
    <div className="shrink-0 border-b border-[var(--line)]/80 bg-[var(--panel-elevated)] px-3 py-2 lg:hidden">
      <div
        role="tablist"
        aria-label="Workspace"
        className="mobile-tabs grid grid-cols-2 gap-1 rounded-xl bg-slate-100/90 p-1"
      >
        {TABS.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={[
                "rounded-lg px-3 py-2 text-sm font-semibold transition",
                selected
                  ? "bg-white text-[var(--ink)] shadow-sm shadow-slate-900/8"
                  : "text-[var(--muted)] hover:text-[var(--ink-soft)]",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
