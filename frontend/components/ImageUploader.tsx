"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { C, labelStyle } from "@/lib/theme";

export const MAX_ORDER_IMAGES = 5;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — mirrors the backend limit
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/** Local file picker with thumbnail previews and client-side validation.
 * Selection only — the parent decides when to upload. `maxFiles` is how many
 * more images may be added (5 minus the count already attached to the order). */
export function ImageUploader({
  files,
  onChange,
  maxFiles = MAX_ORDER_IMAGES,
  disabled = false,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}) {
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive preview URLs from the selected files and revoke them on change/unmount.
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  function addFiles(selected: FileList | null) {
    if (!selected) return;
    setError("");
    const valid: File[] = [];
    for (const file of Array.from(selected)) {
      if (!ACCEPTED.includes(file.type)) {
        setError("Apenas imagens JPEG, PNG ou WebP são aceitas.");
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError("Cada imagem deve ter no máximo 5 MB.");
        continue;
      }
      valid.push(file);
    }
    const combined = [...files, ...valid];
    if (combined.length > maxFiles) {
      setError(`Máximo de ${maxFiles} ${maxFiles === 1 ? "imagem" : "imagens"}.`);
      onChange(combined.slice(0, maxFiles));
    } else {
      onChange(combined);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    setError("");
    onChange(files.filter((_, i) => i !== index));
  }

  const atLimit = files.length >= maxFiles;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        hidden
        disabled={disabled}
        onChange={(e) => addFiles(e.target.files)}
      />

      {files.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              style={{
                position: "relative",
                aspectRatio: "1",
                borderRadius: "2px",
                overflow: "hidden",
                border: `1px solid ${C.border}`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previews[i]}
                alt={file.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                type="button"
                aria-label="Remover imagem"
                onClick={() => removeAt(i)}
                disabled={disabled}
                style={{
                  position: "absolute",
                  top: "0.25rem",
                  right: "0.25rem",
                  width: "1.5rem",
                  height: "1.5rem",
                  borderRadius: "50%",
                  border: "none",
                  background: "oklch(0 0 0 / 0.6)",
                  color: "oklch(1 0 0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || atLimit}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          alignSelf: "flex-start",
          padding: "0.7rem 1.1rem",
          background: C.bg,
          color: atLimit ? C.textLight : C.text,
          border: `1px dashed ${C.border}`,
          borderRadius: "2px",
          fontSize: "0.78rem",
          letterSpacing: "0.04em",
          cursor: disabled || atLimit ? "default" : "pointer",
        }}
      >
        <ImagePlus size={15} />
        {atLimit ? "Limite atingido" : "Adicionar fotos"}
      </button>

      <span style={{ ...labelStyle, color: C.textLight }}>
        {files.length}/{maxFiles} · JPEG, PNG ou WebP · até 5 MB cada
      </span>

      {error && (
        <p style={{ fontSize: "0.78rem", color: C.danger }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
