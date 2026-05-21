import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "@/components/LogoutButton";
import { AccountNav } from "@/components/AccountNav";

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "oklch(1.000 0.000 0)" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: "1px solid oklch(0.88 0.003 0)",
          background: "oklch(1.000 0.000 0 / 0.92)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            maxWidth: "960px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.875rem 1.5rem",
          }}
        >
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", gap: "0.875rem", textDecoration: "none" }}
          >
            <Image
              src="/imagens/logoPNG.png"
              alt="Ramos Planejados"
              width={34}
              height={34}
              style={{ objectFit: "contain" }}
            />
            <span
              style={{
                fontSize: "0.6rem",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: "oklch(0.62 0.002 0)",
              }}
            >
              Minha Conta
            </span>
          </Link>
          <LogoutButton />
        </div>
        <div
          style={{
            maxWidth: "960px",
            margin: "0 auto",
            padding: "0 1.5rem 0.875rem",
          }}
        >
          <AccountNav />
        </div>
      </header>

      <main
        className="animate-fade-up"
        style={{ maxWidth: "960px", margin: "0 auto", padding: "3rem 1.5rem" }}
      >
        {children}
      </main>
    </div>
  );
}
