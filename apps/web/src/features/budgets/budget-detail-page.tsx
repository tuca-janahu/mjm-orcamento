import axios from "axios";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { api } from "../../lib/api";
import type { BudgetDto } from "../../lib/api-types";
import { formatCurrency, formatDate, labelFromEnum } from "../../lib/format";
import { statusBadgeClass, ui } from "../../lib/ui";

const optionLabels: Record<string, string> = {
  LANDING_PAGE: "Landing page",
  INSTITUCIONAL: "Site institucional",
  PORTAL_CONTEUDO: "Portal de conteúdo",
  CLIENT_PROVIDES_READY: "Cliente fornece conteúdo pronto",
  MJM_MIGRATES_EXISTING: "MJM migra conteúdo existente",
  MJM_PRODUCES_CONTENT: "MJM produz o conteúdo",
  CLIENT_PROVIDED: "Design fornecido pelo cliente",
  TEMPLATE_CUSTOMIZATION: "Adaptação de template",
  CUSTOM_DESIGN: "Design personalizado",
  NONE: "Nenhum",
  STANDARD_CMS: "CMS padrão",
  CUSTOM_ADMIN: "Painel administrativo personalizado",
  SIMPLE: "Simples",
  STANDARD: "Padrão",
  COMPLEX: "Complexa",
  BLOG: "Blog",
  SITE_SEARCH: "Busca interna",
  TECHNICAL_BASELINE: "Base técnica",
  ON_PAGE_SETUP: "Configuração on-page",
  CONTENT_STRATEGY: "Estratégia de conteúdo",
  CLIENT_MANAGED: "Gerenciado pelo cliente",
  NEW_REGISTRATION: "Novo registro",
  TRANSFER: "Transferência",
  CONFIGURATION_ONLY: "Somente configuração",
  MJM_STANDARD: "Hospedagem MJM padrão",
  MJM_MANAGED: "Hospedagem gerenciada pela MJM",
  ESSENTIAL: "Essencial",
  CUSTOM: "Personalizado",
  MODERATE: "Moderado",
  HIGH: "Alto",
};

function optionLabel(value: string): string {
  return optionLabels[value] ?? labelFromEnum(value);
}

function formatTargetDate(value?: string): string {
  if (!value) return "Não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function ScopeRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-zinc-200 pb-2.5">
      <dt className="text-[0.6875rem] text-zinc-500">{label}</dt>
      <dd className="m-0 max-w-[65%] text-right text-xs font-semibold break-words">
        {children}
      </dd>
    </div>
  );
}

function ScopeGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3 border-t border-zinc-300 pt-4 first:border-t-0 first:pt-0">
      <h3 className="m-0 text-[0.5625rem] font-bold tracking-[0.12em] text-zinc-500 uppercase">
        {title}
      </h3>
      <dl className="m-0 grid gap-3">{children}</dl>
    </section>
  );
}

interface ApiErrorBody {
  error?: { message?: string };
}

