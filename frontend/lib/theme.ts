import type { CSSProperties } from "react";

/** Portal white-premium palette — shared by every /conta and /admin screen. */
export const C = {
  bg: "oklch(1.000 0.000 0)",
  surface: "oklch(0.985 0.000 0)",
  text: "oklch(0.10 0.006 0)",
  textSub: "oklch(0.40 0.004 0)",
  textLight: "oklch(0.62 0.002 0)",
  ink: "oklch(0.12 0.006 0)",
  inkFg: "oklch(1.000 0.000 0)",
  border: "oklch(0.88 0.003 0)",
  danger: "oklch(0.577 0.245 27.325)",
} as const;

export const labelStyle: CSSProperties = {
  fontSize: "0.63rem",
  textTransform: "uppercase",
  letterSpacing: "0.28em",
  color: C.textSub,
  display: "block",
};

export const inkButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.45rem",
  padding: "0.82rem 2rem",
  background: C.ink,
  color: C.inkFg,
  fontSize: "0.78rem",
  fontWeight: 500,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  borderRadius: "2px",
  border: "none",
  cursor: "pointer",
  textDecoration: "none",
};

export const headingStyle: CSSProperties = {
  fontSize: "clamp(2rem, 4.5vw, 2.75rem)",
  fontWeight: 500,
  lineHeight: 1.1,
  letterSpacing: "-0.02em",
  color: C.text,
};

export function formatMoney(value: string | null): string {
  if (value === null) return "—";
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value;
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  // Date-only strings (YYYY-MM-DD) must parse as local time to avoid a
  // timezone shift to the previous day.
  const parsed = value.length === 10 ? `${value}T00:00:00` : value;
  return new Date(parsed).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
