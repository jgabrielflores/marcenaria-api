"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge, STATUS_LABELS } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { OrderNumber } from "@/components/OrderNumber";
import { MoneyInput } from "@/components/MoneyInput";
import { WhatsappInput } from "@/components/WhatsappInput";
import { isOverdue } from "@/components/DueDate";
import {
  ApiError,
  getOrder,
  updateOrderAdmin,
  type OrderRead,
  type OrderStatus,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import { C, labelStyle, headingStyle, formatMoney, formatPhone } from "@/lib/theme";

// Forward adjacency — mirrors the backend transition map.
const FORWARD: Record<OrderStatus, OrderStatus[]> = {
  AGUARDANDO_ANALISE: ["EM_ORCAMENTO"],
  EM_ORCAMENTO: ["APROVADO"],
  APROVADO: ["EM_PRODUCAO"],
  EM_PRODUCAO: ["INSTALACAO_AGENDADA", "CONCLUIDO"],
  INSTALACAO_AGENDADA: ["CONCLUIDO"],
  CONCLUIDO: [],
  CANCELADO: [],
};

const STATUS_ORDER: OrderStatus[] = [
  "AGUARDANDO_ANALISE",
  "EM_ORCAMENTO",
  "APROVADO",
  "EM_PRODUCAO",
  "INSTALACAO_AGENDADA",
  "CONCLUIDO",
  "CANCELADO",
];

/** Valid targets from `current`: one step forward, one step back, or cancel. */
function statusOptions(current: OrderStatus): OrderStatus[] {
  const opts = new Set<OrderStatus>([current, ...FORWARD[current]]);
  for (const status of STATUS_ORDER) {
    if (FORWARD[status].includes(current)) opts.add(status);
  }
  if (current !== "CONCLUIDO" && current !== "CANCELADO") opts.add("CANCELADO");
  return STATUS_ORDER.filter((s) => opts.has(s));
}

const ERROR_TRANSLATIONS: Record<string, string> = {
  "due_date cannot be in the past": "A previsão de entrega não pode ser uma data no passado.",
  "install_date cannot be in the past": "A data de instalação não pode ser uma data no passado.",
  "install_date cannot be before due_date":
    "A data de instalação não pode ser anterior à previsão de entrega.",
};

function translateApiError(message: string): string {
  return ERROR_TRANSLATIONS[message] ?? message;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <dt style={labelStyle}>{label}</dt>
      <dd style={{ fontSize: "0.9rem", color: C.text, lineHeight: 1.5 }}>{value}</dd>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ ...labelStyle, paddingBottom: "1rem", borderBottom: `1px solid ${C.border}`, display: "block" }}>
      {children}
    </span>
  );
}

