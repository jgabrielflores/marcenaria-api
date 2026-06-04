import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, MapPin, ArrowRight, MessageCircle } from "lucide-react";
import { HomeNavBar } from "@/components/HomeNavBar";
import { Lightbox } from "@/components/Lightbox";

/* ─────────────────────────────────────────────────────────────────────────────
   Palette — Pure White / Premium Monochrome
   bg:        oklch(1.000 0.000 0)   pure white (all sections)
   text:      oklch(0.10 0.006 0)    near-black neutral
   textSub:   oklch(0.40 0.004 0)    medium gray
   textLight: oklch(0.62 0.002 0)    light gray
   ink:       oklch(0.12 0.006 0)    CTA button bg (near-black)
   inkFg:     oklch(1.000 0.000 0)   CTA button text
   border:    oklch(0.88 0.003 0)    neutral gray border
   ───────────────────────────────────────────────────────────────────────────── */

const C = {
  bg: "oklch(1.000 0.000 0)",
  text: "oklch(0.10 0.006 0)",
  textSub: "oklch(0.40 0.004 0)",
  textLight: "oklch(0.62 0.002 0)",
  ink: "oklch(0.12 0.006 0)",
  inkFg: "oklch(1.000 0.000 0)",
  border: "oklch(0.88 0.003 0)",
} as const;

/* Shared styles for section labels */
const labelStyle: CSSProperties = {
  fontSize: "0.63rem",
  textTransform: "uppercase",
  letterSpacing: "0.28em",
  color: C.textSub,
  display: "block",
};

/* Shared primary button */
const btnPrimary: CSSProperties = {
  display: "inline-block",
  padding: "0.82rem 1.9rem",
  background: C.ink,
  color: C.inkFg,
  textDecoration: "none",
  fontSize: "0.78rem",
  fontWeight: 500,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  borderRadius: "2px",
  transition: "opacity 0.18s ease",
};

/* Shared secondary button */
const btnSecondary: CSSProperties = {
  display: "inline-block",
  padding: "0.82rem 1.9rem",
  background: C.bg,
  color: C.text,
  border: `1px solid ${C.border}`,
  textDecoration: "none",
  fontSize: "0.78rem",
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  borderRadius: "2px",
  transition: "border-color 0.18s ease",
};

/* ── HERO ─────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section
      id="top"
      style={{ position: "relative", width: "100%", height: "88vh", minHeight: "520px" }}
    >
      <Image
        src="/imagens/projetos/armarioCozinha3.png"
        alt="Projeto de cozinha planejada Ramos Planejados"
        fill
        priority
        sizes="100vw"
        style={{ objectFit: "cover", objectPosition: "center" }}
      />

      {/* Subtle cinematic overlay — lighter than before */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, oklch(0 0 0 / 0.25) 0%, oklch(0 0 0 / 0.50) 55%, oklch(0 0 0 / 0.78) 100%)",
        }}
      />

      {/* Text block — positioned in the lower third, matching reference */}
      <div
        style={{
          position: "absolute",
          bottom: "6%",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "0 2rem",
          gap: "1.1rem",
        }}
      >
        <h1 style={{ margin: 0 }}>
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(0.62rem, 1.1vw, 0.75rem)",
              fontWeight: 400,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "oklch(0.95 0.000 0 / 0.72)",
              marginBottom: "0.85rem",
            }}
          >
            <span style={{ color: "oklch(0.72 0.14 82)" }}>Ramos</span> Planejados
          </span>
          <span
            className="font-heading"
            style={{
              display: "block",
              fontSize: "clamp(2.4rem, 6vw, 4.5rem)",
              fontWeight: 500,
              lineHeight: 1.08,
              letterSpacing: "0.04em",
              color: "oklch(1.000 0.000 0)",
            }}
          >
            Móveis Planejados
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(0.85rem, 1.8vw, 1rem)",
            fontWeight: 400,
            letterSpacing: "0.12em",
            color: "oklch(0.95 0.000 0 / 0.85)",
          }}
        >
          Atendemos em toda a região do estado de SP
        </p>

        {/* Pill CTA — matches reference style */}
        <a
          href="#filosofia"
          className="landing-hero-pill"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "0.4rem",
            padding: "0.65rem 1.75rem",
            border: "1px solid oklch(1 0 0 / 0.70)",
            color: "oklch(1.000 0.000 0)",
            textDecoration: "none",
            fontSize: "0.92rem",
            letterSpacing: "0.06em",
            borderRadius: "999px",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        >
          Saiba Mais <ArrowRight size={13} />
        </a>
      </div>
    </section>
  );
}

