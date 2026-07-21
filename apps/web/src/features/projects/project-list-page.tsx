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
        {!loading && projects.length === 0 && (
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
        {projects.map((project) => (
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
