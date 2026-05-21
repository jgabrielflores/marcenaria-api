import type { OrderStatus } from "@/lib/api";
import { C, formatDate } from "@/lib/theme";

const TERMINAL: OrderStatus[] = ["CONCLUIDO", "CANCELADO"];

/** An order is overdue when its delivery date has passed and it is still active. */
export function isOverdue(dueDate: string | null, status: OrderStatus): boolean {
  if (!dueDate || TERMINAL.includes(status)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parsed = dueDate.length === 10 ? `${dueDate}T00:00:00` : dueDate;
  return new Date(parsed) < today;
}

export function DueDate({
  dueDate,
  status,
}: {
  dueDate: string | null;
  status: OrderStatus;
}) {
  if (!dueDate) return <span>—</span>;
  if (!isOverdue(dueDate, status)) return <span>{formatDate(dueDate)}</span>;
  return (
    <span style={{ color: C.danger, fontWeight: 600 }}>
      {formatDate(dueDate)} · Atrasado
    </span>
  );
}