/* ── MANIFESTO STRIP ──────────────────────────────────────────────────────── */

function ManifestoStrip() {
  return (
    <section style={{ background: C.bg, padding: "2.5rem 2rem" }}>
      <div
        style={{
          maxWidth: "820px",
          margin: "0 auto",
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
          padding: "2.5rem 2rem",
          textAlign: "center",
        }}
      >
        <p
          className="font-heading"
          style={{
            fontSize: "clamp(1.25rem, 2.8vw, 1.85rem)",
            fontWeight: 400,
            lineHeight: 1.6,
            color: C.text,
            fontStyle: "italic",
          }}
        >
          &ldquo;Seu espaço, planejado nos mínimos detalhes.&rdquo;
        </p>
      </div>
    </section>
  );
}

/* ── PHILOSOPHY ───────────────────────────────────────────────────────────── */

function Philosophy() {
  return (
    <section
      id="filosofia"
      style={{ background: C.bg, padding: "7rem 2rem", borderTop: `1px solid ${C.border}` }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "5rem",
          alignItems: "center",
        }}
      >
        {/* Text column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <h2
            className="font-heading"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3rem)",
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: C.text,
            }}
          >
            <span style={{ color: "oklch(0.72 0.14 82)" }}>Ramos</span> Planejados
          </h2>

          <p style={{ fontSize: "0.975rem", lineHeight: 1.8, color: C.textSub }}>
            A Ramos Planejados nasceu com o propósito de transformar ambientes através de móveis
            planejados que unem funcionalidade, sofisticação e personalidade.
          </p>
          <p style={{ fontSize: "0.975rem", lineHeight: 1.8, color: C.textSub }}>
            Acreditamos que cada espaço deve refletir o estilo e as necessidades de quem vive nele.
            Por isso, desenvolvemos projetos sob medida, pensados para otimizar ambientes e
            proporcionar conforto, organização e praticidade no dia a dia.
          </p>
          <p style={{ fontSize: "0.975rem", lineHeight: 1.8, color: C.textSub }}>
            Trabalhamos com dedicação em cada detalhe, criando soluções para cozinhas, dormitórios,
            closets, salas, banheiros, espaços corporativos e muito mais. Nosso compromisso é
            entregar ambientes modernos, aconchegantes e feitos para durar.
          </p>

          <a
            href="#contato"
            className="landing-link-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              fontSize: "0.8rem",
              fontWeight: 500,
              letterSpacing: "0.05em",
              color: C.ink,
              textDecoration: "none",
              marginTop: "0.25rem",
            }}
          >
            Solicitar meu projeto <ArrowRight size={14} />
          </a>
        </div>

        {/* Image column */}
        <Lightbox
          src="/imagens/projetos/armarioChurrasqueira2.png"
          alt="Cozinha planejada Ramos Planejados"
        >
          <div
            style={{
              position: "relative",
              aspectRatio: "3 / 4",
              overflow: "hidden",
              borderRadius: "2px",
            }}
          >
            <Image
              src="/imagens/projetos/armarioChurrasqueira2.png"
              alt="Projeto de cozinha planejada Ramos Planejados"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          </div>
        </Lightbox>
      </div>
    </section>
  );
}

/* ── DIFFERENTIALS ────────────────────────────────────────────────────────── */

const differentials = [
  {
    title: "Sofisticação",
    description:
      "Projetos desenvolvidos para transformar ambientes com elegância, conforto e personalidade.",
  },
  {
    title: "Personalização",
    description: "Cada detalhe pensado para refletir seu espaço, sua rotina e seu estilo de vida.",
  },
  {
    title: "Qualidade",
    description: "Materiais selecionados, acabamento refinado e atenção em cada etapa da produção.",
  },
] as const;

