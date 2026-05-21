"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { login, resendVerification, ApiError } from "@/lib/api";
import { saveSession, isAdmin, getToken } from "@/lib/auth";

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

type State = { error: string; unverifiedEmail?: string };

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [verifiedFlag, setVerifiedFlag] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    setVerifiedFlag(new URLSearchParams(window.location.search).get("verified"));
  }, []);

  if (typeof window !== "undefined" && getToken()) {
    router.replace(isAdmin() ? "/admin" : "/conta/pedidos");
  }

  const [state, formAction, pending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      try {
        const { access_token } = await login({ email, password });
        saveSession(access_token);
        router.replace(isAdmin() ? "/admin" : "/conta/pedidos");
        return { error: "" };
      } catch (err) {
        if (err instanceof ApiError && err.status === 403 && err.message === "EMAIL_NOT_VERIFIED") {
          return { error: "", unverifiedEmail: email };
        }
        const msg = err instanceof ApiError ? err.message : "Erro ao fazer login.";
        return { error: msg === "invalid credentials" ? "E-mail ou senha incorretos." : msg };
      }
    },
    { error: "" },
  );

  async function handleResend() {
    if (!state.unverifiedEmail) return;
    try {
      await resendVerification(state.unverifiedEmail);
    } catch {
      /* best-effort */
    }
    setResent(true);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      {/* ── Left panel — project photo ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] flex-shrink-0 relative animate-fade-in">
        <Image
          src="/imagens/projetos/cozinha-integrada.png"
          alt="Ramos Planejados — projeto de cozinha planejada"
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
              }}
            >
              &ldquo;Seu espaço, planejado nos mínimos detalhes.&rdquo;
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

      {/* ── Right panel — form ────────────────────────────────────── */}
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
            Bem-vindo de volta
          </h1>
          <p style={{ fontSize: "0.9rem", color: C.textSub, marginBottom: "2rem", lineHeight: 1.6 }}>
            Entre para acompanhar seus pedidos.
          </p>

          {verifiedFlag === "1" && (
            <div
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: "2px",
                padding: "0.75rem 1rem",
                marginBottom: "1.5rem",
                fontSize: "0.82rem",
                color: C.textSub,
              }}
            >
              E-mail confirmado com sucesso. Faça login para continuar.
            </div>
          )}
          {verifiedFlag === "0" && (
            <div
              style={{
                border: "1px solid oklch(0.577 0.245 27.325 / 0.4)",
                borderRadius: "2px",
                padding: "0.75rem 1rem",
                marginBottom: "1.5rem",
                fontSize: "0.82rem",
                color: "oklch(0.577 0.245 27.325)",
              }}
            >
              Link de confirmação inválido ou expirado. Faça login para reenviar.
            </div>
          )}

          {state.unverifiedEmail ? (
            <div
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: "2px",
                padding: "1rem 1.25rem",
                marginBottom: "1.5rem",
              }}
            >
              <p style={{ fontSize: "0.875rem", color: C.text, fontWeight: 500 }}>
                Confirme seu e-mail para entrar
              </p>
              <p style={{ fontSize: "0.82rem", color: C.textSub, marginTop: "0.35rem", lineHeight: 1.6 }}>
                Sua conta ainda não foi confirmada. Verifique a caixa de entrada de{" "}
                <strong style={{ color: C.text }}>{state.unverifiedEmail}</strong>.
              </p>
              {resent ? (
                <p style={{ fontSize: "0.8rem", color: C.textSub, marginTop: "0.6rem" }}>
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
                    color: C.text,
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                    marginTop: "0.6rem",
                    padding: 0,
                  }}
                >
                  Reenviar e-mail de confirmação
                </button>
              )}
            </div>
          ) : null}

          <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
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
                  placeholder="••••••••"
                  required
                  maxLength={128}
                  autoComplete="current-password"
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
              {pending ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <div style={{ margin: "1.75rem 0", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ height: "1px", flex: 1, background: C.border }} />
            <span style={{ fontSize: "0.72rem", color: C.textLight }}>ou</span>
            <div style={{ height: "1px", flex: 1, background: C.border }} />
          </div>

          <p style={{ textAlign: "center", fontSize: "0.875rem", color: C.textSub }}>
            Não tem conta?{" "}
            <Link
              href="/register"
              style={{
                fontWeight: 500,
                color: C.text,
                textDecoration: "underline",
                textUnderlineOffset: "4px",
              }}
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
