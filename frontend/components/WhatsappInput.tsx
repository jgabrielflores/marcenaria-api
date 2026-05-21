"use client";

function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function WhatsappInput({
  id,
  name,
  value,
  onChange,
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      id={id}
      name={name}
      className="form-input"
      type="tel"
      inputMode="tel"
      placeholder="(11) 99999-9999"
      value={value}
      onChange={(e) => onChange(maskPhone(e.target.value))}
      required
    />
  );
}
