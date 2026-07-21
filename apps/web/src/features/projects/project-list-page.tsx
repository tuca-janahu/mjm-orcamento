import { projectStatuses, type ProjectStatus } from "@mjm/shared";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ConfirmDialog } from "../../components/confirm-dialog";
import { api } from "../../lib/api";
import type { ProjectSummary } from "../../lib/api-types";
import { formatDate, labelFromEnum } from "../../lib/format";
import { statusBadgeClass, ui } from "../../lib/ui";

interface ApiErrorBody {
  error?: { message?: string };
}

export function ProjectListPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>(
    () => [...projectStatuses],
  );
  const [projectToDelete, setProjectToDelete] =
    useState<ProjectSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .get<{ projects: ProjectSummary[] }>("/projects")
      .then(({ data }) => setProjects(data.projects))
      .catch(() => setError("Não foi possível carregar os projetos."))
      .finally(() => setLoading(false));
  }, []);

  async function deleteProject(): Promise<void> {
    if (projectToDelete === null) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/projects/${projectToDelete.id}`);
      setProjects((currentProjects) =>
        currentProjects.filter(
          (project) => project.id !== projectToDelete.id,
        ),
      );
      setProjectToDelete(null);
    } catch (requestError) {
      setDeleteError(
        axios.isAxiosError<ApiErrorBody>(requestError)
          ? (requestError.response?.data.error?.message ??
              "Não foi possível excluir o projeto.")
          : "Não foi possível excluir o projeto.",
      );
    } finally {
      setDeleting(false);
    }
  }

  function openDeleteDialog(project: ProjectSummary): void {
    setDeleteError(null);
    setProjectToDelete(project);
  }

  function closeDeleteDialog(): void {
    if (deleting) return;
    setProjectToDelete(null);
    setDeleteError(null);
  }

  function toggleStatus(status: ProjectStatus): void {
    setSelectedStatuses((currentStatuses) =>
      currentStatuses.includes(status)
        ? currentStatuses.filter((currentStatus) => currentStatus !== status)
        : projectStatuses.filter(
            (projectStatus) =>
              projectStatus === status || currentStatuses.includes(projectStatus),
          ),
    );
  }

  const allStatusesSelected =
    selectedStatuses.length === projectStatuses.length;

  function toggleAllStatuses(): void {
    setSelectedStatuses(allStatusesSelected ? [] : [...projectStatuses]);
  }

  const filteredProjects = projects.filter((project) =>
    selectedStatuses.includes(project.status),
  );

  const resultLabel = `${filteredProjects.length} ${
    filteredProjects.length === 1 ? "projeto" : "projetos"
  }`;

  return (
    <div className={ui.pageContent}>
      <header className={ui.pageHeading}>
        <div>
          <Link
            className="mb-6 inline-flex items-center gap-2 text-[0.625rem] font-bold tracking-[0.1em] text-zinc-500 uppercase no-underline transition-colors hover:text-zinc-950"
            to="/"
          >
            <span aria-hidden="true">←</span> Voltar
          </Link>
          <p className={ui.eyebrow}>Comercial</p>
          <h1 className={ui.pageTitle}>Projetos e orçamentos</h1>
          <p className={ui.subtitle}>
            Organize oportunidades e preserve as versões de cada orçamento.
          </p>
        </div>
        <Link className={ui.primaryAction} to="/projects/new">
          Novo projeto <span>＋</span>
        </Link>
      </header>

      {error && (
        <div className={ui.error} role="alert">
          {error}
        </div>
      )}

      <section className={ui.panel}>
        <div className="border-b border-zinc-200 px-5 py-4">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="m-0 text-[0.625rem] font-bold tracking-[0.12em] text-zinc-500 uppercase">
                Filtrar por estado
              </p>
              <p
                className="mt-1.5 mb-0 text-xs text-zinc-600"
                id="project-filter-summary"
                aria-live="polite"
              >
                {loading
                  ? "Carregando projetos..."
                  : `${resultLabel} · ${selectedStatuses.length} de ${projectStatuses.length} estados selecionados`}
              </p>
            </div>
            <button
              className={ui.secondaryAction}
              disabled={loading || projects.length === 0}
              type="button"
              onClick={toggleAllStatuses}
            >
              {allStatusesSelected
                ? "Desselecionar todos"
                : "Selecionar todos"}
            </button>
          </div>

          <fieldset
            className="mt-4 border-0 p-0"
            disabled={loading || projects.length === 0}
            aria-describedby="project-filter-summary"
          >
            <legend className="sr-only">Estados visíveis na listagem</legend>
            <div className="grid grid-cols-1 border-t border-l border-zinc-200 sm:grid-cols-2 lg:grid-cols-5">
              {projectStatuses.map((status) => (
                <label
                  className={`${ui.checkOption} ${
                    loading
                      ? "cursor-wait bg-zinc-50 text-zinc-400"
                      : projects.length === 0
                        ? "cursor-not-allowed bg-zinc-50 text-zinc-400"
                        : ""
                  }`}
                  key={status}
                >
                  <input
                    className="peer absolute h-px w-px opacity-0"
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => toggleStatus(status)}
                  />
                  <span className={ui.checkMark} aria-hidden="true" />
                  <span>{labelFromEnum(status)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="hidden min-h-10 grid-cols-[minmax(0,1fr)_3rem] items-stretch border-b border-zinc-200 bg-zinc-50 text-[0.5625rem] font-bold tracking-[0.12em] text-zinc-500 uppercase md:grid">
          <div className="grid grid-cols-[minmax(240px,1.7fr)_1fr_1fr_.7fr_.8fr] items-center gap-5 px-4.5">
            <span>Projeto</span>
            <span>Tipo</span>
            <span>Status</span>
            <span>Orçamentos</span>
            <span>Atualização</span>
          </div>
          <span className="grid place-items-center border-l border-zinc-200">
            Ações
          </span>
        </div>
        {loading && <div className={ui.loading}>Carregando projetos...</div>}
        {!loading && error === null && projects.length === 0 && (
          <div className={ui.empty}>
            <span className={ui.emptyIcon}>＋</span>
            <h3 className="m-0 mb-2 text-sm font-semibold">
              Nenhum projeto cadastrado
            </h3>
            <p className="m-0 text-[0.8125rem] text-zinc-500">
              Crie o primeiro projeto para iniciar um orçamento.
            </p>
          </div>
        )}
        {!loading &&
          error === null &&
          projects.length > 0 &&
          filteredProjects.length === 0 && (
            <div className={ui.empty}>
              <span className={ui.emptyIcon} aria-hidden="true">
                0
              </span>
              <h3 className="m-0 mb-2 text-sm font-semibold">
                {selectedStatuses.length === 0
                  ? "Nenhum estado selecionado"
                  : "Nenhum projeto nos estados selecionados"}
              </h3>
              <p className="m-0 text-[0.8125rem] text-zinc-500">
                {selectedStatuses.length === 0
                  ? "Selecione ao menos um estado para visualizar projetos."
                  : "Altere os estados selecionados para visualizar outros projetos."}
              </p>
              <button
                className={`${ui.secondaryAction} mt-5`}
                type="button"
                onClick={() => setSelectedStatuses([...projectStatuses])}
              >
                Selecionar todos
              </button>
            </div>
          )}
        {filteredProjects.map((project) => (
          <div
            className="grid min-h-17 grid-cols-[minmax(0,1fr)_3rem] items-stretch border-b border-zinc-200 text-xs text-zinc-600 transition-colors last:border-b-0 hover:bg-zinc-50 hover:text-zinc-950"
            key={project.id}
          >
            <Link
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 px-4 py-3.5 text-inherit no-underline md:grid-cols-[minmax(240px,1.7fr)_1fr_1fr_.7fr_.8fr] md:px-4.5"
              to={`/projects/${project.id}`}
            >
              <span className="grid gap-1">
                <strong className="text-[0.8125rem] text-zinc-950">
                  {project.name}
                </strong>
                <small className="text-[0.6875rem] text-zinc-500">
                  {project.clientName ?? "Cliente não informado"}
                </small>
              </span>
              <span className="hidden md:block">
                {labelFromEnum(project.applicationType)}
              </span>
              <span>
                <span className={statusBadgeClass(project.status)}>
                  {labelFromEnum(project.status)}
                </span>
              </span>
              <span className="hidden md:block">{project._count.budgets}</span>
              <span className="hidden md:block">
                {formatDate(project.updatedAt)}
              </span>
            </Link>
            <div className="grid place-items-center border-l border-zinc-200">
              <button
                className="grid h-9 w-9 cursor-pointer place-items-center border border-transparent bg-transparent text-zinc-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-red-600"
                type="button"
                aria-label={`Excluir projeto ${project.name}`}
                title={`Excluir ${project.name}`}
                onClick={() => openDeleteDialog(project)}
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </section>

      {projectToDelete !== null && (
        <ConfirmDialog
          open
          title="Excluir projeto?"
          description={`A exclusão do projeto “${projectToDelete.name}” só será concluída se ele não possuir orçamentos vinculados. Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir projeto"
          tone="danger"
          loading={deleting}
          error={deleteError}
          onConfirm={() => void deleteProject()}
          onClose={closeDeleteDialog}
        />
      )}
    </div>
  );
}
