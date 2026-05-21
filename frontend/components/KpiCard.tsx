import { C } from "@/lib/theme";

export function KpiCard({
  label,
  value,
  hint,
  accent = false,
  filled = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
  filled?: boolean;
}) {
  const valueColor = filled ? C.inkFg : accent ? C.danger : C.text;
  const labelColor = filled ? "oklch(1 0 0 / 0.62)" : C.textLight;
  const hintColor = filled ? "oklch(1 0 0 / 0.55)" : C.textLight;

  return (
    <div
      style={{
        border: filled ? "none" : `1px solid ${C.border}`,
        background: filled ? C.ink : C.bg,
        borderRadius: "3px",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.7rem",
      }}
    >
      <span
        style={{
          fontSize: "0.62rem",
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: labelColor,
        }}
      >
        {label}
      </span>
      <span
        className="font-heading"
        style={{ fontSize: "2.4rem", fontWeight: 500, lineHeight: 1, color: valueColor }}
      >
        {value}
      </span>
      {hint && <span style={{ fontSize: "0.72rem", color: hintColor }}>{hint}</span>}
    </div>
  );
}
