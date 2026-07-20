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
    <div className="w-full pb-10">
      <section className="flex flex-col items-start justify-between gap-8 py-9 sm:py-12 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <p className="m-0 text-[0.625rem] font-bold tracking-[0.2em] text-zinc-500 uppercase">Painel</p>
          <h1 className="mt-3 mb-2 text-3xl leading-none font-bold tracking-[-0.05em] sm:text-5xl">Visão geral</h1>
          <p className="m-0 text-sm leading-relaxed text-zinc-600">Olá, {user.name.split(' ')[0]}. Acompanhe aqui os orçamentos e projetos da equipe.</p>
        </div>
        <div className="border border-zinc-300 bg-zinc-50 px-2.5 py-2 text-[0.5625rem] font-semibold tracking-[0.12em] text-zinc-600 uppercase">{user.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</div>
      </section>

      <section className="grid grid-cols-1 border-t border-l border-zinc-300 md:grid-cols-3" aria-label="Resumo">
        <article className="grid min-h-31 grid-cols-[1fr_auto] gap-2 border-r border-b border-zinc-300 bg-white p-5 transition-colors hover:bg-zinc-50">
          <span className="text-[0.6875rem] font-semibold tracking-[0.08em] text-zinc-600 uppercase">Orçamentos</span>
          <strong className="row-span-2 self-center text-4xl font-bold tracking-[-0.05em]">{budgets.length}</strong>
          <small className="self-end text-[0.6875rem] text-zinc-400">Total cadastrado</small>
        </article>
        <article className="grid min-h-31 grid-cols-[1fr_auto] gap-2 border-r border-b border-zinc-300 bg-white p-5 transition-colors hover:bg-zinc-50">
          <span className="text-[0.6875rem] font-semibold tracking-[0.08em] text-zinc-600 uppercase">Projetos</span>
          <strong className="row-span-2 self-center text-4xl font-bold tracking-[-0.05em]">{projects.length}</strong>
          <small className="self-end text-[0.6875rem] text-zinc-400">Total cadastrado</small>
        </article>
        <article className="grid min-h-31 grid-cols-[1fr_auto] gap-2 border-r border-b border-zinc-300 bg-white p-5 transition-colors hover:bg-zinc-50">
          <span className="text-[0.6875rem] font-semibold tracking-[0.08em] text-zinc-600 uppercase">Em elaboração</span>
          <strong className="row-span-2 self-center text-4xl font-bold tracking-[-0.05em]">{draftCount}</strong>
          <small className="self-end text-[0.6875rem] text-zinc-400">Orçamentos em rascunho</small>
        </article>
      </section>

      <section className="mt-6 border border-zinc-300 bg-white">
        <header className="flex min-h-19 items-center justify-between gap-6 border-b border-zinc-200 px-5 py-4">
          <div>
            <p className="m-0 text-[0.625rem] font-bold tracking-[0.2em] text-zinc-500 uppercase">Atividade recente</p>
            <h2 className="mt-2 mb-0 text-lg tracking-tight">Orçamentos</h2>
          </div>
          <Link className="inline-flex min-h-9.5 items-center justify-center border border-zinc-950 px-3.5 text-[0.625rem] font-bold tracking-[0.1em] text-zinc-950 uppercase no-underline transition-colors hover:bg-zinc-200" to="/projects">Ver projetos</Link>
        </header>
        {budgets.length === 0 ? (
          <div className="grid min-h-60 place-content-center justify-items-center p-8 text-center">
            <span className="mb-4 grid h-10 w-10 place-items-center border border-zinc-300 text-xl text-zinc-500" aria-hidden="true">→</span>
            <h3 className="m-0 mb-2 text-sm font-semibold">Nenhum orçamento cadastrado</h3>
            <p className="m-0 text-[0.8125rem] text-zinc-500">Crie um projeto para começar um novo orçamento.</p>
          </div>
        ) : budgets.slice(0, 5).map((budget) => (
          <Link className="grid min-h-18 grid-cols-[1fr_auto] items-center gap-5 border-b border-zinc-200 px-4 py-3.5 text-zinc-950 no-underline transition-colors last:border-b-0 hover:bg-zinc-50 sm:grid-cols-[1fr_auto_140px_24px] sm:px-5" to={`/budgets/${budget.id}`} key={budget.id}>
            <div className="flex items-center gap-4"><span className="grid h-8.5 w-8.5 place-items-center border border-zinc-300 text-[0.625rem] font-bold text-zinc-600">V{budget.versionNumber}</span><span className="grid gap-1"><strong className="text-xs">{budget.project.name}</strong><small className="text-[0.6875rem] text-zinc-500">Atualizado em {formatDate(budget.updatedAt)}</small></span></div>
            <span className="hidden border border-zinc-300 bg-zinc-50 px-2 py-1 text-[0.5625rem] font-bold tracking-[0.08em] text-zinc-600 uppercase sm:inline-flex">{budget.status}</span>
            <strong className="hidden text-right text-xs sm:block">{formatCurrency(budget.finalTotal)}</strong>
            <span className="hidden sm:block" aria-hidden="true">→</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
