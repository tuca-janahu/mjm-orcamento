import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../../lib/api';
import type { ProjectSummary } from '../../lib/api-types';
import { formatDate, labelFromEnum } from '../../lib/format';

export function ProjectListPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.get<{ projects: ProjectSummary[] }>('/projects')
      .then(({ data }) => setProjects(data.projects))
      .catch(() => setError('Não foi possível carregar os projetos.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-content">
      <header className="page-heading">
        <div>
          <p className="section-index">Comercial</p>
          <h1>Projetos e orçamentos</h1>
          <p>Organize oportunidades e preserve as versões de cada orçamento.</p>
        </div>
        <Link className="primary-link" to="/projects/new">Novo projeto <span>＋</span></Link>
      </header>

      {error && <div className="alert" role="alert">{error}</div>}

      <section className="data-panel">
        <div className="table-header">
          <span>Projeto</span><span>Tipo</span><span>Status</span><span>Orçamentos</span><span>Atualização</span>
        </div>
        {loading && <div className="table-message">Carregando projetos...</div>}
        {!loading && projects.length === 0 && (
          <div className="empty-content">
            <span className="empty-content-icon">＋</span>
            <h3>Nenhum projeto cadastrado</h3>
            <p>Crie o primeiro projeto para iniciar um orçamento.</p>
          </div>
        )}
        {projects.map((project) => (
          <Link className="table-row" to={`/projects/${project.id}`} key={project.id}>
            <span className="primary-cell"><strong>{project.name}</strong><small>{project.clientName ?? 'Cliente não informado'}</small></span>
            <span>{labelFromEnum(project.applicationType)}</span>
            <span><span className={`status-tag status-${project.status.toLowerCase()}`}>{labelFromEnum(project.status)}</span></span>
            <span>{project._count.budgets}</span>
            <span>{formatDate(project.updatedAt)}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}

