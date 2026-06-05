export function OrderNumber({ value }: { value: number }) {
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>#{String(value).padStart(4, "0")}</span>
  );
}
