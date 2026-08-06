"use client";

import { useRef, useState } from "react";
import { useResume } from "@/context/ResumeContext";
import { humanizeError } from "@/lib/errors";

type PhotoSlotProps = {
  variant?: "circle" | "rounded";
  className?: string;
};

export function PhotoSlot({
  variant = "circle",
  className = "",
}: PhotoSlotProps) {
  const { photoUrl, uploadPhoto, removePhoto } = useResume();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shape = variant === "circle" ? "rounded-full" : "rounded-lg";

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await uploadPhoto(file);
    } catch (err) {
      setError(humanizeError(err, "Upload failed"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onRemove = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await removePhoto();
    } catch (err) {
      setError(humanizeError(err, "Remove failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`group/photo relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={[
          "relative flex h-20 w-20 items-center justify-center overflow-hidden border border-dashed border-slate-300 bg-slate-50 text-[10px] font-semibold text-slate-500 transition",
          "hover:border-teal-600/50 hover:bg-teal-50/40 hover:text-teal-800",
          shape,
          busy ? "opacity-60" : "",
        ].join(" ")}
        aria-label={photoUrl ? "Change photo" : "Add photo"}
      >
        {photoUrl ? (
          // ActiveStorage blob URL from the Rails API
          <img
            src={photoUrl}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="px-2 text-center leading-tight">
            {busy ? "Uploading…" : "Add photo"}
          </span>
        )}
      </button>

      {photoUrl && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void onRemove()}
          className="absolute -right-1 -top-1 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-red-600 ring-1 ring-red-200 disabled:opacity-50"
        >
          Remove
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void onPick(event.target.files?.[0])}
      />
      {error && (
        <p className="mt-1 max-w-[8rem] text-[9px] text-red-600">{error}</p>
      )}
    </div>
  );
}
