"use client";

import { C } from "@/lib/theme";

export function MoneyInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <span
        style={{
          position: "absolute",
          left: "0.875rem",
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "0.85rem",
          color: C.textLight,
          pointerEvents: "none",
        }}
      >
        R$
      </span>
      <input
        id={id}
        className="form-input"
        inputMode="decimal"
        placeholder={placeholder ?? "0,00"}
        style={{ paddingLeft: "2.5rem" }}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
      />
    </div>
  );
}
