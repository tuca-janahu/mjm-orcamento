import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { api } from '../../lib/api';
import type { BudgetDto } from '../../lib/api-types';
import { formatCurrency, formatDate, labelFromEnum } from '../../lib/format';

interface ApiErrorBody { error?: { message?: string } }

export function BudgetDetailPage() {
  const { id } = useParams();
  const [budget, setBudget] = useState<BudgetDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<'recalculate' | 'finalize' | null>(null);

  useEffect(() => {
    if (id === undefined) return;
    void api.get<{ budget: BudgetDto }>(`/budgets/${id}`).then(({ data }) => setBudget(data.budget)).catch(() => setError('Não foi possível carregar o orçamento.'));
  }, [id]);

  async function runAction(kind: 'recalculate' | 'finalize'): Promise<void> {
    if (id === undefined) return;
    setError(null);
    setAction(kind);
    try {
      const { data } = await api.post<{ budget: BudgetDto }>(`/budgets/${id}/${kind}`);
      setBudget(data.budget);
    } catch (caught) {
      setError(axios.isAxiosError<ApiErrorBody>(caught) ? caught.response?.data.error?.message ?? 'Não foi possível atualizar o orçamento.' : 'Não foi possível atualizar o orçamento.');
    } finally { setAction(null); }
  }

  if (error && budget === null) return <div className="page-content"><div className="alert">{error}</div></div>;
  if (budget === null) return <div className="page-content table-message">Carregando orçamento...</div>;

  const oneTimeItems = budget.items.filter((item) => !item.recurring);
  const recurringItems = budget.items.filter((item) => item.recurring);

  return (
    <div className="page-content">
      <header className="page-heading budget-heading">
        <div><p className="section-index"><Link to={`/projects/${budget.project.id}`}>{budget.project.name}</Link> / Versão {budget.versionNumber}</p><div className="title-with-status"><h1>Orçamento V{budget.versionNumber}</h1><span className={`status-tag status-${budget.status.toLowerCase()}`}>{labelFromEnum(budget.status)}</span></div><p>Criado por {budget.createdBy.name} em {formatDate(budget.createdAt)}.</p></div>
        {budget.status === 'RASCUNHO' && <div className="heading-actions"><Link className="secondary-action" to={`/budgets/${budget.id}/edit`}>Editar</Link><button className="secondary-action" disabled={action !== null} type="button" onClick={() => void runAction('recalculate')}>{action === 'recalculate' ? 'Recalculando...' : 'Recalcular'}</button><button className="primary-link" disabled={action !== null} type="button" onClick={() => void runAction('finalize')}>{action === 'finalize' ? 'Finalizando...' : 'Finalizar'} <span>→</span></button></div>}
      </header>
      {error && <div className="alert">{error}</div>}

      <section className="budget-total-panel">
        <div><span>Total do projeto</span><strong>{formatCurrency(budget.finalTotal)}</strong><small>Subtotal de {formatCurrency(budget.subtotal)}</small></div>
        <div><span>Mensal recorrente</span><strong>{formatCurrency(budget.monthlyRecurringTotal)}</strong><small>Hospedagem e manutenção</small></div>
        <dl><div><dt>Complexidade</dt><dd>{Number(budget.complexityMultiplier).toFixed(2)}×</dd></div><div><dt>Urgência</dt><dd>{Number(budget.urgencyMultiplier).toFixed(2)}×</dd></div><div><dt>Desconto</dt><dd>{Number(budget.discountPercentage).toFixed(2)}%</dd></div></dl>
      </section>

      <section className="budget-detail-grid">
        <div className="data-panel item-panel">
          <header className="content-panel-header"><div><p className="section-index">Detalhamento</p><h2>Itens do projeto</h2></div><span className="module-status">{oneTimeItems.length} itens</span></header>
          {oneTimeItems.map((item) => <div className="item-row" key={item.id}><span><strong>{item.name}</strong><small>{item.quantity > 1 ? `${item.quantity} × ${formatCurrency(item.unitPrice)}` : labelFromEnum(item.category)}</small></span><strong>{formatCurrency(item.totalPrice)}</strong></div>)}
          {recurringItems.length > 0 && <><div className="item-group-label">Recorrência mensal</div>{recurringItems.map((item) => <div className="item-row recurring-row" key={item.id}><span><strong>{item.name}</strong><small>{item.description ?? 'Cobrança mensal'}</small></span><strong>{formatCurrency(item.totalPrice)}</strong></div>)}</>}
        </div>

        <aside className="budget-input-summary">
          <p className="section-index">Escopo informado</p>
          <h2>Website</h2>
          <dl>
            <div><dt>Tipo</dt><dd>{labelFromEnum(budget.inputData.websiteType)}</dd></div>
            <div><dt>Páginas</dt><dd>{budget.inputData.numberOfPages}</dd></div>
            <div><dt>Design</dt><dd>{labelFromEnum(budget.inputData.designType)}</dd></div>
            <div><dt>Desenvolvimento</dt><dd>{labelFromEnum(budget.inputData.developmentType)}</dd></div>
            <div><dt>Integrações</dt><dd>{budget.inputData.integrationCount}</dd></div>
            <div><dt>Prazo</dt><dd>{budget.inputData.estimatedDeadlineDays ? `${budget.inputData.estimatedDeadlineDays} dias` : 'Não informado'}</dd></div>
          </dl>
          {budget.notes && <div className="budget-notes"><span>Observações</span><p>{budget.notes}</p></div>}
        </aside>
      </section>
    </div>
  );
}
