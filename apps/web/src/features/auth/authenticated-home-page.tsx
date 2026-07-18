import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import { api } from '../../lib/api';
import type { AuthenticatedOutletContext, BudgetDto, ProjectSummary } from '../../lib/api-types';
import { formatCurrency, formatDate } from '../../lib/format';

export function AuthenticatedHomePage() {
  const { user } = useOutletContext<AuthenticatedOutletContext>();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [budgets, setBudgets] = useState<BudgetDto[]>([]);

  useEffect(() => {
    void api.get<{ projects: ProjectSummary[] }>('/projects').then(async ({ data }) => {
      setProjects(data.projects);
      const responses = await Promise.all(
        data.projects.map((project) => api.get<{ budgets: BudgetDto[] }>(`/projects/${project.id}/budgets`))
      );
      setBudgets(
        responses
          .flatMap((response) => response.data.budgets)
          .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
      );
    }).catch(() => {
      setProjects([]);
      setBudgets([]);
    });
  }, []);

  const draftCount = budgets.filter((budget) => budget.status === 'RASCUNHO').length;

  return (
    <div className="page-content">
      <section className="welcome-section">
        <div className="welcome-copy">
          <p className="section-index">Painel</p>
          <h1>Visão geral</h1>
          <p>Olá, {user.name.split(' ')[0]}. Acompanhe aqui os orçamentos e projetos da equipe.</p>
        </div>
        <div className="role-badge">{user.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</div>
      </section>

      <section className="summary-grid" aria-label="Resumo">
        <article className="summary-card">
          <span>Orçamentos</span>
          <strong>{budgets.length}</strong>
          <small>Total cadastrado</small>
        </article>
        <article className="summary-card">
          <span>Projetos</span>
          <strong>{projects.length}</strong>
          <small>Total cadastrado</small>
        </article>
        <article className="summary-card">
          <span>Em elaboração</span>
          <strong>{draftCount}</strong>
          <small>Orçamentos em rascunho</small>
        </article>
      </section>

      <section className="content-panel">
        <header className="content-panel-header">
          <div>
            <p className="section-index">Atividade recente</p>
            <h2>Orçamentos</h2>
          </div>
          <Link className="secondary-action" to="/projects">Ver projetos</Link>
        </header>
        {budgets.length === 0 ? (
          <div className="empty-content">
            <span className="empty-content-icon" aria-hidden="true">→</span>
            <h3>Nenhum orçamento cadastrado</h3>
            <p>Crie um projeto para começar um novo orçamento.</p>
          </div>
        ) : budgets.slice(0, 5).map((budget) => (
          <Link className="budget-row" to={`/budgets/${budget.id}`} key={budget.id}>
            <div><span className="version-mark">V{budget.versionNumber}</span><span><strong>{budget.project.name}</strong><small>Atualizado em {formatDate(budget.updatedAt)}</small></span></div>
            <span className={`status-tag status-${budget.status.toLowerCase()}`}>{budget.status}</span>
            <strong>{formatCurrency(budget.finalTotal)}</strong>
            <span aria-hidden="true">→</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
