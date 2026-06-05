"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, changePassword, getMe, updateMe, type UserRead } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { C, labelStyle, headingStyle, inkButtonStyle } from "@/lib/theme";

type FormState = { error: string; ok: string };
const INITIAL: FormState = { error: "", ok: "" };

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserRead | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    getMe(token)
      .then((u) => {
        setUser(u);
        setName(u.name);
      })
      .catch(() => {});
  }, [router]);

  const [profileState, profileAction, profilePending] = useActionState(
    async (_prev: FormState, _formData: FormData): Promise<FormState> => {
      const token = getToken();
      if (!token) return INITIAL;
      try {
        const updated = await updateMe(token, { name });
        setUser(updated);
        return { error: "", ok: "Nome atualizado." };
      } catch (err) {
        return {
          error: err instanceof ApiError ? err.message : "Erro ao salvar.",
          ok: "",
        };
      }
    },
    INITIAL,
  );

  const [pwState, pwAction, pwPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const token = getToken();
      if (!token) return INITIAL;
      const current = formData.get("current_password") as string;
      const next = formData.get("new_password") as string;
      const confirm = formData.get("confirm_password") as string;
      if (next !== confirm) {
        return { error: "As senhas não coincidem.", ok: "" };
      }
      try {
        await changePassword(token, { current_password: current, new_password: next });
        return { error: "", ok: "Senha alterada com sucesso." };
      } catch (err) {
        if (err instanceof ApiError && err.status === 400) {
          return { error: "Senha atual incorreta.", ok: "" };
        }
        return {
          error: err instanceof ApiError ? err.message : "Erro ao alterar a senha.",
          ok: "",
        };
      }
    },
    INITIAL,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3rem", maxWidth: "560px" }}>
      <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "2rem" }}>
        <span style={{ ...labelStyle, marginBottom: "0.75rem" }}>Conta</span>
        <h1 className="font-heading" style={headingStyle}>
          Perfil
        </h1>
        <p style={{ fontSize: "0.875rem", color: C.textSub, marginTop: "0.4rem" }}>
          Gerencie seus dados de acesso.
        </p>
      </div>

      <form
        action={profileAction}
        style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        <div>
          <label htmlFor="name" style={{ ...labelStyle, marginBottom: "0.4rem" }}>
            Nome
          </label>
          <input
            id="name"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="email" style={{ ...labelStyle, marginBottom: "0.4rem" }}>
            E-mail
          </label>
          <input
            id="email"
            className="form-input"
            value={user?.email ?? ""}
            disabled
            style={{ background: C.surface, color: C.textLight }}
          />
        </div>

        {profileState.error && (
          <p style={{ fontSize: "0.82rem", color: C.danger }} role="alert">
            {profileState.error}
          </p>
        )}
        {profileState.ok && (
          <p style={{ fontSize: "0.82rem", color: C.textSub }}>{profileState.ok}</p>
        )}

        <button
          type="submit"
          disabled={profilePending}
          className="btn-ink"
          style={{ ...inkButtonStyle, alignSelf: "flex-start" }}
        >
          {profilePending ? "Salvando…" : "Salvar nome"}
        </button>
      </form>

      <form
        action={pwAction}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          borderTop: `1px solid ${C.border}`,
          paddingTop: "2.5rem",
        }}
      >
        <span style={labelStyle}>Alterar senha</span>
        <div>
          <label htmlFor="current_password" style={{ ...labelStyle, marginBottom: "0.4rem" }}>
            Senha atual
          </label>
          <input
            id="current_password"
            name="current_password"
            type="password"
            className="form-input"
            required
          />
        </div>
        <div>
          <label htmlFor="new_password" style={{ ...labelStyle, marginBottom: "0.4rem" }}>
            Nova senha
          </label>
          <input
            id="new_password"
            name="new_password"
            type="password"
            className="form-input"
            minLength={8}
            required
          />
        </div>
        <div>
          <label htmlFor="confirm_password" style={{ ...labelStyle, marginBottom: "0.4rem" }}>
            Confirmar nova senha
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            className="form-input"
            minLength={8}
            required
          />
        </div>

        {pwState.error && (
          <p style={{ fontSize: "0.82rem", color: C.danger }} role="alert">
            {pwState.error}
          </p>
        )}
        {pwState.ok && <p style={{ fontSize: "0.82rem", color: C.textSub }}>{pwState.ok}</p>}

        <button
          type="submit"
          disabled={pwPending}
          className="btn-ink"
          style={{ ...inkButtonStyle, alignSelf: "flex-start" }}
        >
          {pwPending ? "Alterando…" : "Alterar senha"}
        </button>
      </form>
    </div>
  );
}
