import type { ProjectStatus } from '@mjm/shared';
import { projectStatuses } from '@mjm/shared';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { api } from '../../lib/api';
import type { BudgetDto, ProjectSummary } from '../../lib/api-types';
import { formatCurrency, formatDate, labelFromEnum } from '../../lib/format';

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
      api.get<{ budgets: BudgetDto[] }>(`/projects/${id}/budgets`)
    ]).then(([projectResponse, budgetResponse]) => {
      setProject(projectResponse.data.project);
      setBudgets(budgetResponse.data.budgets);
    }).catch(() => setError('Não foi possível carregar o projeto.'));
  }, [id]);

  async function changeStatus(status: ProjectStatus): Promise<void> {
    if (id === undefined) return;
    setSavingStatus(true);
    try {
      const { data } = await api.patch<{ project: ProjectSummary }>(`/projects/${id}`, { status });
      setProject(data.project);
    } finally { setSavingStatus(false); }
  }

  if (error) return <div className="page-content"><div className="alert">{error}</div></div>;
  if (project === null) return <div className="page-content table-message">Carregando projeto...</div>;

  return (
    <div className="page-content">
      <header className="page-heading detail-heading">
        <div><p className="section-index">Projetos / {project.clientName ?? 'Sem cliente'}</p><h1>{project.name}</h1><p>{project.description ?? 'Sem descrição cadastrada.'}</p></div>
        {project.applicationType === 'WEBSITE' && <Link className="primary-link" to={`/projects/${project.id}/budgets/new`}>Novo orçamento <span>＋</span></Link>}
      </header>

      <section className="project-meta-grid">
        <div><span>Tipo</span><strong>{labelFromEnum(project.applicationType)}</strong></div>
        <label><span>Status</span><select disabled={savingStatus} value={project.status} onChange={(event) => void changeStatus(event.target.value as ProjectStatus)}>{projectStatuses.map((status) => <option value={status} key={status}>{labelFromEnum(status)}</option>)}</select></label>
        <div><span>Responsável</span><strong>{project.responsibleUser.name}</strong></div>
        <div><span>Atualizado em</span><strong>{formatDate(project.updatedAt)}</strong></div>
      </section>

      <section className="data-panel">
        <header className="content-panel-header"><div><p className="section-index">Histórico</p><h2>Versões do orçamento</h2></div><span className="module-status">{budgets.length} {budgets.length === 1 ? 'versão' : 'versões'}</span></header>
        {budgets.length === 0 && <div className="empty-content"><span className="empty-content-icon">＋</span><h3>Nenhum orçamento</h3><p>Crie a primeira versão para este projeto.</p></div>}
        {budgets.map((budget) => (
          <Link className="budget-row" to={`/budgets/${budget.id}`} key={budget.id}>
            <div><span className="version-mark">V{budget.versionNumber}</span><span><strong>Versão {budget.versionNumber}</strong><small>Criado em {formatDate(budget.createdAt)}</small></span></div>
            <span className={`status-tag status-${budget.status.toLowerCase()}`}>{labelFromEnum(budget.status)}</span>
            <strong>{formatCurrency(budget.finalTotal)}</strong>
            <span aria-hidden="true">→</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
