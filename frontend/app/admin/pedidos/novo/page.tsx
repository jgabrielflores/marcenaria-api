"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WhatsappInput } from "@/components/WhatsappInput";
import { CepInput, type ResolvedAddress } from "@/components/CepInput";
import { createOrder, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { C, labelStyle, headingStyle, inkButtonStyle } from "@/lib/theme";

const fieldLabel = { ...labelStyle, color: C.text, marginBottom: "0.4rem" };

const textareaStyle = {
  width: "100%",
  padding: "0.75rem 0.875rem",
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: "2px",
  fontFamily: "var(--font-sans)",
  fontSize: "0.875rem",
  color: C.text,
  outline: "none",
  resize: "vertical" as const,
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        ...labelStyle,
        color: C.text,
        fontWeight: 700,
        paddingBottom: "0.75rem",
        borderBottom: `1px solid ${C.border}`,
        display: "block",
      }}
    >
      {children}
    </span>
  );
}

type State = { error: string };

export default function AdminNewOrderPage() {
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState("");
  const [cep, setCep] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [addressLine, setAddressLine] = useState("");

  function applyAddress(addr: ResolvedAddress) {
    setCity(addr.city);
    setUf(addr.state);
    if (addr.addressLine) setAddressLine(addr.addressLine);
  }

  const [state, formAction, pending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return { error: "" };
      }
      const environments = (formData.get("environments") as string).trim();
      if (!environments) {
        return { error: "Informe ao menos um ambiente." };
      }
      try {
        const order = await createOrder(token, {
          client_name: (formData.get("client_name") as string) || null,
          client_email: (formData.get("client_email") as string) || null,
          whatsapp,
          cep,
          city,
          state: uf,
          address_line: addressLine || null,
          environments,
          furniture_types: (formData.get("furniture_types") as string) || null,
          observations: (formData.get("observations") as string) || null,
        });
        router.replace(`/admin/pedidos/${order.id}`);
        return { error: "" };
      } catch (err) {
        return {
          error: err instanceof ApiError ? err.message : "Erro ao registrar o pedido.",
        };
      }
    },
    { error: "" },
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", maxWidth: "620px" }}>
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
        <span style={{ ...labelStyle, marginBottom: "0.75rem" }}>Novo pedido</span>
        <h1 className="font-heading" style={headingStyle}>
          Registrar pedido
        </h1>
        <p style={{ fontSize: "0.9rem", color: C.text, marginTop: "0.5rem", lineHeight: 1.7 }}>
          Registre um pedido recebido pelo WhatsApp ou presencialmente.
        </p>
      </div>

      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <SectionHeading>Cliente</SectionHeading>
          <div>
            <label htmlFor="client_name" style={fieldLabel}>Nome do cliente</label>
            <input
              id="client_name"
              name="client_name"
              className="form-input"
              maxLength={255}
              placeholder="Nome do cliente"
              required
            />
          </div>
          <div>
            <label htmlFor="client_email" style={fieldLabel}>
              E-mail <span style={{ textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
            </label>
            <input
              id="client_email"
              name="client_email"
              type="email"
              className="form-input"
              maxLength={254}
              placeholder="cliente@email.com"
            />
          </div>
          <div>
            <label htmlFor="whatsapp" style={fieldLabel}>WhatsApp</label>
            <WhatsappInput id="whatsapp" value={whatsapp} onChange={setWhatsapp} />
          </div>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <SectionHeading>Endereço</SectionHeading>
          <div>
            <label htmlFor="cep" style={fieldLabel}>CEP</label>
            <CepInput id="cep" value={cep} onChange={setCep} onAddressFound={applyAddress} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
            <div>
              <label htmlFor="city" style={fieldLabel}>Cidade</label>
              <input
                id="city"
                className="form-input"
                maxLength={120}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="uf" style={fieldLabel}>Estado</label>
              <input
                id="uf"
                className="form-input"
                maxLength={2}
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="address" style={fieldLabel}>
              Endereço <span style={{ textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
            </label>
            <input
              id="address"
              className="form-input"
              maxLength={255}
              placeholder="Rua, número, complemento"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
            />
          </div>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <SectionHeading>Projeto</SectionHeading>
          <div>
            <label htmlFor="environments" style={fieldLabel}>Ambientes de interesse</label>
            <input
              id="environments"
              name="environments"
              className="form-input"
              maxLength={300}
              placeholder="Ex: Cozinha, Closet, Home Office"
              required
            />
          </div>
          <div>
            <label htmlFor="furniture_types" style={fieldLabel}>
              Tipos de móveis <span style={{ textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
            </label>
            <input
              id="furniture_types"
              name="furniture_types"
              className="form-input"
              maxLength={500}
              placeholder="Ex: armário, bancada, painel de TV"
            />
          </div>
          <div>
            <label htmlFor="observations" style={fieldLabel}>
              Observações <span style={{ textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
            </label>
            <textarea
              id="observations"
              name="observations"
              maxLength={2000}
              placeholder="Detalhes do projeto, medidas, referências…"
              rows={4}
              style={textareaStyle}
            />
          </div>
        </section>

        {state.error && (
          <p style={{ fontSize: "0.82rem", color: C.danger, lineHeight: 1.5 }} role="alert">
            {state.error}
          </p>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            paddingTop: "0.5rem",
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <button type="submit" disabled={pending} className="btn-ink" style={inkButtonStyle}>
            {pending ? "Registrando…" : (
              <>
                Registrar pedido <ArrowRight size={13} />
              </>
            )}
          </button>
          <Link href="/admin/pedidos" style={{ fontSize: "0.78rem", color: C.textLight, textDecoration: "none" }}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
