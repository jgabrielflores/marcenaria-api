"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { register, resendVerification, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";

/* ── Palette (same as home page) ─────────────────────────────────────── */
const C = {
  bg:        "oklch(1.000 0.000 0)",
  text:      "oklch(0.10 0.006 0)",
  textSub:   "oklch(0.40 0.004 0)",
  textLight: "oklch(0.62 0.002 0)",
  ink:       "oklch(0.12 0.006 0)",
  inkFg:     "oklch(1.000 0.000 0)",
  border:    "oklch(0.88 0.003 0)",
} as const;

const labelStyle: CSSProperties = {
  fontSize: "0.63rem",
  textTransform: "uppercase",
  letterSpacing: "0.28em",
  color: C.textSub,
  display: "block",
  marginBottom: "0.4rem",
};

const submitStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "0.82rem 1.9rem",
  background: C.ink,
  color: C.inkFg,
  fontSize: "0.78rem",
  fontWeight: 500,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  borderRadius: "2px",
  border: "none",
  cursor: "pointer",
  marginTop: "0.25rem",
};

type State = { error: string };

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  if (typeof window !== "undefined" && getToken()) {
    router.replace("/conta/pedidos");
  }

  const [state, formAction, pending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      try {
        await register({ name, email, password });
        setRegisteredEmail(email);
        return { error: "" };
      } catch (err) {
        return { error: err instanceof ApiError ? err.message : "Erro ao criar conta." };
      }
    },
    { error: "" },
  );

  async function handleResend() {
    if (!registeredEmail) return;
    try {
      await resendVerification(registeredEmail);
    } catch {
      /* best-effort — the response is uniform regardless */
    }
    setResent(true);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      {/* ── Left panel — project photo ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] flex-shrink-0 relative animate-fade-in">
        <Image
          src="/imagens/projetos/armarioChurrasqueira2.png"
          alt="Ramos Planejados — armário planejado"
          fill
          priority
          sizes="44vw"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, oklch(0 0 0 / 0.20) 0%, oklch(0 0 0 / 0.52) 55%, oklch(0 0 0 / 0.84) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "3rem",
          }}
        >
          <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
            <Image
              src="/imagens/logoPNG.png"
              alt="Ramos Planejados"
              width={48}
              height={48}
              style={{ objectFit: "contain" }}
            />
          </Link>
          <blockquote>
            <p
              className="font-heading"
              style={{
                fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)",
                fontWeight: 400,
                lineHeight: 1.5,
                fontStyle: "italic",
                color: "oklch(1.000 0.000 0 / 0.85)",
                maxWidth: "340px",
                marginBottom: "1rem",
              }}
            >
              &ldquo;Móveis que atravessam gerações.&rdquo;
            </p>
            <p
              style={{
                fontSize: "0.875rem",
                lineHeight: 1.65,
                color: "oklch(1.000 0.000 0 / 0.52)",
                maxWidth: "300px",
              }}
            >
              Solicite seu orçamento, acompanhe cada etapa da produção e receba
              um móvel feito exclusivamente para você.
            </p>
          </blockquote>
          <div>
            <p
              style={{
                fontSize: "0.63rem",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "oklch(1.000 0.000 0 / 0.40)",
                marginBottom: "0.35rem",
              }}
            >
              Tremembé · São Paulo
            </p>
            <p style={{ fontSize: "0.72rem", color: "oklch(1.000 0.000 0 / 0.55)", lineHeight: 1.5 }}>
              Atendemos em toda a região do estado de SP
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel ───────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 1.5rem",
          background: C.bg,
        }}
      >
        <div className="animate-fade-up" style={{ width: "100%", maxWidth: "360px" }}>
          <div
            className="lg:hidden"
            style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "2rem" }}
          >
            <Image
              src="/imagens/logoPNG.png"
              alt="Ramos Planejados"
              width={30}
              height={30}
              style={{ objectFit: "contain" }}
            />
            <span
              style={{
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: C.textLight,
              }}
            >
              <span style={{ color: "oklch(0.72 0.14 82)" }}>Ramos</span>{" "}
              <span style={{ color: C.text }}>Planejados</span>
            </span>
          </div>

          {registeredEmail ? (
            <div>
              <div
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "50%",
                  background: C.ink,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <MailCheck size={20} color={C.inkFg} />
              </div>
              <h1
                className="font-heading"
                style={{
                  fontSize: "clamp(2rem, 4vw, 2.5rem)",
                  fontWeight: 500,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  color: C.text,
                  marginBottom: "0.5rem",
                }}
              >
                Confirme seu e-mail
              </h1>
              <p style={{ fontSize: "0.9rem", color: C.textSub, lineHeight: 1.7 }}>
                Enviamos um link de confirmação para{" "}
                <strong style={{ color: C.text }}>{registeredEmail}</strong>. Clique
                no link para ativar sua conta, só depois disso será possível entrar.
              </p>
              <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <Link href="/login" className="btn-ink" style={submitStyle}>
                  Ir para o login
                </Link>
                {resent ? (
                  <p style={{ fontSize: "0.8rem", color: C.textSub, textAlign: "center" }}>
                    Se o e-mail estiver pendente, enviamos um novo link.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "0.8rem",
                      color: C.textLight,
                      cursor: "pointer",
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                    }}
                  >
                    Não recebeu? Reenviar e-mail
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <h1
                className="font-heading"
                style={{
                  fontSize: "clamp(2.2rem, 4vw, 2.75rem)",
                  fontWeight: 500,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  color: C.text,
                  marginBottom: "0.5rem",
                }}
              >
                Criar sua conta
              </h1>
              <p style={{ fontSize: "0.9rem", color: C.textSub, marginBottom: "2.5rem", lineHeight: 1.6 }}>
                Solicite seu primeiro orçamento em minutos.
              </p>

              <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label htmlFor="name" style={labelStyle}>Nome completo</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Seu nome"
                    required
                    maxLength={255}
                    autoComplete="name"
                    className="form-input"
                  />
                </div>

                <div>
                  <label htmlFor="email" style={labelStyle}>E-mail</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    maxLength={254}
                    autoComplete="email"
                    className="form-input"
                  />
                </div>

                <div>
                  <label htmlFor="password" style={labelStyle}>Senha</label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      required
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      className="form-input"
                      style={{ paddingRight: "2.75rem" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                      aria-pressed={showPassword}
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: C.textLight,
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {showPassword ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
                    </button>
                  </div>
                </div>

                {state.error && (
                  <p
                    style={{ fontSize: "0.82rem", color: "oklch(0.577 0.245 27.325)", lineHeight: 1.5 }}
                    role="alert"
                  >
                    {state.error}
                  </p>
                )}

                <button type="submit" disabled={pending} className="btn-ink" style={submitStyle}>
                  {pending ? "Criando conta…" : "Criar conta"}
                </button>
              </form>

              <div style={{ margin: "1.75rem 0", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ height: "1px", flex: 1, background: C.border }} />
                <span style={{ fontSize: "0.72rem", color: C.textLight }}>ou</span>
                <div style={{ height: "1px", flex: 1, background: C.border }} />
              </div>

              <p style={{ textAlign: "center", fontSize: "0.875rem", color: C.textSub }}>
                Já tem conta?{" "}
                <Link
                  href="/login"
                  style={{
                    fontWeight: 500,
                    color: C.text,
                    textDecoration: "underline",
                    textUnderlineOffset: "4px",
                  }}
                >
                  Entrar
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
