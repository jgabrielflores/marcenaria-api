"use client";

import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";

export function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="portal-logout"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "0.68rem",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "oklch(0.62 0.002 0)",
        padding: "0.35rem 0",
      }}
    >
      Sair
    </button>
  );
}
