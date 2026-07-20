import type { ProjectStatus } from "@mjm/shared";
import { projectStatuses } from "@mjm/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../../lib/api";
import type { BudgetDto, ProjectSummary } from "../../lib/api-types";
import { formatCurrency, formatDate, labelFromEnum } from "../../lib/format";
import { statusBadgeClass, ui } from "../../lib/ui";

export function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [budgets, setBudgets] = useState<BudgetDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (id === undefined) return;
    void Promise.all([
      api.get<{ project: ProjectSummary }>(`/projects/${id}`),
      api.get<{ budgets: BudgetDto[] }>(`/projects/${id}/budgets`),
    ])
      .then(([projectResponse, budgetResponse]) => {
        setProject(projectResponse.data.project);
        setBudgets(budgetResponse.data.budgets);
      })
      .catch(() => setError("Não foi possível carregar o projeto."));
  }, [id]);

  async function changeStatus(status: ProjectStatus): Promise<void> {
    if (id === undefined) return;
    setSavingStatus(true);
    try {
      const { data } = await api.patch<{ project: ProjectSummary }>(
        `/projects/${id}`,
        { status },
      );
      setProject(data.project);
    } finally {
      setSavingStatus(false);
    }
  }

  if (error)
    return (
      <div className={ui.pageContent}>
        <div className={ui.error}>{error}</div>
      </div>
    );
  if (project === null)
    return <div className={ui.loading}>Carregando projeto...</div>;

  return (
    <div className={ui.pageContent}>
      <header className={ui.pageHeading}>
        <div>
          <p className={ui.eyebrow}>
            Projetos / {project.clientName ?? "Sem cliente"}
          </p>
          <h1 className={ui.pageTitle}>{project.name}</h1>
          <p className={ui.subtitle}>
            {project.description ?? "Sem descrição cadastrada."}
          </p>
        </div>
        {project.applicationType === "WEBSITE" && (
          <Link
            className={ui.primaryAction}
            to={`/projects/${project.id}/budgets/new`}
          >
            Novo orçamento <span>＋</span>
          </Link>
        )}
      </header>

      <section className="mb-6 grid grid-cols-1 border-t border-l border-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid min-h-20 content-center gap-2 border-r border-b border-zinc-300 bg-white p-4">
          <span className="text-[0.5625rem] font-bold tracking-[0.12em] text-zinc-500 uppercase">
            Tipo
          </span>
          <strong className="text-xs font-semibold">
            {labelFromEnum(project.applicationType)}
          </strong>
        </div>
        <label className="grid min-h-20 content-center gap-2 border-r border-b border-zinc-300 bg-white p-4">
          <span className="text-[0.5625rem] font-bold tracking-[0.12em] text-zinc-500 uppercase">
            Status
          </span>
          <select
            className="border-0 border-b border-zinc-300 bg-transparent text-xs font-semibold outline-none focus:border-sky-500"
            disabled={savingStatus}
            value={project.status}
            onChange={(event) =>
              void changeStatus(event.target.value as ProjectStatus)
            }
          >
            {projectStatuses.map((status) => (
              <option value={status} key={status}>
                {labelFromEnum(status)}
              </option>
            ))}
          </select>
        </label>
        <div className="grid min-h-20 content-center gap-2 border-r border-b border-zinc-300 bg-white p-4">
          <span className="text-[0.5625rem] font-bold tracking-[0.12em] text-zinc-500 uppercase">
            Responsável
          </span>
          <strong className="text-xs font-semibold">
            {project.responsibleUser.name}
          </strong>
        </div>
        <div className="grid min-h-20 content-center gap-2 border-r border-b border-zinc-300 bg-white p-4">
          <span className="text-[0.5625rem] font-bold tracking-[0.12em] text-zinc-500 uppercase">
            Atualizado em
          </span>
          <strong className="text-xs font-semibold">
            {formatDate(project.updatedAt)}
          </strong>
        </div>
      </section>

      <section className={ui.panel}>
        <header className={ui.panelHeader}>
          <div>
            <p className={ui.eyebrow}>Histórico</p>
            <h2 className="mt-2 mb-0 text-lg tracking-tight">
              Versões do orçamento
            </h2>
          </div>
          <span className={ui.moduleStatus}>
            {budgets.length} {budgets.length === 1 ? "versão" : "versões"}
          </span>
        </header>
        {budgets.length === 0 && (
          <div className={ui.empty}>
            <span className={ui.emptyIcon}>+</span>
            <h3 className="m-0 mb-2 text-sm font-semibold">Nenhum orçamento</h3>
            <p className="m-0 text-[0.8125rem] text-zinc-500">
              Crie a primeira versão para este projeto.
            </p>
          </div>
        )}
        {budgets.map((budget) => (
          <Link
            className="grid min-h-18 grid-cols-[1fr_auto] items-center gap-5 border-b border-zinc-200 px-4 py-3.5 text-zinc-950 no-underline transition-colors last:border-b-0 hover:bg-zinc-50 sm:grid-cols-[1fr_auto_140px_24px] sm:px-5 cursor-pointer"
            to={`/budgets/${budget.id}`}
            key={budget.id}
          >
            <div className="flex items-center gap-4">
              <span className="grid h-8.5 w-8.5 place-items-center border border-zinc-300 text-[0.625rem] font-bold text-zinc-600">
                V{budget.versionNumber}
              </span>
              <span className="grid gap-1">
                <strong className="text-xs">
                  Versão {budget.versionNumber}
                </strong>
                <small className="text-[0.6875rem] text-zinc-500">
                  Criado em {formatDate(budget.createdAt)}
                </small>
              </span>
            </div>
            <span className={statusBadgeClass(budget.status)}>
              {labelFromEnum(budget.status)}
            </span>
            <strong className="hidden text-right text-xs sm:block">
              {formatCurrency(budget.finalTotal)}
            </strong>
            <span className="hidden sm:block" aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
