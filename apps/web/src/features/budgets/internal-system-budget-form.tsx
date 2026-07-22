import { zodResolver } from "@hookform/resolvers/zod";
import type { InternalSystemBudgetInput } from "@mjm/shared";
import axios from "axios";
import { useEffect, useState } from "react";
import { FormProvider, type Resolver, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";
import { ConfirmDialog } from "../../components/confirm-dialog";
import { api } from "../../lib/api";
import type { BudgetDto, ProjectSummary } from "../../lib/api-types";
import { formatCurrency } from "../../lib/format";
import { ui } from "../../lib/ui";
import { AccessProcessesSection } from "./internal-system-form/access-processes-section";
import { CommercialSection } from "./internal-system-form/commercial-section";
import {
  internalSystemBudgetFormSchema,
  internalSystemDefaultValues,
  type InternalSystemBudgetFormValues,
} from "./internal-system-form/config";
import { DataIntegrationsSection } from "./internal-system-form/data-integrations-section";
import { StructureSection } from "./internal-system-form/structure-section";

interface ApiErrorBody {
  error?: { message?: string };
}

function FinancialSummary({
  budget,
  stale,
}: {
  budget: BudgetDto<InternalSystemBudgetInput> | null;
  stale: boolean;
}) {
  if (budget === null) {
    return (
      <section className={ui.panel} aria-label="Resumo financeiro">
        <header className={ui.panelHeader}>
          <div>
            <p className={ui.eyebrow}>Resumo financeiro</p>
            <h2 className="mt-2 mb-0 text-lg tracking-tight">
              Disponível após salvar
            </h2>
          </div>
        </header>
        <p className="m-0 px-5 py-4 text-xs leading-relaxed text-zinc-500">
          A API calculará os itens, os multiplicadores, o total inicial e as
          recorrências ao salvar o rascunho.
        </p>
      </section>
    );
  }

  const oneTimeItems = budget.items.filter((item) => !item.recurring);
  const recurringItems = budget.items.filter((item) => item.recurring);

  return (
    <section className={ui.panel} aria-label="Resumo financeiro">
      <header className={ui.panelHeader}>
        <div>
          <p className={ui.eyebrow}>Resumo financeiro</p>
          <h2 className="mt-2 mb-0 text-lg tracking-tight">
            Último cálculo salvo
          </h2>
        </div>
        {stale && (
          <span className="text-[0.6875rem] text-amber-700">
            O escopo foi alterado e será recalculado ao salvar.
          </span>
        )}
      </header>

      <div className="grid grid-cols-1 border-b border-zinc-200 md:grid-cols-2 xl:grid-cols-4">
        <div className="grid gap-2 border-r border-zinc-200 p-4">
          <span className="text-[0.5625rem] font-bold tracking-[0.1em] text-zinc-500 uppercase">
            Subtotal
          </span>
          <strong className="text-lg">{formatCurrency(budget.subtotal)}</strong>
        </div>
        <div className="grid gap-2 border-r border-zinc-200 p-4">
          <span className="text-[0.5625rem] font-bold tracking-[0.1em] text-zinc-500 uppercase">
            Multiplicadores
          </span>
          <strong className="text-xs">
            {Number(budget.complexityMultiplier).toFixed(2)}× complexidade ·{" "}
            {Number(budget.urgencyMultiplier).toFixed(2)}× urgência
          </strong>
        </div>
        <div className="grid gap-2 border-r border-zinc-200 p-4">
          <span className="text-[0.5625rem] font-bold tracking-[0.1em] text-zinc-500 uppercase">
            Total inicial
          </span>
          <strong className="text-lg">
            {formatCurrency(budget.finalTotal)}
          </strong>
          <small className="text-[0.6875rem] text-zinc-500">
            Desconto de {Number(budget.discountPercentage).toFixed(2)}%
          </small>
        </div>
        <div className="grid gap-2 p-4">
          <span className="text-[0.5625rem] font-bold tracking-[0.1em] text-zinc-500 uppercase">
            Total mensal
          </span>
          <strong className="text-lg">
            {formatCurrency(budget.monthlyRecurringTotal)}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2">
        <div className="border-r border-zinc-200">
          <div className="bg-zinc-50 px-5 py-2.5 text-[0.5625rem] font-bold tracking-[0.12em] text-zinc-500 uppercase">
            Itens pontuais
          </div>
          {oneTimeItems.map((item) => (
            <div
              className="flex items-center justify-between gap-4 border-t border-zinc-200 px-5 py-3"
              key={item.id}
            >
              <span className="grid gap-1">
                <strong className="text-xs">{item.name}</strong>
                <small className="text-[0.6875rem] text-zinc-500">
                  {item.quantity} × {formatCurrency(item.unitPrice)}
                </small>
              </span>
              <strong className="text-xs">
                {formatCurrency(item.totalPrice)}
              </strong>
            </div>
          ))}
        </div>
        <div>
          <div className="bg-zinc-50 px-5 py-2.5 text-[0.5625rem] font-bold tracking-[0.12em] text-zinc-500 uppercase">
            Recorrências mensais
          </div>
          {recurringItems.length === 0 ? (
            <p className="m-0 border-t border-zinc-200 px-5 py-4 text-xs text-zinc-500">
              Nenhuma recorrência selecionada.
            </p>
          ) : (
            recurringItems.map((item) => (
              <div
                className="flex items-center justify-between gap-4 border-t border-zinc-200 px-5 py-3"
                key={item.id}
              >
                <strong className="text-xs">{item.name}</strong>
                <strong className="text-xs">
                  {formatCurrency(item.totalPrice)}
                </strong>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export function InternalSystemBudgetForm() {
  const { projectId, id } = useParams();
  const editing = id !== undefined;
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [budgetSnapshot, setBudgetSnapshot] =
    useState<BudgetDto<InternalSystemBudgetInput> | null>(null);
  const [loading, setLoading] = useState(editing);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingFinalizeValues, setPendingFinalizeValues] =
    useState<InternalSystemBudgetFormValues | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [persistedFinalizeBudgetId, setPersistedFinalizeBudgetId] = useState<
    string | null
  >(null);
  const [creationIdempotencyKey] = useState(() => crypto.randomUUID());
  const methods = useForm<InternalSystemBudgetFormValues>({
    resolver: zodResolver(
      internalSystemBudgetFormSchema,
    ) as Resolver<InternalSystemBudgetFormValues>,
    defaultValues: internalSystemDefaultValues,
  });
  const {
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = methods;

  useEffect(() => {
    if (editing && id !== undefined) {
      void api
        .get<{ budget: BudgetDto<InternalSystemBudgetInput> }>(
          `/budgets/${id}`,
        )
        .then(({ data }) => {
          if (data.budget.status !== "RASCUNHO") {
            void navigate(`/budgets/${id}`, { replace: true });
            return;
          }

          reset({
            inputData: data.budget.inputData,
            ...(data.budget.notes === null
              ? {}
              : { notes: data.budget.notes }),
          });
          setBudgetSnapshot(data.budget);
          setProject({
            ...data.budget.project,
            clientName: null,
            description: null,
            status: "PROSPECCAO",
            notes: null,
            createdAt: data.budget.createdAt,
            updatedAt: data.budget.updatedAt,
            responsibleUser: data.budget.createdBy,
            _count: { budgets: 0 },
          });
        })
        .catch(() => setServerError("Não foi possível carregar o orçamento."))
        .finally(() => setLoading(false));
    } else if (projectId !== undefined) {
      void api
        .get<{ project: ProjectSummary }>(`/projects/${projectId}`)
        .then(({ data }) => setProject(data.project))
        .catch(() => setServerError("Não foi possível carregar o projeto."));
    }
  }, [editing, id, navigate, projectId, reset]);

  async function persistDraft(
    values: InternalSystemBudgetFormValues,
  ): Promise<BudgetDto<InternalSystemBudgetInput>> {
    if (editing) {
      const response = await api.patch<{
        budget: BudgetDto<InternalSystemBudgetInput>;
      }>(`/budgets/${id}`, values);
      return response.data.budget;
    }

    try {
      const response = await api.post<{
        budget: BudgetDto<InternalSystemBudgetInput>;
      }>(`/projects/${projectId}/budgets`, values, {
        headers: { "Idempotency-Key": creationIdempotencyKey },
      });
      return response.data.budget;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response === undefined) {
        try {
          const recovered = await api.get<{
            budget: BudgetDto<InternalSystemBudgetInput>;
          }>(`/budgets/${creationIdempotencyKey}`);
          return recovered.data.budget;
        } catch {
          // A mesma chave sera reutilizada se a criacao nao tiver sido persistida.
        }
      }
      throw error;
    }
  }

  function budgetErrorMessage(error: unknown, fallback: string): string {
    return axios.isAxiosError<ApiErrorBody>(error)
      ? (error.response?.data.error?.message ?? fallback)
      : fallback;
  }

  const saveDraft = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const budget = await persistDraft(values);
      setBudgetSnapshot(budget);
      void navigate(`/budgets/${budget.id}`);
    } catch (error) {
      setServerError(
        budgetErrorMessage(error, "Não foi possível salvar o orçamento."),
      );
    }
  });

  const requestFinalize = handleSubmit((values) => {
    setServerError(null);
    setFinalizeError(null);
    setPersistedFinalizeBudgetId(null);
    setPendingFinalizeValues(values);
  });

  async function finalizeBudget(): Promise<void> {
    if (pendingFinalizeValues === null) return;

    setFinalizeError(null);
    setFinalizing(true);
    try {
      let budgetId = persistedFinalizeBudgetId;
      if (budgetId === null) {
        const draft = await persistDraft(pendingFinalizeValues);
        budgetId = draft.id;
        setPersistedFinalizeBudgetId(budgetId);
      }

      try {
        await api.post(`/budgets/${budgetId}/finalize`);
      } catch (error) {
        try {
          const recovered = await api.get<{
            budget: BudgetDto<InternalSystemBudgetInput>;
          }>(`/budgets/${budgetId}`);
          if (recovered.data.budget.status !== "FINALIZADO") throw error;
        } catch {
          throw error;
        }
      }

      setPendingFinalizeValues(null);
      setPersistedFinalizeBudgetId(null);
      void navigate(`/budgets/${budgetId}`);
    } catch (error) {
      setFinalizeError(
        budgetErrorMessage(error, "Não foi possível finalizar o orçamento."),
      );
    } finally {
      setFinalizing(false);
    }
  }

  function closeFinalizeDialog(): void {
    if (finalizing) return;

    const draftId = persistedFinalizeBudgetId;
    setPendingFinalizeValues(null);
    setPersistedFinalizeBudgetId(null);
    setFinalizeError(null);
    if (!editing && draftId !== null) void navigate(`/budgets/${draftId}`);
  }

  if (loading) return <div className={ui.loading}>Carregando orçamento...</div>;

  const backTarget =
    editing && id !== undefined
      ? `/budgets/${id}`
      : projectId !== undefined
        ? `/projects/${projectId}`
        : "/projects";

  return (
    <div className={ui.pageContent}>
      <header className={ui.pageHeading}>
        <div>
          <Link className={`${ui.secondaryAction} mb-5`} to={backTarget}>
            ← Voltar
          </Link>
          <p className={ui.eyebrow}>
            {editing
              ? "Orçamentos / Editar rascunho"
              : "Orçamentos / Nova versão"}
          </p>
          <h1 className={ui.pageTitle}>
            {editing ? "Editar orçamento" : "Novo orçamento"}
          </h1>
          <p className={ui.subtitle}>
            {project?.name ?? "Projeto de sistema interno"} · aplicação para
            colaboradores executarem e controlarem processos internos. Os
            valores serão calculados pela API ao salvar.
          </p>
        </div>
      </header>

      <FormProvider {...methods}>
        <form className={ui.form} onSubmit={saveDraft} noValidate>
          <StructureSection />
          <AccessProcessesSection />
          <DataIntegrationsSection />
          <CommercialSection />

          <FinancialSummary budget={budgetSnapshot} stale={isDirty} />

          {serverError && (
            <div className={ui.error} role="alert">
              {serverError}
            </div>
          )}

          <footer className={`${ui.formActions} flex-wrap`}>
            <Link className={ui.secondaryAction} to={backTarget}>
              ← Voltar
            </Link>
            <button
              className={`${ui.secondaryAction} min-w-40`}
              disabled={isSubmitting || finalizing}
              type="submit"
            >
              {isSubmitting ? "Salvando..." : "Salvar rascunho"}
            </button>
            <button
              className={`${ui.primaryAction} min-w-48`}
              disabled={isSubmitting || finalizing}
              type="button"
              onClick={() => void requestFinalize()}
            >
              Finalizar orçamento
            </button>
          </footer>
        </form>
      </FormProvider>

      <ConfirmDialog
        open={pendingFinalizeValues !== null}
        title="Finalizar orçamento?"
        description="Após a finalização, este orçamento ficará congelado e não poderá mais ser editado diretamente."
        confirmLabel="Finalizar orçamento"
        tone="primary"
        loading={finalizing}
        error={finalizeError}
        onClose={closeFinalizeDialog}
        onConfirm={() => void finalizeBudget()}
      />
    </div>
  );
}
