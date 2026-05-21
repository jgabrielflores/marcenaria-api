"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { WhatsappInput } from "@/components/WhatsappInput";
import { CepInput, type ResolvedAddress } from "@/components/CepInput";
import { createOrder, ApiError, type OrderRead } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { C, labelStyle, headingStyle, inkButtonStyle } from "@/lib/theme";

const CONTACTS = [
  { name: "Anísio", phone: "(12) 99786-1739" },
  { name: "William", phone: "(12) 99158-1305" },
];

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

export default function NewOrderPage() {
  const router = useRouter();
  const [created, setCreated] = useState<OrderRead | null>(null);

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
        return { error: "Informe ao menos um ambiente de interesse." };
      }
      try {
        const order = await createOrder(token, {
          whatsapp,
          cep,
          city,
          state: uf,
          address_line: addressLine || null,
          environments,
          furniture_types: (formData.get("furniture_types") as string) || null,
          observations: (formData.get("observations") as string) || null,
        });
        setCreated(order);
        return { error: "" };
      } catch (err) {
        return {
          error: err instanceof ApiError ? err.message : "Erro ao enviar o pedido.",
        };
      }
    },
    { error: "" },
  );

  if (created) {
    return (
      <div style={{ maxWidth: "560px", display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div
          style={{
            width: "3rem",
            height: "3rem",
            borderRadius: "50%",
            background: C.ink,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={20} color={C.inkFg} />
        </div>
        <div>
          <h1 className="font-heading" style={headingStyle}>
            Pedido enviado com sucesso
          </h1>
          <p style={{ fontSize: "0.9rem", color: C.textSub, marginTop: "0.6rem", lineHeight: 1.7 }}>
            Nossa equipe entrará em contato em breve para alinhar os detalhes do seu projeto.
          </p>
        </div>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: "2px", padding: "1.25rem 1.5rem" }}>
          <span style={{ ...labelStyle, marginBottom: "0.75rem" }}>Fale com a gente</span>
          {CONTACTS.map((c) => (
            <p key={c.name} style={{ fontSize: "0.9rem", color: C.text, marginTop: "0.35rem" }}>
              {c.name}: <strong>{c.phone}</strong>
            </p>
          ))}
        </div>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <Link href={`/conta/pedidos/${created.id}`} className="btn-ink" style={inkButtonStyle}>
            Ver pedido <ArrowRight size={13} />
          </Link>
          <Link href="/conta/pedidos" style={{ fontSize: "0.78rem", color: C.textLight, textDecoration: "none" }}>
            Voltar aos pedidos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", maxWidth: "620px" }}>
      <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "2rem" }}>
        <span style={{ ...labelStyle, marginBottom: "0.75rem" }}>Novo pedido</span>
        <h1 className="font-heading" style={headingStyle}>
          Conte sobre seu projeto
        </h1>
        <p style={{ fontSize: "0.9rem", color: C.text, marginTop: "0.5rem", lineHeight: 1.7 }}>
          Quanto mais detalhes, mais preciso será o orçamento.
        </p>
      </div>

      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {/* Contato */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <SectionHeading>Contato</SectionHeading>
          <div>
            <label htmlFor="whatsapp" style={fieldLabel}>WhatsApp</label>
            <WhatsappInput id="whatsapp" value={whatsapp} onChange={setWhatsapp} />
          </div>
        </section>

        {/* Endereço */}
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

        {/* Projeto */}
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
              placeholder="Ideia geral, medidas aproximadas, cores, estilo, referências…"
              rows={5}
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
            {pending ? "Enviando…" : (
              <>
                Enviar pedido <ArrowRight size={13} />
              </>
            )}
          </button>
          <Link href="/conta/pedidos" style={{ fontSize: "0.78rem", color: C.textLight, textDecoration: "none" }}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
