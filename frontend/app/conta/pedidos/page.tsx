"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderNumber } from "@/components/OrderNumber";
import { DueDate } from "@/components/DueDate";
import { listOrders, type PaginatedOrders } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { C, labelStyle, headingStyle, inkButtonStyle, formatDate } from "@/lib/theme";

export default function PedidosPage() {
  const [data, setData] = useState<PaginatedOrders | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    listOrders(token, { page, limit: 10 })
      .then(setData)
      .catch(() => setError("Não foi possível carregar os pedidos."));
  }, [page]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
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
          <span style={{ ...labelStyle, marginBottom: "0.75rem" }}>Pedidos</span>
          <h1 className="font-heading" style={headingStyle}>
            Meus pedidos
          </h1>
          <p style={{ fontSize: "0.875rem", color: C.textSub, marginTop: "0.4rem" }}>
            Acompanhe o andamento dos seus projetos.
          </p>
        </div>
        <Link
          href="/conta/pedidos/novo"
          className="btn-ink"
          style={{
            ...inkButtonStyle,
            padding: "0.7rem 1.5rem",
            fontSize: "0.72rem",
            whiteSpace: "nowrap",
          }}
        >
          Novo pedido <ArrowRight size={12} />
        </Link>
      </div>

      {error && (
        <p style={{ fontSize: "0.82rem", color: C.danger }} role="alert">
          {error}
        </p>
      )}

      {!data && !error && (
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: "5.25rem",
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
            padding: "5rem 2rem",
            textAlign: "center",
          }}
        >
          <p
            className="font-heading"
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 400,
              fontStyle: "italic",
              color: C.textSub,
            }}
          >
            Nenhum pedido ainda
          </p>
          <p style={{ fontSize: "0.875rem", color: C.textLight, margin: "0.75rem 0 2.25rem" }}>
            Abra seu primeiro projeto de marcenaria planejada.
          </p>
          <Link href="/conta/pedidos/novo" className="btn-ink" style={inkButtonStyle}>
            Criar primeiro pedido <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <ul
            style={{ borderTop: `1px solid ${C.border}`, listStyle: "none", padding: 0, margin: 0 }}
          >
            {data.items.map((order, i) => (
              <li
                key={order.id}
                className="animate-fade-up"
                style={{ borderBottom: `1px solid ${C.border}`, animationDelay: `${i * 60}ms` }}
              >
                <Link
                  href={`/conta/pedidos/${order.id}`}
                  className="row-link"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1.5rem",
                    padding: "1.4rem 0.5rem",
                    textDecoration: "none",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: C.textLight,
                        letterSpacing: "0.06em",
                      }}
                    >
                      Pedido <OrderNumber value={order.order_number} />
                    </span>
                    <span
                      className="font-heading"
                      style={{
                        fontSize: "1.15rem",
                        fontWeight: 500,
                        color: C.text,
                        display: "block",
                        lineHeight: 1.25,
                        marginTop: "0.1rem",
                      }}
                    >
                      {order.environments}
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: C.textLight,
                        display: "block",
                        marginTop: "0.3rem",
                      }}
                    >
                      Aberto em {formatDate(order.created_at)}
                      {order.due_date && (
                        <>
                          {" · Previsão: "}
                          <DueDate dueDate={order.due_date} status={order.status} />
                        </>
                      )}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}
                  >
                    <StatusBadge status={order.status} />
                    <ArrowRight size={14} style={{ color: C.border }} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

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