function GoldStar() {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="oklch(0.72 0.14 82)"
        stroke="oklch(0.72 0.14 82)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

function Differentials() {
  return (
    <section
      style={{
        background: C.bg,
        padding: "5rem 2rem",
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
        {/* Title */}
        <h2
          className="font-heading"
          style={{
            fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: C.text,
            lineHeight: 1.2,
            marginBottom: "1rem",
          }}
        >
          O Diferencial da <span style={{ color: "oklch(0.72 0.14 82)" }}>Ramos</span> Planejados
        </h2>

        {/* Decorative line */}
        <div
          style={{
            width: "320px",
            height: "2px",
            background: C.text,
            margin: "0 auto 3.5rem",
          }}
        />

        {/* 3 columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "2.5rem",
          }}
        >
          {differentials.map(({ title, description }) => (
            <div
              key={title}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.875rem",
              }}
            >
              <GoldStar />
              <p
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: C.text,
                  margin: 0,
                }}
              >
                {title}
              </p>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: C.textSub, margin: 0 }}>
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── GALLERY ──────────────────────────────────────────────────────────────── */

function Gallery() {
  return (
    <section style={{ background: C.bg, padding: "7rem 2rem", borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "3.5rem" }}>
          <span style={{ ...labelStyle, marginBottom: "0.75rem", display: "block" }}>
            Portfólio
          </span>
          <h2
            className="font-heading"
            style={{
              fontSize: "clamp(1.9rem, 4vw, 2.9rem)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: C.text,
              lineHeight: 1.1,
            }}
          >
            Nossos Projetos
          </h2>
        </div>

        {/* Asymmetric grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: "6px",
          }}
        >
          {/* 1: Cozinha Integrada — wide */}
          <GalleryItem
            src="/imagens/projetos/cozinha-integrada.png"
            alt="Cozinha integrada planejada"
            label="Cozinha Integrada"
            style={{ gridColumn: "span 7" }}
            aspect="16 / 10"
          />
          {/* 2: Painel TV */}
          <GalleryItem
            src="/imagens/projetos/painel-tv.png"
            alt="Painel TV planejado"
            label="Painel TV"
            style={{ gridColumn: "span 5" }}
            aspect="4 / 3"
          />
          {/* 3: Banheiro — swapped to position 3 */}
          <GalleryItem
            src="/imagens/projetos/banheiro.png"
            alt="Banheiro planejado"
            label="Banheiro Planejado"
            style={{ gridColumn: "span 5" }}
            aspect="4 / 3"
            objectPosition="center top"
          />
          {/* 4: Casinha de Jardim — swapped to wide position 4 */}
          <GalleryItem
            src="/imagens/projetos/cozinha-compacta.jpg"
            alt="Casinha de jardim planejada"
            label="Casinha de Jardim"
            style={{ gridColumn: "span 7" }}
            aspect="16 / 10"
            objectPosition="center 65%"
          />
        </div>

        {/* Instagram CTA */}
        <div style={{ marginTop: "1.75rem", display: "flex", justifyContent: "flex-end" }}>
          <a
            href="https://www.instagram.com/ramos_planejados01/"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-link-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.78rem",
              color: C.textSub,
              textDecoration: "none",
              letterSpacing: "0.04em",
            }}
          >
            Ver mais projetos no Instagram <ArrowRight size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}

function GalleryItem({
  src,
  alt,
  label,
  style,
  aspect,
  objectPosition = "center",
}: {
  src: string;
  alt: string;
  label: string;
  style: CSSProperties;
  aspect: string;
  objectPosition?: string;
}) {
  return (
    <Lightbox src={src} alt={alt} style={style}>
      <div
        style={{
          position: "relative",
          aspectRatio: aspect,
          overflow: "hidden",
          background: C.border,
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 60vw"
          style={{ objectFit: "cover", objectPosition }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "0.875rem",
            left: "0.875rem",
            padding: "0.3rem 0.7rem",
            background: "oklch(1 0 0 / 0.90)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <p
            style={{
              fontSize: "0.7rem",
              fontWeight: 500,
              color: C.text,
              letterSpacing: "0.04em",
              margin: 0,
            }}
          >
            {label}
          </p>
        </div>
      </div>
    </Lightbox>
  );
}

/* ── HOW IT WORKS ─────────────────────────────────────────────────────────── */

const steps = [
  {
    n: "01",
    title: "Sua ideia",
    description: "Cada projeto começa entendendo seu espaço, sua rotina e seu estilo.",
  },
  {
    n: "02",
    title: "Desenvolvimento",
    description: "Planejamos cada detalhe para unir funcionalidade, conforto e sofisticação.",
  },
  {
    n: "03",
    title: "Produção",
    description: "Móveis produzidos sob medida, com acabamento refinado e atenção em cada etapa.",
  },
  {
    n: "04",
    title: "Instalação",
    description: "Entrega e montagem realizadas com cuidado para um resultado impecável.",
  },
] as const;

function HowItWorks() {
  return (
    <section
      id="como-funciona"
      style={{ background: C.bg, padding: "7rem 2rem", borderTop: `1px solid ${C.border}` }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "4.5rem" }}>
          <span style={{ ...labelStyle, marginBottom: "1rem" }}>Do Pedido à Sua Casa</span>
          <h2
            className="font-heading"
            style={{
              fontSize: "clamp(1.9rem, 4.5vw, 3rem)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: C.text,
              lineHeight: 1.1,
            }}
          >
            Simples assim.
          </h2>
        </div>

        {/* Steps */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            borderTop: `1px solid ${C.border}`,
          }}
        >
          {steps.map((step, i) => (
            <div
              key={step.n}
              style={{
                padding: "2.25rem 1.75rem 2.25rem 0",
                paddingLeft: i > 0 ? "1.75rem" : "0",
                borderRight: i < steps.length - 1 ? `1px solid ${C.border}` : "none",
                display: "flex",
                flexDirection: "column",
                gap: "0.875rem",
              }}
            >
              <span
                className="font-heading"
                style={{ fontSize: "4.5rem", fontWeight: 500, color: C.text, lineHeight: 1 }}
              >
                {step.n}
              </span>
              <h3
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  color: C.text,
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                {step.title}
              </h3>
              <p style={{ fontSize: "0.975rem", lineHeight: 1.75, color: C.textSub, margin: 0 }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA bar */}
        <div
          style={{
            marginTop: "4rem",
            paddingTop: "2.5rem",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.95rem",
              color: C.textSub,
              maxWidth: "460px",
              lineHeight: 1.75,
              margin: 0,
            }}
          >
            Prefere conversar antes? Entre em contato diretamente pelo WhatsApp ou telefone, estamos
            à disposição.
          </p>
          <a
            href="#contato"
            className="landing-outline-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.72rem 1.5rem",
              border: `1px solid ${C.ink}`,
              color: C.ink,
              textDecoration: "none",
              fontSize: "0.78rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              borderRadius: "2px",
              whiteSpace: "nowrap",
            }}
          >
            <MessageCircle size={14} strokeWidth={1.5} />
            Entrar em contato
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── CONTACT ──────────────────────────────────────────────────────────────── */

function Contact() {
  return (
    <section id="contato" style={{ background: C.bg, padding: "7rem 2rem" }}>
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "4.5rem",
          alignItems: "start",
        }}
      >
        {/* Location card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          <div>
            <span style={{ ...labelStyle, marginBottom: "1.25rem" }}>Onde Estamos</span>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-start",
                marginBottom: "1rem",
              }}
            >
              <MapPin
                size={16}
                style={{ color: C.ink, flexShrink: 0, marginTop: "2px" }}
                strokeWidth={1.5}
              />
              <div>
                <p
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    color: C.text,
                    margin: "0 0 0.2rem",
                  }}
                >
                  Tremembé, SP
                </p>
                <p style={{ fontSize: "0.875rem", color: C.textSub, lineHeight: 1.6, margin: 0 }}>
                  Rua Santa Terezinha, 122
                  <br />
                  Vila Santo Antônio — Tremembé / SP
                </p>
              </div>
            </div>

            <a
              href="https://www.google.com/maps/@-22.9611993,-45.5389628,3a,75y,190.92h,87.86t/data=!3m7!1e1!3m5!1sWifxlWOYZ_xZJdmpG7Kzog!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D2.1390150515470623%26panoid%3DWifxlWOYZ_xZJdmpG7Kzog%26yaw%3D190.9214116211701!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="landing-link-cta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.78rem",
                fontWeight: 500,
                color: C.ink,
                textDecoration: "none",
                letterSpacing: "0.05em",
              }}
            >
              Ver no Google Maps <ArrowRight size={13} />
            </a>
          </div>

          {/* WhatsApp contacts */}
          <div
            style={{
              paddingTop: "1.75rem",
              borderTop: `1px solid ${C.border}`,
              display: "flex",
              flexDirection: "column",
              gap: "0.875rem",
            }}
          >
            <span style={{ ...labelStyle, marginBottom: "0.25rem" }}>WhatsApp</span>
            {[
              { name: "Anísio", number: "(12) 99786-1739", wa: "5512997861739" },
              { name: "William", number: "(12) 99158-1305", wa: "5512991581305" },
            ].map(({ name, number, wa }) => (
              <a
                key={wa}
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  textDecoration: "none",
                }}
              >
                <Phone size={14} style={{ color: C.textLight, flexShrink: 0 }} strokeWidth={1.5} />
                <div>
                  <span style={{ fontSize: "0.78rem", color: C.textLight, display: "block" }}>
                    {name}
                  </span>
                  <span style={{ fontSize: "0.9rem", color: C.textSub, fontWeight: 500 }}>
                    {number}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* CTA column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div>
            <span style={{ ...labelStyle, marginBottom: "1rem" }}>Fale Conosco</span>
            <h2
              className="font-heading"
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.6rem)",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                color: C.text,
                marginBottom: "1.25rem",
              }}
            >
              Pronto para criar
              <br />
              seu móvel?
            </h2>
            <p
              style={{ fontSize: "0.95rem", lineHeight: 1.8, color: C.textSub, maxWidth: "400px" }}
            >
              Descreva o que você imagina. Nossa equipe entra em contato em até 48 horas para
              discutir materiais, medidas e prazos.
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <Link href="/register" className="landing-btn-primary" style={btnPrimary}>
              Criar Conta Gratuita
            </Link>
            <Link href="/login" className="landing-btn-secondary" style={btnSecondary}>
              Já tenho conta
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FOOTER ───────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer
      style={{
        background: C.bg,
        borderTop: `1px solid ${C.border}`,
        padding: "3rem 2rem",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "2.5rem",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Image
            src="/imagens/logoPNG.png"
            alt="Ramos Planejados"
            width={44}
            height={44}
            style={{ objectFit: "contain" }}
          />
          <span
            className="font-heading"
            style={{ fontSize: "1rem", fontWeight: 500, color: C.text }}
          >
            Ramos Planejados
          </span>
          <p style={{ fontSize: "0.8rem", color: C.textLight, lineHeight: 1.6, margin: 0 }}>
            Móveis planejados sob medida
            <br />
            Tremembé · São Paulo
            <br />
            Atendemos em toda a região do estado de SP
          </p>
        </div>

        {/* Horário */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <span style={{ ...labelStyle, marginBottom: "0.25rem" }}>Horário</span>
          <p style={{ fontSize: "0.82rem", color: C.textSub, margin: 0 }}>
            Segunda à Sexta: 09h às 20h
          </p>
          <p style={{ fontSize: "0.82rem", color: C.textSub, margin: 0 }}>Sábado: 09h às 16h</p>
        </div>

        {/* Contact */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <span style={{ ...labelStyle, marginBottom: "0.25rem" }}>Contato</span>
          {[
            { name: "Anísio", number: "(12) 99786-1739", wa: "5512997861739" },
            { name: "William", number: "(12) 99158-1305", wa: "5512991581305" },
          ].map(({ name, number, wa }) => (
            <a
              key={wa}
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "0.82rem", color: C.textSub, textDecoration: "none" }}
            >
              {name}: {number}
            </a>
          ))}

          {/* Instagram */}
          <a
            href="https://www.instagram.com/ramos_planejados01/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram Ramos Planejados"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              marginTop: "0.25rem",
              color: C.textLight,
              textDecoration: "none",
              fontSize: "0.8rem",
              transition: "color 0.18s ease",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
            @ramos_planejados01
          </a>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "2rem auto 0",
          paddingTop: "1.5rem",
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <p style={{ fontSize: "0.76rem", color: C.textLight, margin: 0 }}>
          © 2026 Ramos Planejados. Todos os direitos reservados.
        </p>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <Link
            href="/login"
            style={{ fontSize: "0.76rem", color: C.textLight, textDecoration: "none" }}
          >
            Entrar
          </Link>
          <Link
            href="/register"
            style={{ fontSize: "0.76rem", color: C.textLight, textDecoration: "none" }}
          >
            Criar conta
          </Link>
        </div>
      </div>
    </footer>
  );
}

/* ── WHATSAPP FLOATING BUTTON ─────────────────────────────────────────────── */

function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/5512997861739"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar no WhatsApp"
      style={{
        position: "fixed",
        bottom: "1.75rem",
        right: "1.75rem",
        zIndex: 100,
        width: "52px",
        height: "52px",
        borderRadius: "50%",
        background: "#25D366",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 16px oklch(0 0 0 / 0.18)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {/* WhatsApp SVG */}
      <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}

/* ── PAGE ─────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <>
      <HomeNavBar />
      <main>
        <Hero />
        <ManifestoStrip />
        <Philosophy />
        <HowItWorks />
        <Gallery />
        <Differentials />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
