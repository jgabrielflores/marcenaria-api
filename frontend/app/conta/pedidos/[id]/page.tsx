"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { OrderNumber } from "@/components/OrderNumber";
import { OrderImageGallery } from "@/components/OrderImageGallery";
import { getOrder, type OrderRead } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { C, labelStyle, headingStyle, formatDate, formatMoney, formatPhone } from "@/lib/theme";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.3rem",
        padding: "1.1rem 0",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <dt style={labelStyle}>{label}</dt>
      <dd style={{ fontSize: "0.9rem", color: C.text, lineHeight: 1.6 }}>{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderTop: `1px solid ${C.border}` }}>
      <span style={{ ...labelStyle, paddingTop: "1.25rem", display: "block" }}>{title}</span>
      <dl style={{ margin: 0 }}>{children}</dl>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderRead | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    getOrder(token, id)
      .then(setOrder)
      .catch(() => setError("Pedido não encontrado."));
  }, [id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", maxWidth: "680px" }}>
      <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "2rem" }}>
        <Link
          href="/conta/pedidos"
          className="landing-link-cta"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.63rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.textLight,
            textDecoration: "none",
            marginBottom: "1.5rem",
          }}
        >
          ← Meus pedidos
        </Link>

        {order ? (
          <>
            <span style={{ ...labelStyle, marginBottom: "0.75rem" }}>
              Pedido <OrderNumber value={order.order_number} />
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <h1 className="font-heading" style={headingStyle}>
                {order.environments}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p style={{ fontSize: "0.875rem", color: C.textSub, marginTop: "0.5rem" }}>
              Aberto em {formatDate(order.created_at)}
            </p>
          </>
        ) : (
          !error && (
            <div
              className="animate-pulse"
              style={{ height: "2.5rem", width: "16rem", background: "oklch(0.94 0.000 0)" }}
            />
          )
        )}
      </div>

      {error && (
        <p style={{ fontSize: "0.82rem", color: C.danger }} role="alert">
          {error}
        </p>
      )}

      {order && (
        <>
          <Section title="Projeto">
            <Field label="Ambientes" value={order.environments} />
            <Field label="Tipos de móveis" value={order.furniture_types || "—"} />
            <Field label="Observações" value={order.observations || "—"} />
          </Section>

          <Section title="Contato e endereço">
            <Field label="WhatsApp" value={formatPhone(order.whatsapp)} />
            <Field
              label="Endereço"
              value={[order.address_line, `${order.city} / ${order.state}`, `CEP ${order.cep}`]
                .filter(Boolean)
                .join(" · ")}
            />
          </Section>

          {(order.project_value || order.due_date || order.install_date) && (
            <Section title="Orçamento e prazos">
              {order.project_value && (
                <Field label="Valor do projeto" value={formatMoney(order.project_value)} />
              )}
              {order.due_date && (
                <Field label="Previsão de entrega" value={formatDate(order.due_date)} />
              )}
              {order.install_date && (
                <Field label="Instalação agendada" value={formatDate(order.install_date)} />
              )}
            </Section>
          )}

          {(order.images.length > 0 || order.status === "AGUARDANDO_ANALISE") && (
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "1.5rem" }}>
              <span style={{ ...labelStyle, marginBottom: "1.25rem", display: "block" }}>
                Fotos do ambiente
              </span>
              <OrderImageGallery
                orderId={order.id}
                images={order.images}
                editable={order.status === "AGUARDANDO_ANALISE"}
                onImagesChange={(images) => setOrder({ ...order, images })}
              />
            </div>
          )}

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "1.5rem" }}>
            <span style={{ ...labelStyle, marginBottom: "1.25rem", display: "block" }}>
              Histórico
            </span>
            <StatusTimeline history={order.history} />
          </div>
        </>
      )}
    </div>
  );
}
