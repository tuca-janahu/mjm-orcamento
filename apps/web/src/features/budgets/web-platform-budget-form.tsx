import { zodResolver } from "@hookform/resolvers/zod";
import type { WebPlatformBudgetInput } from "@mjm/shared";
import axios from "axios";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";
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

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const response = editing
        ? await api.patch<{ budget: BudgetDto<WebPlatformBudgetInput> }>(
            `/budgets/${id}`,
            values,
          )
        : await api.post<{ budget: BudgetDto<WebPlatformBudgetInput> }>(
            `/projects/${projectId}/budgets`,
            values,
          );
      void navigate(`/budgets/${response.data.budget.id}`);
    } catch (error) {
      setServerError(
        axios.isAxiosError<ApiErrorBody>(error)
          ? (error.response?.data.error?.message ??
              "Não foi possível salvar o orçamento.")
          : "Não foi possível salvar o orçamento.",
      );
    }
  });

  if (loading) return <div className={ui.loading}>Carregando orçamento...</div>;

  return (
    <div className={ui.pageContent}>
      <header className={ui.pageHeading}>
        <div>
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
        <form className={ui.form} onSubmit={submit} noValidate>
          <StructureSection />
          <ProductSection />
          <ResourcesSection />
          <IntegrationsSection />
          <CommercialSection />

          {serverError && <div className={ui.error}>{serverError}</div>}

          <footer className={ui.formActions}>
            <Link
              className={ui.secondaryAction}
              to={
                editing && id !== undefined
                  ? `/budgets/${id}`
                  : project
                    ? `/projects/${project.id}`
                    : "/projects"
              }
            >
              Cancelar
            </Link>
            <button
              className={ui.primaryAction}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Calculando..." : "Calcular e salvar"}{" "}
              <span>→</span>
            </button>
          </footer>
        </form>
      </FormProvider>
    </div>
  );
}