export function BudgetDetailPage() {
  const { id } = useParams();
  const [budget, setBudget] = useState<BudgetDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"recalculate" | "finalize" | null>(null);

  useEffect(() => {
    if (id === undefined) return;
    void api
      .get<{ budget: BudgetDto }>(`/budgets/${id}`)
      .then(({ data }) => setBudget(data.budget))
      .catch(() => setError("Não foi possível carregar o orçamento."));
  }, [id]);

  async function runAction(kind: "recalculate" | "finalize"): Promise<void> {
    if (id === undefined) return;
    setError(null);
    setAction(kind);
    try {
      const { data } = await api.post<{ budget: BudgetDto }>(
        `/budgets/${id}/${kind}`,
      );
      setBudget(data.budget);
    } catch (caught) {
      setError(
        axios.isAxiosError<ApiErrorBody>(caught)
          ? (caught.response?.data.error?.message ??
              "Não foi possível atualizar o orçamento.")
          : "Não foi possível atualizar o orçamento.",
      );
    } finally {
      setAction(null);
    }
  }

  if (error && budget === null)
    return (
      <div className={ui.pageContent}>
        <div className={ui.error}>{error}</div>
      </div>
    );
  if (budget === null)
    return <div className={ui.loading}>Carregando orçamento...</div>;

  const oneTimeItems = budget.items.filter((item) => !item.recurring);
  const recurringItems = budget.items.filter((item) => item.recurring);
  const scope = budget.inputData;

  return (
    <div className={ui.pageContent}>
      <header className={ui.pageHeading}>
        <div>
          <p className={ui.eyebrow}>
            <Link
              className="text-inherit"
              to={`/projects/${budget.project.id}`}
            >
              {budget.project.name}
            </Link>{" "}
            / Versão {budget.versionNumber}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className={ui.pageTitle}>Orçamento V{budget.versionNumber}</h1>
            <span className={statusBadgeClass(budget.status)}>
              {labelFromEnum(budget.status)}
            </span>
          </div>
          <p className={ui.subtitle}>
            Criado por {budget.createdBy.name} em {formatDate(budget.createdAt)}
            .
          </p>
        </div>
        {budget.status === "RASCUNHO" && (
          <div className="flex w-full flex-wrap items-center gap-2.5 lg:w-auto">
            <Link
              className={ui.secondaryAction}
              to={`/budgets/${budget.id}/edit`}
            >
              Editar
            </Link>
            <button
              className={ui.secondaryAction}
              disabled={action !== null}
              type="button"
              onClick={() => void runAction("recalculate")}
            >
              {action === "recalculate" ? "Recalculando..." : "Recalcular"}
            </button>
            <button
              className={ui.primaryAction}
              disabled={action !== null}
              type="button"
              onClick={() => void runAction("finalize")}
            >
              {action === "finalize" ? "Finalizando..." : "Finalizar"}{" "}
              <span>→</span>
            </button>
          </div>
        )}
      </header>
      {error && <div className={ui.error}>{error}</div>}

      <section className="mb-6 grid grid-cols-1 border-t border-l border-zinc-300 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1.4fr]">
        <div className="grid min-h-36 content-between border-r border-b border-zinc-300 bg-white p-5">
          <span className="text-[0.625rem] font-bold tracking-[0.1em] text-zinc-500 uppercase">
            Total do projeto
          </span>
          <strong className="text-3xl tracking-[-0.05em] sm:text-4xl">
            {formatCurrency(budget.finalTotal)}
          </strong>
          <small className="text-[0.6875rem] text-zinc-500">
            Subtotal de {formatCurrency(budget.subtotal)}
          </small>
        </div>
        <div className="grid min-h-36 content-between border-r border-b border-zinc-300 bg-white p-5">
          <span className="text-[0.625rem] font-bold tracking-[0.1em] text-zinc-500 uppercase">
            Mensal recorrente
          </span>
          <strong className="text-3xl tracking-[-0.05em] sm:text-4xl">
            {formatCurrency(budget.monthlyRecurringTotal)}
          </strong>
          <small className="text-[0.6875rem] text-zinc-500">
            Hospedagem e manutenção
          </small>
        </div>
        <dl className="m-0 grid min-h-auto content-center gap-2.5 border-r border-b border-zinc-300 bg-white p-5 md:col-span-2 xl:col-span-1 xl:min-h-36">
          <div className="flex justify-between gap-5">
            <dt className="text-[0.6875rem] text-zinc-500">Complexidade</dt>
            <dd className="m-0 text-xs font-semibold">
              {Number(budget.complexityMultiplier).toFixed(2)}×
            </dd>
          </div>
          <div className="flex justify-between gap-5">
            <dt className="text-[0.6875rem] text-zinc-500">
              Urgência calculada
            </dt>
            <dd className="m-0 text-xs font-semibold">
              {Number(budget.urgencyMultiplier).toFixed(2)}×
            </dd>
          </div>
          <div className="flex justify-between gap-5">
            <dt className="text-[0.6875rem] text-zinc-500">Desconto</dt>
            <dd className="m-0 text-xs font-semibold">
              {Number(budget.discountPercentage).toFixed(2)}%
            </dd>
          </div>
        </dl>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)]">
        <div className={ui.panel}>
          <header className={ui.panelHeader}>
            <div>
              <p className={ui.eyebrow}>Detalhamento</p>
              <h2 className="mt-2 mb-0 text-lg tracking-tight">
                Itens do projeto
              </h2>
            </div>
            <span className={ui.moduleStatus}>{oneTimeItems.length} itens</span>
          </header>
          {oneTimeItems.map((item) => (
            <div
              className="flex min-h-15 items-center justify-between gap-6 border-b border-zinc-200 px-5 py-3"
              key={item.id}
            >
              <span className="grid gap-1">
                <strong className="text-xs">{item.name}</strong>
                <small className="text-[0.6875rem] text-zinc-500">
                  {item.quantity > 1
                    ? `${item.quantity} × ${formatCurrency(item.unitPrice)}`
                    : labelFromEnum(item.category)}
                </small>
              </span>
              <strong className="text-xs">
                {formatCurrency(item.totalPrice)}
              </strong>
            </div>
          ))}
          {recurringItems.length > 0 && (
            <>
              <div className="bg-zinc-50 px-5 py-2.5 text-[0.5625rem] font-bold tracking-[0.12em] text-zinc-500 uppercase">
                Recorrência mensal
              </div>
              {recurringItems.map((item) => (
                <div
                  className="flex min-h-15 items-center justify-between gap-6 border-b border-zinc-200 bg-sky-50 px-5 py-3"
                  key={item.id}
                >
                  <span className="grid gap-1">
                    <strong className="text-xs">{item.name}</strong>
                    <small className="text-[0.6875rem] text-zinc-500">
                      {item.description ?? "Cobrança mensal"}
                    </small>
                  </span>
                  <strong className="text-xs">
                    {formatCurrency(item.totalPrice)}
                  </strong>
                </div>
              ))}
            </>
          )}
        </div>

        <aside className="grid content-start gap-5 border border-zinc-300 bg-white p-5.5">
          <div>
            <p className={ui.eyebrow}>Escopo informado</p>
            <h2 className="mt-2 mb-0 text-xl">Website</h2>
          </div>

          <ScopeGroup title="Estrutura">
            <ScopeRow label="Categoria">
              {optionLabel(scope.websiteCategory)}
            </ScopeRow>
            {scope.websiteCategory === "LANDING_PAGE" ? (
              <ScopeRow label="Seções">{scope.sectionCount}</ScopeRow>
            ) : (
              <>
                <ScopeRow label="Páginas">{scope.pageCount}</ScopeRow>
                <ScopeRow label="Layouts únicos">
                  {scope.uniqueLayoutCount}
                </ScopeRow>
              </>
            )}
            <ScopeRow label="Idiomas">{scope.languageCount}</ScopeRow>
            <ScopeRow label="Lançamento desejado">
              {formatTargetDate(scope.targetLaunchDate)}
            </ScopeRow>
          </ScopeGroup>

          <ScopeGroup title="Conteúdo e design">
            <ScopeRow label="Conteúdo">
              {optionLabel(scope.contentResponsibility)}
            </ScopeRow>
            <ScopeRow label="Conteúdos a migrar">
              {scope.contentMigrationCount}
            </ScopeRow>
            <ScopeRow label="Design">
              {optionLabel(scope.designApproach)}
            </ScopeRow>
            <ScopeRow label="Gestão de conteúdo">
              {optionLabel(scope.contentManagement)}
            </ScopeRow>
          </ScopeGroup>

          <ScopeGroup title="Funcionalidades">
            <ScopeRow label="Formulários simples">
              {scope.simpleFormCount}
            </ScopeRow>
            <ScopeRow label="Formulários avançados">
              {scope.advancedFormCount}
            </ScopeRow>
            <ScopeRow label="Módulos">
              {scope.additionalModules.length > 0
                ? scope.additionalModules.map(optionLabel).join(", ")
                : "Nenhum"}
            </ScopeRow>
            <ScopeRow label="Integrações">{scope.integrations.length}</ScopeRow>
            {scope.integrations.map((integration, index) => (
              <ScopeRow
                label={`Integração ${index + 1}`}
                key={`${integration.name}-${index}`}
              >
                {integration.name} · {optionLabel(integration.complexity)}
              </ScopeRow>
            ))}
          </ScopeGroup>

          <ScopeGroup title="Entrega e operação">
            <ScopeRow label="SEO">{optionLabel(scope.seoLevel)}</ScopeRow>
            <ScopeRow label="Domínio">
              {optionLabel(scope.domainService)}
            </ScopeRow>
            <ScopeRow label="Hospedagem">
              {optionLabel(scope.hostingPlan)}
            </ScopeRow>
            <ScopeRow label="Manutenção">
              {optionLabel(scope.maintenancePlan)}
            </ScopeRow>
          </ScopeGroup>

          <ScopeGroup title="Ajustes comerciais">
            <ScopeRow label="Complexidade">
              {optionLabel(scope.complexityAdjustment)}
            </ScopeRow>
            <ScopeRow label="Motivo da complexidade">
              {scope.complexityReason || "Não se aplica"}
            </ScopeRow>
            <ScopeRow label="Desconto">
              {scope.discountPercentage.toFixed(2)}%
            </ScopeRow>
            <ScopeRow label="Motivo do desconto">
              {scope.discountReason || "Não se aplica"}
            </ScopeRow>
          </ScopeGroup>

          {budget.notes && (
            <div className="border-t border-zinc-300 pt-4.5">
              <span className="text-[0.5625rem] font-bold tracking-[0.1em] text-zinc-500 uppercase">
                Observações
              </span>
              <p className="mt-2 mb-0 whitespace-pre-wrap text-xs leading-relaxed text-zinc-600">
                {budget.notes}
              </p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
