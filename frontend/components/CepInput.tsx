"use client";

import { useState } from "react";

function maskCep(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
}

export type ResolvedAddress = { city: string; state: string; addressLine: string };

export function CepInput({
  id,
  name,
  value,
  onChange,
  onAddressFound,
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onAddressFound: (address: ResolvedAddress) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function lookup() {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        onAddressFound({
          city: data.localidade ?? "",
          state: data.uf ?? "",
          addressLine: data.logradouro ?? "",
        });
      }
    } catch {
      // Lookup is best-effort — the customer can fill city/state by hand.
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        name={name}
        className="form-input"
        inputMode="numeric"
        placeholder="00000-000"
        value={value}
        onChange={(e) => onChange(maskCep(e.target.value))}
        onBlur={lookup}
        required
      />
      {loading && (
        <span
          style={{
            position: "absolute",
            right: "0.875rem",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "0.7rem",
            color: "oklch(0.62 0.002 0)",
          }}
        >
          buscando…
        </span>
      )}
    </div>
  );
}
