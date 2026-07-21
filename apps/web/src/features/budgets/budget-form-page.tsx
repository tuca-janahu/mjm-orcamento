import type { ApplicationType } from "@mjm/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../../lib/api";
import type { BudgetDto, ProjectSummary } from "../../lib/api-types";
import { labelFromEnum } from "../../lib/format";
import { ui } from "../../lib/ui";
import { WebPlatformBudgetForm } from "./web-platform-budget-form";
import { WebsiteBudgetForm } from "./website-budget-form";

type BudgetApplicationType = Extract<
  ApplicationType,
  "WEBSITE" | "PLATAFORMA_WEB"
>;

function isBudgetApplicationType(
  applicationType: ApplicationType,
): applicationType is BudgetApplicationType {
  return (
    applicationType === "WEBSITE" || applicationType === "PLATAFORMA_WEB"
  );
}

export function BudgetFormPage() {
  const { projectId, id } = useParams();
  const [applicationType, setApplicationType] =
    useState<ApplicationType | null>(null);
  const [resolvedProjectId, setResolvedProjectId] = useState(projectId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const request =
      id !== undefined
        ? api.get<{ budget: BudgetDto }>(`/budgets/${id}`).then(({ data }) => ({
            applicationType: data.budget.project.applicationType,
            projectId: data.budget.project.id,
          }))
        : api
            .get<{ project: ProjectSummary }>(`/projects/${projectId}`)
            .then(({ data }) => ({
              applicationType: data.project.applicationType,
              projectId: data.project.id,
            }));

    void request
      .then((result) => {
        setApplicationType(result.applicationType);
        setResolvedProjectId(result.projectId);
      })
      .catch(() =>
        setError(
          id !== undefined
            ? "Não foi possível carregar o orçamento."
            : "Não foi possível carregar o projeto.",
        ),
      )
      .finally(() => setLoading(false));
  }, [id, projectId]);

  if (loading) return <div className={ui.loading}>Carregando orçamento...</div>;

  if (error !== null) {
    return (
      <div className={ui.pageContent}>
        <div className={ui.error}>{error}</div>
      </div>
    );
  }

  if (applicationType === null || !isBudgetApplicationType(applicationType)) {
    return (
      <div className={ui.pageContent}>
        <section className={ui.panel}>
          <div className={ui.empty}>
            <h1 className="m-0 text-lg font-semibold">
              Precificação ainda não disponível
            </h1>
            <p className="m-0 max-w-xl text-sm leading-relaxed text-zinc-500">
              O tipo {applicationType ? labelFromEnum(applicationType) : "selecionado"}{" "}
              ainda não possui um formulário de orçamento automático.
            </p>
            {resolvedProjectId !== undefined && (
              <Link
                className={ui.secondaryAction}
                to={`/projects/${resolvedProjectId}`}
              >
                Voltar ao projeto
              </Link>
            )}
          </div>
        </section>
      </div>
    );
  }

  return applicationType === "WEBSITE" ? (
    <WebsiteBudgetForm />
  ) : (
    <WebPlatformBudgetForm />
  );
}
