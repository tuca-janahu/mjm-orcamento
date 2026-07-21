import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ConfirmDialog } from "../../components/confirm-dialog";
import { api } from "../../lib/api";
import type { BudgetDto } from "../../lib/api-types";
import { formatCurrency, formatDate, labelFromEnum } from "../../lib/format";
import { statusBadgeClass, ui } from "../../lib/ui";
import { WebPlatformBudgetScope } from "./web-platform-budget-scope";
import { WebsiteBudgetScope } from "./website-budget-scope";

interface ApiErrorBody {
  error?: { message?: string };
}

function ScopeDetails({ budget }: { budget: BudgetDto }) {
  if (
    budget.project.applicationType === "WEBSITE" &&
    "websiteCategory" in budget.inputData
  ) {
    return (
      <WebsiteBudgetScope scope={budget.inputData} notes={budget.notes} />
    );
  }

  if (
    budget.project.applicationType === "PLATAFORMA_WEB" &&
    "platformCategory" in budget.inputData
  ) {
    return (
      <WebPlatformBudgetScope scope={budget.inputData} notes={budget.notes} />
    );
  }

  return (
    <aside className="grid content-start gap-3 border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      <strong>Escopo incompatível</strong>
      <span>
        Os dados deste orçamento não correspondem ao tipo atual do projeto.
      </span>
    </aside>
  );
}

export function BudgetDetailPage() {
  const { id } = useParams();
  const [budget, setBudget] = useState<BudgetDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"recalculate" | "finalize" | null>(null);
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);

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
    if (kind === "finalize") setFinalizeError(null);
    setAction(kind);
    try {
      const { data } = await api.post<{ budget: BudgetDto }>(
        `/budgets/${id}/${kind}`,
      );
      setBudget(data.budget);
      if (kind === "finalize") setFinalizeDialogOpen(false);
    } catch (caught) {
      if (kind === "finalize") {
        try {
          const recovered = await api.get<{ budget: BudgetDto }>(
            `/budgets/${id}`,
          );
          if (recovered.data.budget.status === "FINALIZADO") {
            setBudget(recovered.data.budget);
            setFinalizeDialogOpen(false);
            return;
          }
        } catch {
          // O modal permanece aberto e o endpoint aceita um novo retry seguro.
        }
      }

      const message =
        axios.isAxiosError<ApiErrorBody>(caught)
          ? (caught.response?.data.error?.message ??
              "Não foi possível atualizar o orçamento.")
          : "Não foi possível atualizar o orçamento.";
      if (kind === "finalize") setFinalizeError(message);
      else setError(message);
    } finally {
      setAction(null);
    }
  }

  if (error && budget === null) {
    return (
      <div className={ui.pageContent}>
        <div className={ui.error}>{error}</div>
      </div>
    );
  }

  if (budget === null) {
    return <div className={ui.loading}>Carregando orçamento...</div>;
  }

  const oneTimeItems = budget.items.filter((item) => !item.recurring);
  const recurringItems = budget.items.filter((item) => item.recurring);

  return (
    <div className={ui.pageContent}>
      <Link
        className={`${ui.secondaryAction} mt-6`}
        to={`/projects/${budget.project.id}`}
      >
        ← Voltar ao projeto
      </Link>
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
            Criado por {budget.createdBy.name} em {formatDate(budget.createdAt)}.
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
              onClick={() => {
                setFinalizeError(null);
                setFinalizeDialogOpen(true);
              }}
            >
              Finalizar orçamento
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

        <ScopeDetails budget={budget} />
      </section>

      <ConfirmDialog
        open={finalizeDialogOpen}
        title="Finalizar orçamento?"
        description="Após a finalização, este orçamento ficará congelado e não poderá mais ser editado diretamente."
        confirmLabel="Finalizar orçamento"
        tone="primary"
        loading={action === "finalize"}
        error={finalizeError}
        onClose={() => {
          if (action === "finalize") return;
          setFinalizeError(null);
          setFinalizeDialogOpen(false);
        }}
        onConfirm={() => void runAction("finalize")}
      />
    </div>
  );
}
