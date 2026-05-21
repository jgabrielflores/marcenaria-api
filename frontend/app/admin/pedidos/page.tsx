"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge, STATUS_LABELS } from "@/components/StatusBadge";
import { OrderNumber } from "@/components/OrderNumber";
import { DueDate } from "@/components/DueDate";
import { ArrowRight } from "lucide-react";
import { listOrders, type OrderStatus, type PaginatedOrders } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  C,
  labelStyle,
  headingStyle,
  inkButtonStyle,
  formatDate,
  formatMoney,
  formatPhone,
} from "@/lib/theme";

type Filter = OrderStatus | "ALL";

const ALL_STATUSES: OrderStatus[] = [
  "AGUARDANDO_ANALISE",
  "EM_ORCAMENTO",
  "APROVADO",
  "EM_PRODUCAO",
  "INSTALACAO_AGENDADA",
  "CONCLUIDO",
  "CANCELADO",
];

const TH: React.CSSProperties = {
  padding: "0.625rem 0.75rem",
  textAlign: "left",
  fontSize: "0.6rem",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  color: C.textSub,
  whiteSpace: "nowrap",
};

const TD: React.CSSProperties = { padding: "0.875rem 0.75rem", verticalAlign: "top" };

export default function AdminPedidosPage() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedOrders | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    setData(null);
    setError("");
    listOrders(token, {
      page,
      limit: 20,
      status: filter === "ALL" ? undefined : filter,
    })
      .then(setData)
      .catch(() => setError("Não foi possível carregar os pedidos."));
  }, [filter, page]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "1.5rem",
          borderBottom: `1px solid ${C.border}`,
          paddingBottom: "2rem",
        }}
      >
        <div>
          <span style={{ ...labelStyle, marginBottom: "0.75rem" }}>Gestão</span>
          <h1 className="font-heading" style={headingStyle}>
            Pedidos
          </h1>
        </div>
        <Link
          href="/admin/pedidos/novo"
          className="btn-ink"
          style={{ ...inkButtonStyle, padding: "0.7rem 1.5rem", fontSize: "0.72rem", whiteSpace: "nowrap" }}
        >
          Novo pedido <ArrowRight size={12} />
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <label htmlFor="status-filter" style={labelStyle}>
          Status
        </label>
        <select
          id="status-filter"
          className="form-input"
          style={{ width: "auto", minWidth: "16rem" }}
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as Filter);
            setPage(1);
          }}
        >
          <option value="ALL">Todos os status</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p style={{ fontSize: "0.82rem", color: C.danger }} role="alert">
          {error}
        </p>
      )}

      {!data && !error && (
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: "3.5rem",
                background: "oklch(0.96 0.000 0)",
                borderBottom: `1px solid ${C.border}`,
              }}
            />
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div
          style={{
            borderTop: `1px solid ${C.border}`,
            borderBottom: `1px solid ${C.border}`,
            padding: "4rem 2rem",
            textAlign: "center",
          }}
        >
          <p
            className="font-heading"
            style={{ fontSize: "1.5rem", fontStyle: "italic", color: C.textSub }}
          >
            Nenhum pedido encontrado
          </p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={TH}>Pedido</th>
                  <th style={TH}>Cliente</th>
                  <th style={TH}>Ambientes</th>
                  <th style={TH}>Data</th>
                  <th style={TH}>Status</th>
                  <th style={TH}>Instalação</th>
                  <th style={TH}>Previsão</th>
                  <th style={TH}>Valor</th>
                  <th style={{ ...TH, textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((order, i) => (
                  <tr
                    key={order.id}
                    className="animate-fade-up"
                    style={{ borderBottom: `1px solid ${C.border}`, animationDelay: `${i * 40}ms` }}
                  >
                    <td style={{ ...TD, fontWeight: 500, color: C.text }}>
                      <OrderNumber value={order.order_number} />
                    </td>
                    <td style={{ ...TD, color: C.text }}>
                      {order.customer_name ?? "—"}
                      <div style={{ fontSize: "0.75rem", color: C.textLight }}>
                        {formatPhone(order.whatsapp)}
                      </div>
                    </td>
                    <td style={{ ...TD, color: C.textSub }}>{order.environments}</td>
                    <td style={{ ...TD, color: C.textSub, whiteSpace: "nowrap" }}>
                      {formatDate(order.created_at)}
                    </td>
                    <td style={TD}>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={{ ...TD, color: C.textSub, whiteSpace: "nowrap" }}>
                      {formatDate(order.install_date)}
                    </td>
                    <td style={{ ...TD, color: C.textSub, whiteSpace: "nowrap" }}>
                      <DueDate dueDate={order.due_date} status={order.status} />
                    </td>
                    <td style={{ ...TD, color: C.text, whiteSpace: "nowrap" }}>
                      {formatMoney(order.project_value)}
                    </td>
                    <td style={{ ...TD, textAlign: "right" }}>
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="btn-outline-c"
                        style={{
                          display: "inline-block",
                          padding: "0.3rem 0.9rem",
                          background: C.bg,
                          color: C.textSub,
                          border: `1px solid ${C.border}`,
                          fontSize: "0.68rem",
                          fontWeight: 500,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          borderRadius: "2px",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.pages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem",
              }}
            >
              <button
                className="btn-outline-c"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                style={{
                  padding: "0.55rem 1.1rem",
                  background: C.bg,
                  color: C.textSub,
                  border: `1px solid ${C.border}`,
                  fontSize: "0.72rem",
                  borderRadius: "2px",
                  cursor: "pointer",
                }}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: "0.8rem", color: C.textLight }}>
                {page} de {data.pages}
              </span>
              <button
                className="btn-outline-c"
                disabled={page === data.pages}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: "0.55rem 1.1rem",
                  background: C.bg,
                  color: C.textSub,
                  border: `1px solid ${C.border}`,
                  fontSize: "0.72rem",
                  borderRadius: "2px",
                  cursor: "pointer",
                }}
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
