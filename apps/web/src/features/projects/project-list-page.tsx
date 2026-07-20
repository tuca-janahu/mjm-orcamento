import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../../lib/api";
import type { ProjectSummary } from "../../lib/api-types";
import { formatDate, labelFromEnum } from "../../lib/format";
import { statusBadgeClass, ui } from "../../lib/ui";

export function ProjectListPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .get<{ projects: ProjectSummary[] }>("/projects")
      .then(({ data }) => setProjects(data.projects))
      .catch(() => setError("Não foi possível carregar os projetos."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={ui.pageContent}>
      <header className={ui.pageHeading}>
        <div>
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
        <div className="hidden min-h-10 grid-cols-[minmax(240px,1.7fr)_1fr_1fr_.7fr_.8fr] items-center gap-5 border-b border-zinc-200 bg-zinc-50 px-4.5 text-[0.5625rem] font-bold tracking-[0.12em] text-zinc-500 uppercase md:grid">
          <span>Projeto</span>
          <span>Tipo</span>
          <span>Status</span>
          <span>Orçamentos</span>
          <span>Atualização</span>
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
          <Link
            className="grid min-h-17 grid-cols-[1fr_auto] items-center gap-5 border-b border-zinc-200 px-4 py-3.5 text-xs text-zinc-600 no-underline transition-colors last:border-b-0 hover:bg-zinc-50 hover:text-zinc-950 md:grid-cols-[minmax(240px,1.7fr)_1fr_1fr_.7fr_.8fr] md:px-4.5"
            to={`/projects/${project.id}`}
            key={project.id}
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
        ))}
      </section>
    </div>
  );
}
