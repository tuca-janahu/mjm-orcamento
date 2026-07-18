import { zodResolver } from '@hookform/resolvers/zod';
import {
  complexityLevels,
  createBudgetInputSchema,
  designTypes,
  developmentTypes,
  urgencyLevels,
  websiteTypes,
  type CreateBudgetInput
} from '@mjm/shared';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../../lib/api';
import type { BudgetDto, ProjectSummary } from '../../lib/api-types';
import { labelFromEnum } from '../../lib/format';

const defaultValues: CreateBudgetInput = {
  inputData: {
    websiteType: 'INSTITUCIONAL',
    numberOfPages: 5,
    designType: 'TEMPLATE',
    developmentType: 'FRONTEND',
    hasAdminPanel: false,
    integrationCount: 0,
    hasPaymentSystem: false,
    hasBlog: false,
    hasBasicSeo: true,
    hasDomain: false,
    hasHosting: false,
    complexity: 'SIMPLES',
    urgency: 'NORMAL',
    requiresMonthlyMaintenance: false,
    discountPercentage: 0
  }
};

interface ApiErrorBody { error?: { message?: string } }

const functionalityOptions = [
  { field: 'inputData.hasAdminPanel', label: 'Painel administrativo' },
  { field: 'inputData.hasPaymentSystem', label: 'Sistema de pagamento' },
  { field: 'inputData.hasBlog', label: 'Blog' },
  { field: 'inputData.hasBasicSeo', label: 'SEO básico' },
  { field: 'inputData.hasDomain', label: 'Domínio' },
  { field: 'inputData.hasHosting', label: 'Hospedagem' }
] as const;

export function BudgetFormPage() {
  const { projectId, id } = useParams();
  const editing = id !== undefined;
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(editing);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<CreateBudgetInput>({
    resolver: zodResolver(createBudgetInputSchema),
    defaultValues
  });

  useEffect(() => {
    if (editing && id !== undefined) {
      void api.get<{ budget: BudgetDto }>(`/budgets/${id}`).then(({ data }) => {
        if (data.budget.status !== 'RASCUNHO') {
          void navigate(`/budgets/${id}`, { replace: true });
          return;
        }
        reset({ inputData: data.budget.inputData, notes: data.budget.notes ?? undefined });
        setProject({ ...data.budget.project, clientName: null, description: null, status: 'PROSPECCAO', notes: null, createdAt: data.budget.createdAt, updatedAt: data.budget.updatedAt, responsibleUser: data.budget.createdBy, _count: { budgets: 0 } });
      }).catch(() => setServerError('Não foi possível carregar o orçamento.')).finally(() => setLoading(false));
    } else if (projectId !== undefined) {
      void api.get<{ project: ProjectSummary }>(`/projects/${projectId}`).then(({ data }) => setProject(data.project)).catch(() => setServerError('Não foi possível carregar o projeto.'));
    }
  }, [editing, id, navigate, projectId, reset]);

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const response = editing
        ? await api.patch<{ budget: BudgetDto }>(`/budgets/${id}`, values)
        : await api.post<{ budget: BudgetDto }>(`/projects/${projectId}/budgets`, values);
      void navigate(`/budgets/${response.data.budget.id}`);
    } catch (error) {
      setServerError(axios.isAxiosError<ApiErrorBody>(error) ? error.response?.data.error?.message ?? 'Não foi possível salvar o orçamento.' : 'Não foi possível salvar o orçamento.');
    }
  });

  if (loading) return <div className="page-content table-message">Carregando orçamento...</div>;

  const hasHosting = watch('inputData.hasHosting');

  return (
    <div className="page-content budget-form-page">
      <header className="page-heading">
        <div><p className="section-index">{editing ? 'Orçamentos / Editar rascunho' : 'Orçamentos / Nova versão'}</p><h1>{editing ? 'Editar orçamento' : 'Novo orçamento'}</h1><p>{project?.name ?? 'Projeto WEBSITE'} · os valores serão calculados pela API ao salvar.</p></div>
      </header>

      <form className="entity-form" onSubmit={submit} noValidate>
        <section className="form-section">
          <div className="form-section-heading"><span>01</span><div><h2>Estrutura do website</h2><p>Defina o formato, volume e abordagem técnica.</p></div></div>
          <div className="form-grid three-columns">
            <label className="field"><span>Tipo de website</span><select {...register('inputData.websiteType')}>{websiteTypes.map((value) => <option value={value} key={value}>{labelFromEnum(value)}</option>)}</select></label>
            <label className="field"><span>Número de páginas</span><input type="number" min="1" {...register('inputData.numberOfPages', { valueAsNumber: true })} />{errors.inputData?.numberOfPages && <small>{errors.inputData.numberOfPages.message}</small>}</label>
            <label className="field"><span>Prazo estimado (dias)</span><input type="number" min="1" {...register('inputData.estimatedDeadlineDays', { setValueAs: (value: string) => value === '' ? undefined : Number(value) })} /></label>
            <label className="field"><span>Design</span><select {...register('inputData.designType')}>{designTypes.map((value) => <option value={value} key={value}>{labelFromEnum(value)}</option>)}</select></label>
            <label className="field"><span>Desenvolvimento</span><select {...register('inputData.developmentType')}>{developmentTypes.map((value) => <option value={value} key={value}>{labelFromEnum(value)}</option>)}</select></label>
            <label className="field"><span>Integrações</span><input type="number" min="0" {...register('inputData.integrationCount', { valueAsNumber: true })} /></label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading"><span>02</span><div><h2>Funcionalidades</h2><p>Selecione os componentes que fazem parte do escopo.</p></div></div>
          <div className="option-grid">
            {functionalityOptions.map(({ field, label }) => (
              <label className="check-option" key={field}><input type="checkbox" {...register(field)} /><span className="check-mark" /><span>{label}</span></label>
            ))}
            <label className={`check-option ${!hasHosting ? '' : 'highlight-option'}`}><input type="checkbox" {...register('inputData.requiresMonthlyMaintenance')} /><span className="check-mark" /><span>Manutenção mensal</span></label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading"><span>03</span><div><h2>Ajustes comerciais</h2><p>Complexidade, urgência e desconto final.</p></div></div>
          <div className="form-grid three-columns">
            <label className="field"><span>Complexidade</span><select {...register('inputData.complexity')}>{complexityLevels.map((value) => <option value={value} key={value}>{labelFromEnum(value)}</option>)}</select></label>
            <label className="field"><span>Urgência</span><select {...register('inputData.urgency')}>{urgencyLevels.map((value) => <option value={value} key={value}>{labelFromEnum(value)}</option>)}</select></label>
            <label className="field"><span>Desconto (%)</span><input type="number" min="0" max="100" step="0.01" {...register('inputData.discountPercentage', { valueAsNumber: true })} />{errors.inputData?.discountPercentage && <small>{errors.inputData.discountPercentage.message}</small>}</label>
            <label className="field field-wide"><span>Observações</span><textarea rows={3} {...register('notes')} /></label>
          </div>
        </section>

        {serverError && <div className="alert" role="alert">{serverError}</div>}
        <div className="form-actions"><Link className="secondary-action" to={editing ? `/budgets/${id}` : `/projects/${projectId}`}>Cancelar</Link><button className="primary-action compact-action" disabled={isSubmitting} type="submit">{isSubmitting ? 'Calculando...' : editing ? 'Salvar e recalcular' : 'Criar orçamento'} <span>→</span></button></div>
      </form>
    </div>
  );
}
