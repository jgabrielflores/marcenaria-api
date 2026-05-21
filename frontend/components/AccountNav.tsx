"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { C } from "@/lib/theme";

const ITEMS = [
  { href: "/conta/pedidos", label: "Meus pedidos" },
  { href: "/conta/pedidos/novo", label: "Novo pedido" },
  { href: "/conta/perfil", label: "Perfil" },
  { href: "/", label: "Início" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return false;
  if (href === "/conta/pedidos/novo") return pathname === href;
  if (href === "/conta/perfil") return pathname.startsWith("/conta/perfil");
  return pathname.startsWith("/conta/pedidos") && pathname !== "/conta/pedidos/novo";
}

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.75rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              textDecoration: "none",
              borderRadius: "2px",
              border: `1px solid ${active ? C.ink : C.border}`,
              background: active ? C.ink : C.bg,
              color: active ? C.inkFg : C.textSub,
              transition: "border-color 0.15s ease, color 0.15s ease",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
