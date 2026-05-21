import { type OrderStatus } from "@/lib/api";

const labels: Record<OrderStatus, string> = {
  AGUARDANDO_ANALISE: "Aguardando análise",
  EM_ORCAMENTO: "Em orçamento",
  APROVADO: "Aprovado",
  EM_PRODUCAO: "Em produção",
  INSTALACAO_AGENDADA: "Instalação agendada",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const styles: Record<OrderStatus, string> = {
  AGUARDANDO_ANALISE: "bg-[var(--status-analise-bg)] text-[var(--status-analise-fg)]",
  EM_ORCAMENTO: "bg-[var(--status-orcamento-bg)] text-[var(--status-orcamento-fg)]",
  APROVADO: "bg-[var(--status-aprovado-bg)] text-[var(--status-aprovado-fg)]",
  EM_PRODUCAO: "bg-[var(--status-producao-bg)] text-[var(--status-producao-fg)]",
  INSTALACAO_AGENDADA: "bg-[var(--status-instalacao-bg)] text-[var(--status-instalacao-fg)]",
  CONCLUIDO: "bg-[var(--status-concluido-bg)] text-[var(--status-concluido-fg)]",
  CANCELADO: "bg-[var(--status-cancelado-bg)] text-[var(--status-cancelado-fg)]",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide whitespace-nowrap ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export { labels as STATUS_LABELS };
