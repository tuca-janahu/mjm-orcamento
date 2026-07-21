import { zodResolver } from "@hookform/resolvers/zod";
import type { WebPlatformBudgetInput } from "@mjm/shared";
import axios from "axios";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";
import { ConfirmDialog } from "../../components/confirm-dialog";
import { api } from "../../lib/api";
import type { BudgetDto, ProjectSummary } from "../../lib/api-types";
import { ui } from "../../lib/ui";
import { CommercialSection } from "./web-platform-form/commercial-section";
import {
  webPlatformBudgetFormSchema,
  webPlatformDefaultValues,
  type WebPlatformBudgetFormValues,
} from "./web-platform-form/config";
import { IntegrationsSection } from "./web-platform-form/integrations-section";
import { ProductSection } from "./web-platform-form/product-section";
import { ResourcesSection } from "./web-platform-form/resources-section";
import { StructureSection } from "./web-platform-form/structure-section";

interface ApiErrorBody {
  error?: { message?: string };
}

export function WebPlatformBudgetForm() {
  const { projectId, id } = useParams();
  const editing = id !== undefined;
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(editing);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingFinalizeValues, setPendingFinalizeValues] =
    useState<WebPlatformBudgetFormValues | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [persistedFinalizeBudgetId, setPersistedFinalizeBudgetId] = useState<
    string | null
  >(null);
  const [creationIdempotencyKey] = useState(() => crypto.randomUUID());
  const methods = useForm<WebPlatformBudgetFormValues>({
    resolver: zodResolver(webPlatformBudgetFormSchema),
    defaultValues: webPlatformDefaultValues,
  });
  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (editing && id !== undefined) {
      void api
        .get<{ budget: BudgetDto<WebPlatformBudgetInput> }>(`/budgets/${id}`)
        .then(({ data }) => {
          if (data.budget.status !== "RASCUNHO") {
            void navigate(`/budgets/${id}`, { replace: true });
            return;
          }

          reset({
            inputData: data.budget.inputData,
            ...(data.budget.notes === null ? {} : { notes: data.budget.notes }),
          });
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
    values: WebPlatformBudgetFormValues,
  ): Promise<BudgetDto<WebPlatformBudgetInput>> {
    if (editing) {
      const response = await api.patch<{
        budget: BudgetDto<WebPlatformBudgetInput>;
      }>(`/budgets/${id}`, values);
      return response.data.budget;
    }

    try {
      const response = await api.post<{
        budget: BudgetDto<WebPlatformBudgetInput>;
      }>(`/projects/${projectId}/budgets`, values, {
        headers: { "Idempotency-Key": creationIdempotencyKey },
      });
      return response.data.budget;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response === undefined) {
        try {
          const recovered = await api.get<{
            budget: BudgetDto<WebPlatformBudgetInput>;
          }>(`/budgets/${creationIdempotencyKey}`);
          return recovered.data.budget;
        } catch {
          // O retry reutilizara a mesma chave se a criacao nao tiver sido persistida.
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
            budget: BudgetDto<WebPlatformBudgetInput>;
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
          <Link
            className={`${ui.secondaryAction} mb-5`}
            to={backTarget}
          >
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
            {project?.name ?? "Projeto de plataforma web"} · os valores serão
            calculados pela API ao salvar.
          </p>
        </div>
      </header>

      <FormProvider {...methods}>
        <form className={ui.form} onSubmit={saveDraft} noValidate>
          <StructureSection />
          <ProductSection />
          <ResourcesSection />
          <IntegrationsSection />
          <CommercialSection />

          {serverError && <div className={ui.error}>{serverError}</div>}

          <footer className={`${ui.formActions} flex-wrap`}>
            <Link
              className={ui.secondaryAction}
              to={backTarget}
            >
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
