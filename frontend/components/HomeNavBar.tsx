"use client";

import type { CSSProperties } from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const C = {
  bg:     "oklch(1.000 0.000 0)",
  text:   "oklch(0.10 0.006 0)",
  sub:    "oklch(0.40 0.004 0)",
  ink:    "oklch(0.12 0.006 0)",
  inkFg:  "oklch(1.000 0.000 0)",
  border: "oklch(0.88 0.003 0)",
} as const;

const NAV_LINKS = [
  { label: "Home",     href: "#top",       section: "top" },
  { label: "Sobre",    href: "#filosofia", section: "filosofia" },
  { label: "Contatos", href: "#contato",   section: "contato" },
  { label: "Entrar",   href: "/login",     section: "" },
] as const;

const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export function HomeNavBar() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const [ctaHover, setCtaHover] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    const ids = ["top", "filosofia", "contato"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const linkStyle: CSSProperties = {
    fontSize: "0.82rem",
    color: C.sub,
    textDecoration: "none",
    letterSpacing: "0.02em",
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: C.bg,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 2.5rem",
          height: "84px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link href="/" aria-label="Ramos Planejados" style={{ display: "flex" }}>
          <Image
            src="/imagens/logoPNG.png"
            alt="Ramos Planejados"
            width={80}
            height={80}
            style={{ objectFit: "contain", width: "auto", height: "64px" }}
          />
        </Link>

        {/* ── Bloco direito: nav + CTA + instagram + hamburger ── */}
        <div style={{ display: "flex", alignItems: "center" }}>

          {/* Desktop nav */}
          <nav className="home-nav-desktop">
            {NAV_LINKS.map(({ label, href, section }) => {
              const isActive = section !== "" && activeSection === section;
              return label === "Entrar" ? (
                <Link
                  key={label}
                  href={href}
                  className={`home-nav-link${isActive ? " active" : ""}`}
                  style={linkStyle}
                >
                  {label}
                </Link>
              ) : (
                <a
                  key={label}
                  href={href}
                  className={`home-nav-link${isActive ? " active" : ""}`}
                  style={linkStyle}
                >
                  {label}
                </a>
              );
            })}

            {/* CTA */}
            <a
              href="#contato"
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              style={{
                fontSize: "0.76rem",
                fontWeight: 500,
                letterSpacing: ctaHover ? "0.20em" : "0.09em",
                textTransform: "uppercase",
                padding: ctaHover ? "0.6rem 1.6rem" : "0.6rem 1.35rem",
                background: ctaHover ? "oklch(0.22 0.006 0)" : C.ink,
                color: C.inkFg,
                textDecoration: "none",
                borderRadius: "2px",
                boxShadow: ctaHover ? "0 4px 16px oklch(0 0 0 / 0.25)" : "none",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              Solicite seu Projeto
            </a>

            {/* Instagram — após o CTA */}
            <a
              href="https://www.instagram.com/ramos_planejados01/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Ramos Planejados"
              style={{
                display: "flex",
                alignItems: "center",
                color: C.sub,
                marginLeft: "0.25rem",
                transition: "color 0.18s ease",
              }}
            >
              <InstagramIcon />
            </a>
          </nav>

          {/* Hamburger */}
          <button
            className="home-nav-hamburger"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              color: C.text,
              marginLeft: "0.5rem",
            }}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ── Drawer mobile ── */}
      {open && (
        <div
          style={{
            background: C.bg,
            borderTop: `1px solid ${C.border}`,
            padding: "1.25rem 2.5rem 1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.1rem",
          }}
        >
          {([
            { label: "Home",               href: "#top",       isBtn: false, isLink: false },
            { label: "Sobre",              href: "#filosofia", isBtn: false, isLink: false },
            { label: "Contatos",           href: "#contato",   isBtn: false, isLink: false },
            { label: "Entrar",             href: "/login",     isBtn: false, isLink: true  },
            { label: "Solicite seu Projeto", href: "#contato",  isBtn: true,  isLink: false },
          ] as const).map(({ label, href, isBtn, isLink }) => {
            const itemStyle: CSSProperties = {
              display: "block",
              textAlign: "right",
              textDecoration: "none",
              color: isBtn ? C.inkFg : C.text,
              fontSize: isBtn ? "0.78rem" : "0.95rem",
              fontWeight: isBtn ? 500 : 400,
              letterSpacing: isBtn ? "0.09em" : "normal",
              textTransform: isBtn ? "uppercase" : "none",
              ...(isBtn && {
                background: C.ink,
                padding: "0.8rem 1.5rem",
                borderRadius: "2px",
                marginTop: "0.25rem",
              }),
            };
            return isLink ? (
              <Link key={label} href={href} onClick={close} style={itemStyle}>
                {label}
              </Link>
            ) : (
              <a key={label} href={href} onClick={close} style={itemStyle}>
                {label}
              </a>
            );
          })}

          {/* Instagram no drawer */}
          <a
            href="https://www.instagram.com/ramos_planejados01/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "0.4rem",
              color: C.sub,
              textDecoration: "none",
              fontSize: "0.82rem",
            }}
          >
            <InstagramIcon />
            @ramos_planejados01
          </a>
        </div>
      )}
    </header>
  );
}