const fieldLabel = { ...labelStyle, marginBottom: "0.4rem" };

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderRead | null>(null);
  const [loadError, setLoadError] = useState("");

  // Management form fields
  const [status, setStatus] = useState<OrderStatus>("AGUARDANDO_ANALISE");
  const [dueDate, setDueDate] = useState("");
  const [installDate, setInstallDate] = useState("");
  const [projectValue, setProjectValue] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: string; ok?: string }>({});

  // Editable client/project fields (shown when AGUARDANDO_ANALISE)
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editAddressLine, setEditAddressLine] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editEnvironments, setEditEnvironments] = useState("");
  const [editFurnitureTypes, setEditFurnitureTypes] = useState("");
  const [editObservations, setEditObservations] = useState("");

  function hydrate(o: OrderRead) {
    setOrder(o);
    setStatus(o.status);
    setDueDate(o.due_date ?? "");
    setInstallDate(o.install_date ?? "");
    setProjectValue(o.project_value ?? "");
    setEstimatedCost(o.estimated_cost ?? "");
    setAdminNotes(o.admin_notes ?? "");
    setEditWhatsapp(formatPhone(o.whatsapp));
    setEditAddressLine(o.address_line ?? "");
    setEditCity(o.city);
    setEditState(o.state);
    setEditEnvironments(o.environments);
    setEditFurnitureTypes(o.furniture_types ?? "");
    setEditObservations(o.observations ?? "");
  }

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    getOrder(token, id)
      .then(hydrate)
      .catch(() => setLoadError("Pedido não encontrado."));
  }, [id]);

  async function persist(nextStatus: OrderStatus) {
    const token = getToken();
    if (!token || !order) return;

    if (nextStatus !== order.status) {
      if (nextStatus === "APROVADO" && (!projectValue || !dueDate || !estimatedCost)) {
        setFeedback({
          error: "Para aprovar, informe o valor do projeto, o custo estimado e a previsão de entrega.",
        });
        return;
      }
      if (nextStatus === "INSTALACAO_AGENDADA" && !installDate) {
        setFeedback({ error: "Para agendar a instalação, informe a data de instalação." });
        return;
      }
    }

    setSaving(true);
    setFeedback({});
    try {
      const updated = await updateOrderAdmin(token, id, {
        status: nextStatus,
        due_date: dueDate || null,
        install_date: installDate || null,
        project_value: projectValue || null,
        estimated_cost: estimatedCost || null,
        admin_notes: adminNotes || null,
        ...(order.status === "AGUARDANDO_ANALISE" && {
          whatsapp: editWhatsapp,
          address_line: editAddressLine || null,
          city: editCity || undefined,
          state: editState || undefined,
          environments: editEnvironments || undefined,
          furniture_types: editFurnitureTypes || null,
          observations: editObservations || null,
        }),
      });
      hydrate(updated);
      setFeedback({ ok: "Pedido atualizado." });
    } catch (err) {
      setFeedback({
        error: err instanceof ApiError ? translateApiError(err.message) : "Erro ao salvar o pedido.",
      });
    } finally {
      setSaving(false);
    }
  }

  function cancelOrder() {
    if (window.confirm("Cancelar este pedido? Esta ação não pode ser desfeita.")) {
      persist("CANCELADO");
    }
  }

  const liveProfit =
    projectValue && estimatedCost ? Number(projectValue) - Number(estimatedCost) : null;
  const canCancel = order && order.status !== "CONCLUIDO" && order.status !== "CANCELADO";
  const isAguardando = order?.status === "AGUARDANDO_ANALISE";

  if (loadError) {
    return (
      <p style={{ fontSize: "0.82rem", color: C.danger }} role="alert">
        {loadError}
      </p>
    );
  }

  if (!order) {
    return (
      <div
        className="animate-pulse"
        style={{ height: "3rem", width: "18rem", background: "oklch(0.94 0.000 0)" }}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", maxWidth: "780px" }}>
      <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "2rem" }}>
        <Link
          href="/admin/pedidos"
          className="landing-link-cta"
          style={{
            display: "inline-flex",
            gap: "0.35rem",
            fontSize: "0.63rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.textLight,
            textDecoration: "none",
            marginBottom: "1.5rem",
          }}
        >
          ← Todos os pedidos
        </Link>
        <span style={{ ...labelStyle, marginBottom: "0.75rem" }}>
          Pedido <OrderNumber value={order.order_number} />
        </span>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <h1 className="font-heading" style={headingStyle}>
            {order.environments}
          </h1>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Customer data */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <SectionTitle>Dados do cliente</SectionTitle>

        {isAguardando ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1.25rem",
              }}
            >
              <Field label="Nome" value={order.customer_name ?? "—"} />
              <Field label="E-mail" value={order.customer_email ?? "—"} />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1.25rem",
              }}
            >
              <div>
                <label htmlFor="edit-whatsapp" style={fieldLabel}>WhatsApp</label>
                <WhatsappInput
                  id="edit-whatsapp"
                  value={editWhatsapp}
                  onChange={setEditWhatsapp}
                />
              </div>
              <div>
                <label htmlFor="edit-address" style={fieldLabel}>Endereço</label>
                <input
                  id="edit-address"
                  className="form-input"
                  value={editAddressLine}
                  onChange={(e) => setEditAddressLine(e.target.value)}
                  placeholder="Rua, número, complemento"
                />
              </div>
              <div>
                <label htmlFor="edit-city" style={fieldLabel}>Cidade</label>
                <input
                  id="edit-city"
                  className="form-input"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="edit-state" style={fieldLabel}>Estado (UF)</label>
                <input
                  id="edit-state"
                  className="form-input"
                  maxLength={2}
                  value={editState}
                  onChange={(e) => setEditState(e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
            }}
          >
            <Field label="Nome" value={order.customer_name ?? "—"} />
            <Field label="WhatsApp" value={formatPhone(order.whatsapp)} />
            <Field label="E-mail" value={order.customer_email ?? "—"} />
            <Field
              label="Endereço"
              value={[order.address_line, `${order.city} / ${order.state}`, `CEP ${order.cep}`]
                .filter(Boolean)
                .join(" · ")}
            />
          </div>
        )}
      </section>

      {/* Project data */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <SectionTitle>Dados do projeto</SectionTitle>

        {isAguardando ? (
          <>
            <div>
              <label htmlFor="edit-environments" style={fieldLabel}>Ambientes</label>
              <input
                id="edit-environments"
                className="form-input"
                value={editEnvironments}
                onChange={(e) => setEditEnvironments(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="edit-furniture" style={fieldLabel}>Tipos de móveis</label>
              <input
                id="edit-furniture"
                className="form-input"
                value={editFurnitureTypes}
                onChange={(e) => setEditFurnitureTypes(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="edit-observations" style={fieldLabel}>Observações do cliente</label>
              <textarea
                id="edit-observations"
                rows={3}
                value={editObservations}
                onChange={(e) => setEditObservations(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 0.875rem",
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: "2px",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.875rem",
                  color: C.text,
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1.25rem",
              }}
            >
              <Field label="Ambientes" value={order.environments} />
              <Field label="Tipos de móveis" value={order.furniture_types || "—"} />
            </div>
            <Field label="Observações do cliente" value={order.observations || "—"} />
          </>
        )}
      </section>

      {/* Editable management form */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <SectionTitle>Gestão do pedido</SectionTitle>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
          }}
        >
          <div>
            <label htmlFor="status" style={fieldLabel}>
              Status
            </label>
            <div style={{ position: "relative" }}>
              <select
                id="status"
                className="form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                style={{ paddingRight: "2.5rem", cursor: "pointer" }}
              >
                {statusOptions(order.status).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden="true"
                width="11"
                height="11"
                viewBox="0 0 12 12"
                style={{
                  position: "absolute",
                  right: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: C.textLight,
                }}
              >
                <path
                  d="M2 4l4 4 4-4"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div>
            <label htmlFor="due" style={fieldLabel}>
              Previsão de entrega
            </label>
            <input
              id="due"
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            {isOverdue(dueDate, status) && (
              <p style={{ fontSize: "0.75rem", color: C.danger, marginTop: "0.35rem" }}>
                Entrega atrasada
              </p>
            )}
          </div>
          <div>
            <label htmlFor="install" style={fieldLabel}>
              Instalação agendada
            </label>
            <input
              id="install"
              type="date"
              className="form-input"
              value={installDate}
              onChange={(e) => setInstallDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="value" style={fieldLabel}>
              Valor do projeto
            </label>
            <MoneyInput id="value" value={projectValue} onChange={setProjectValue} />
          </div>
          <div>
            <label htmlFor="cost" style={fieldLabel}>
              Custo estimado
            </label>
            <MoneyInput id="cost" value={estimatedCost} onChange={setEstimatedCost} />
          </div>
        </div>

        <div
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: "2px",
            padding: "1rem 1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={labelStyle}>Lucro estimado</span>
          <span
            className="font-heading"
            style={{ fontSize: "1.5rem", fontWeight: 500, color: C.text }}
          >
            {liveProfit === null ? "—" : formatMoney(String(liveProfit))}
          </span>
        </div>

        <div>
          <label htmlFor="admin_notes" style={fieldLabel}>
            Notas internas (não visível ao cliente)
          </label>
          <textarea
            id="admin_notes"
            rows={3}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 0.875rem",
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: "2px",
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
              color: C.text,
              outline: "none",
              resize: "vertical",
            }}
          />
        </div>

        {feedback.error && (
          <p style={{ fontSize: "0.82rem", color: C.danger }} role="alert">
            {feedback.error}
          </p>
        )}
        {feedback.ok && <p style={{ fontSize: "0.82rem", color: C.textSub }}>{feedback.ok}</p>}

        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={saving}
            className="btn-ink"
            onClick={() => persist(status)}
            style={{
              padding: "0.78rem 2rem",
              background: C.ink,
              color: C.inkFg,
              fontSize: "0.78rem",
              fontWeight: 500,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              borderRadius: "2px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
          {canCancel && (
            <button
              type="button"
              disabled={saving}
              onClick={cancelOrder}
              style={{
                background: "none",
                border: "none",
                fontSize: "0.78rem",
                color: C.danger,
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Cancelar pedido
            </button>
          )}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <SectionTitle>Histórico</SectionTitle>
        <StatusTimeline history={order.history} />
      </section>
    </div>
  );
}
