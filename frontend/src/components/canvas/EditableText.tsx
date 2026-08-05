"use client";

import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type KeyboardEvent,
} from "react";

type EditableTextProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  as?: ElementType;
};

export function EditableText({
  value,
  onChange,
  placeholder = "Click to edit",
  className = "",
  multiline = false,
  as: Tag = "span",
}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!ref.current || editing) return;
    const next = value || "";
    if (ref.current.textContent !== next) {
      ref.current.textContent = next;
    }
  }, [value, editing]);

  const commit = () => {
    const next = (ref.current?.textContent ?? "").replace(/\u00a0/g, " ").trimEnd();
    onChange(next);
    setEditing(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!multiline && event.key === "Enter") {
      event.preventDefault();
      ref.current?.blur();
    }
    if (event.key === "Escape") {
      if (ref.current) ref.current.textContent = value;
      setEditing(false);
      ref.current?.blur();
    }
  };

  const showPlaceholder = !value && !editing;

  return (
    <Tag
      ref={ref}
      role="textbox"
      tabIndex={0}
      contentEditable
      suppressContentEditableWarning
      aria-label={placeholder}
      data-placeholder={placeholder}
      onFocus={() => setEditing(true)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      className={[
        "editable-field rounded-sm outline-none transition-shadow",
        "hover:bg-teal-50/90 hover:ring-1 hover:ring-teal-700/20",
        "focus:bg-teal-50/40 focus:ring-2 focus:ring-[var(--accent)]/35",
        showPlaceholder ? "editable-empty" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
