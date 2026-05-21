"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { X } from "lucide-react";

export function Lightbox({
  src,
  alt,
  style,
  children,
}: {
  src: string;
  alt: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)} style={{ ...style, cursor: "zoom-in" }}>
        {children}
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            background: "oklch(0 0 0 / 0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            aria-label="Fechar"
            style={{
              position: "absolute",
              top: "1.25rem",
              right: "1.25rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "oklch(1 0 0)",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={28} />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "92vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: "2px",
              boxShadow: "0 8px 40px oklch(0 0 0 / 0.5)",
            }}
          />
        </div>
      )}
    </>
  );
}
