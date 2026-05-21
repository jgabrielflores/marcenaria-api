"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderNumber } from "@/components/OrderNumber";
import { getDashboard, type DashboardSummary, type OrderStatus } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { C, labelStyle, headingStyle, formatMoney, formatDate } from "@/lib/theme";

const PIPELINE: OrderStatus[] = [
  "AGUARDANDO_ANALISE",
  "EM_ORCAMENTO",
  "APROVADO",
  "EM_PRODUCAO",
  "INSTALACAO_AGENDADA",
  "CONCLUIDO",
  "CANCELADO",
];

const TODAY = new Date();

function toMonthValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span style={{ ...labelStyle, color: C.text, fontWeight: 700 }}>{children}</span>;
}

function panelStyle(): React.CSSProperties {
  return { border: `1px solid ${C.border}`, borderRadius: "3px", padding: "1.5rem" };
}

export default function AdminDashboardPage() {
  const [selectedYear, setSelectedYear] = useState(TODAY.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(TODAY.getMonth() + 1);
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    setData(null);
    setError("");
    getDashboard(token, { year: selectedYear, month: selectedMonth })
      .then(setData)
      .catch(() => setError("Não foi possível carregar o dashboard."));
  }, [selectedYear, selectedMonth]);

  const margin =
    data && Number(data.revenue_month) > 0
      ? Math.round((Number(data.profit_month) / Number(data.revenue_month)) * 100)
      : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "2rem" }}>
        <span style={{ ...labelStyle, marginBottom: "0.75rem" }}>Visão geral</span>
        <h1 className="font-heading" style={headingStyle}>
          Dashboard
        </h1>
      </div>

      {error && (
        <p style={{ fontSize: "0.82rem", color: C.danger }} role="alert">
          {error}
        </p>
      )}

      {!data && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{ height: "8rem", background: "oklch(0.96 0.000 0)", borderRadius: "3px" }}
              />
            ))}
          </div>
          <div
            className="animate-pulse"
            style={{ height: "20rem", background: "oklch(0.96 0.000 0)", borderRadius: "3px" }}
          />
        </div>
      )}

      {data && (
        <>
          {/* ── Resumo financeiro ─────────────────────────────────── */}
          <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <SectionLabel>Resumo financeiro</SectionLabel>
              <input
                type="month"
                value={toMonthValue(selectedYear, selectedMonth)}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const [y, m] = e.target.value.split("-").map(Number);
                  setSelectedYear(y);
                  setSelectedMonth(m);
                }}
                style={{
                  height: "2.25rem",
                  padding: "0 0.75rem",
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: "2px",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.78rem",
                  color: C.textSub,
                  outline: "none",
                  cursor: "pointer",
                  transition: "border-color 0.18s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = C.ink)}
                onBlur={(e) => (e.target.style.borderColor = C.border)}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1.25rem",
              }}
            >
              <KpiCard
                label="Faturamento"
                value={formatMoney(data.revenue_month)}
                hint="Pedidos concluídos no mês"
              />
              <KpiCard
                label="Custo"
                value={formatMoney(data.cost_month)}
                hint="Materiais e produção"
              />
              <KpiCard
                label="Lucro"
                value={formatMoney(data.profit_month)}
                hint={margin === null ? "Sem faturamento no mês" : `Margem de ${margin}%`}
                filled
              />
            </div>
          </section>

          {/* ── Alerta de atrasos ─────────────────────────────────── */}
          {data.overdue_count > 0 && (
            <Link
              href="/admin/pedidos"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                border: "1px solid oklch(0.577 0.245 27.325 / 0.35)",
                background: "oklch(0.577 0.245 27.325 / 0.06)",
                borderRadius: "3px",
                padding: "0.85rem 1.1rem",
                textDecoration: "none",
                color: C.danger,
                fontSize: "0.85rem",
              }}
            >
              <AlertTriangle size={16} />
              <span>
                {data.overdue_count}{" "}
                {data.overdue_count === 1
                  ? "pedido com entrega atrasada"
                  : "pedidos com entrega atrasada"}
              </span>
              <ArrowRight size={14} style={{ marginLeft: "auto" }} />
            </Link>
          )}

          {/* ── Operação ──────────────────────────────────────────── */}
          <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <SectionLabel>Operação</SectionLabel>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
                gap: "1.5rem",
                alignItems: "start",
              }}
            >
              {/* Pipeline */}
              <div style={panelStyle()}>
                <span style={{ ...labelStyle, marginBottom: "0.75rem", display: "block" }}>
                  Pedidos por status
                </span>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {PIPELINE.map((status, i) => (
                    <li
                      key={status}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.7rem 0",
                        borderTop: i === 0 ? "none" : `1px solid ${C.border}`,
                      }}
                    >
                      <StatusBadge status={status} />
                      <span
                        className="font-heading"
                        style={{ fontSize: "1.3rem", fontWeight: 500, color: C.text }}
                      >
                        {data.counts_by_status[status]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recent orders */}
              <div style={panelStyle()}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span style={labelStyle}>Pedidos recentes</span>
                  <Link
                    href="/admin/pedidos"
                    className="landing-link-cta"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.72rem",
                      color: C.textSub,
                      textDecoration: "none",
                    }}
                  >
                    Ver todos <ArrowRight size={12} />
                  </Link>
                </div>

                {data.recent_orders.length === 0 ? (
                  <p style={{ fontSize: "0.875rem", color: C.textLight, padding: "1rem 0" }}>
                    Nenhum pedido ainda.
                  </p>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {data.recent_orders.map((order, i) => (
                      <li
                        key={order.id}
                        style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}
                      >
                        <Link
                          href={`/admin/pedidos/${order.id}`}
                          className="row-link"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "1rem",
                            padding: "0.7rem 0.25rem",
                            textDecoration: "none",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontSize: "0.72rem", color: C.textLight }}>
                              <OrderNumber value={order.order_number} /> ·{" "}
                              {order.customer_name ?? "—"}
                            </span>
                            <span
                              style={{
                                display: "block",
                                fontSize: "0.875rem",
                                color: C.text,
                                marginTop: "0.1rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {order.environments}
                            </span>
                            <span style={{ fontSize: "0.7rem", color: C.textLight }}>
                              {formatDate(order.created_at)}
                            </span>
                          </div>
                          <StatusBadge status={order.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
