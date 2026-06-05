import type { OrderHistoryEntry } from "@/lib/api";
import { STATUS_LABELS } from "@/components/StatusBadge";
import { C } from "@/lib/theme";

function formatStamp(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function StatusTimeline({ history }: { history: OrderHistoryEntry[] }) {
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {history.map((entry, i) => {
        const last = i === history.length - 1;
        return (
          <li key={entry.id} style={{ display: "flex", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span
                style={{
                  width: "0.65rem",
                  height: "0.65rem",
                  borderRadius: "50%",
                  background: last ? C.ink : C.bg,
                  border: `2px solid ${C.ink}`,
                  marginTop: "0.3rem",
                  flexShrink: 0,
                }}
              />
              {!last && (
                <span
                  style={{ width: "1px", flex: 1, background: C.border, minHeight: "1.5rem" }}
                />
              )}
            </div>
            <div style={{ paddingBottom: last ? 0 : "1.5rem" }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: C.text }}>
                {STATUS_LABELS[entry.to_status]}
              </p>
              {entry.note && (
                <p style={{ fontSize: "0.8rem", color: C.textSub, marginTop: "0.15rem" }}>
                  {entry.note}
                </p>
              )}
              <p style={{ fontSize: "0.72rem", color: C.textLight, marginTop: "0.25rem" }}>
                {formatStamp(entry.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
