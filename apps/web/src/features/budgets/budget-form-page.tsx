import { zodResolver } from '@hookform/resolvers/zod';
import {
  additionalWebsiteModules,
  complexityAdjustments,
  contentManagementLevels,
  contentResponsibilities,
  createBudgetInputSchema,
  designApproaches,
  domainServices,
  hostingPlans,
  integrationComplexities,
  maintenancePlans,
  seoLevels,
  websiteCategories,
  type CreateBudgetInput
} from '@mjm/shared';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../../lib/api';
import type { BudgetDto, ProjectSummary } from '../../lib/api-types';
import { labelFromEnum } from '../../lib/format';
import { ui } from '../../lib/ui';

const defaultValues: CreateBudgetInput = {
  inputData: {
    websiteCategory: 'INSTITUCIONAL',
    sectionCount: 5,
    pageCount: 5,
    uniqueLayoutCount: 2,
    languageCount: 1,
    contentResponsibility: 'CLIENT_PROVIDES_READY',
    contentMigrationCount: 0,
    designApproach: 'TEMPLATE_CUSTOMIZATION',
    contentManagement: 'NONE',
    simpleFormCount: 0,
    advancedFormCount: 0,
    integrations: [],
    additionalModules: [],
    seoLevel: 'TECHNICAL_BASELINE',
    domainService: 'CLIENT_MANAGED',
    hostingPlan: 'CLIENT_MANAGED',
    maintenancePlan: 'NONE',
    complexityAdjustment: 'NONE',
    discountPercentage: 0
  }
};

const optionLabels: Record<string, string> = {
  LANDING_PAGE: 'Landing page',
  INSTITUCIONAL: 'Site institucional',
  PORTAL_CONTEUDO: 'Portal de conteúdo',
  CLIENT_PROVIDES_READY: 'Cliente fornece conteúdo pronto',
  MJM_MIGRATES_EXISTING: 'MJM migra conteúdo existente',
  MJM_PRODUCES_CONTENT: 'MJM produz o conteúdo',
  CLIENT_PROVIDED: 'Design fornecido pelo cliente',
  TEMPLATE_CUSTOMIZATION: 'Adaptação de template',
  CUSTOM_DESIGN: 'Design personalizado',
  NONE: 'Nenhum',
  STANDARD_CMS: 'CMS padrão',
  CUSTOM_ADMIN: 'Painel administrativo personalizado',
  SIMPLE: 'Simples',
  STANDARD: 'Padrão',
  COMPLEX: 'Complexa',
  BLOG: 'Blog',
  SITE_SEARCH: 'Busca interna',
  TECHNICAL_BASELINE: 'Base técnica',
  ON_PAGE_SETUP: 'Configuração on-page',
  CONTENT_STRATEGY: 'Estratégia de conteúdo',
  CLIENT_MANAGED: 'Gerenciado pelo cliente',
  NEW_REGISTRATION: 'Novo registro',
  TRANSFER: 'Transferência',
  CONFIGURATION_ONLY: 'Somente configuração',
  MJM_STANDARD: 'Hospedagem MJM padrão',
  MJM_MANAGED: 'Hospedagem gerenciada pela MJM',
  ESSENTIAL: 'Essencial',
  CUSTOM: 'Personalizado',
  MODERATE: 'Moderado',
  HIGH: 'Alto'
};

function optionLabel(value: string): string {
  return optionLabels[value] ?? labelFromEnum(value);
}

function FieldError({ message }: { message: string | undefined }) {
  return message ? <small className={ui.fieldError}>{message}</small> : null;
}

interface ApiErrorBody { error?: { message?: string } }

export function BudgetFormPage() {
  const { projectId, id } = useParams();
  const editing = id !== undefined;
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(editing);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    getValues,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CreateBudgetInput>({
    resolver: zodResolver(createBudgetInputSchema),
    defaultValues
  });
  const { fields: integrationFields, append: appendIntegration, remove: removeIntegration } = useFieldArray({
    control,
    name: 'inputData.integrations'
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

  const websiteCategory = watch('inputData.websiteCategory');
  const contentResponsibility = watch('inputData.contentResponsibility');
  const complexityAdjustment = watch('inputData.complexityAdjustment');
  const discountPercentage = watch('inputData.discountPercentage');
  const selectedModules = watch('inputData.additionalModules');

  useEffect(() => {
    if (contentResponsibility !== 'MJM_MIGRATES_EXISTING') {
      setValue('inputData.contentMigrationCount', 0);
    }
  }, [contentResponsibility, setValue]);

  useEffect(() => {
    if (websiteCategory !== 'PORTAL_CONTEUDO') return;

    if (getValues('inputData.contentManagement') === 'NONE') {
      setValue('inputData.contentManagement', 'STANDARD_CMS', { shouldValidate: true });
    }

    const modules = getValues('inputData.additionalModules');
    if (modules.includes('BLOG')) {
      setValue('inputData.additionalModules', modules.filter((module) => module !== 'BLOG'), { shouldValidate: true });
    }
  }, [getValues, setValue, websiteCategory]);

  if (loading) return <div className={ui.loading}>Carregando orçamento...</div>;

  return (
    <div className={ui.pageContent}>
      <header className={ui.pageHeading}>
        <div><p className={ui.eyebrow}>{editing ? 'Orçamentos / Editar rascunho' : 'Orçamentos / Nova versão'}</p><h1 className={ui.pageTitle}>{editing ? 'Editar orçamento' : 'Novo orçamento'}</h1><p className={ui.subtitle}>{project?.name ?? 'Projeto WEBSITE'} · os valores serão calculados pela API ao salvar.</p></div>
      </header>

      <form className={ui.form} onSubmit={submit} noValidate>
        <section className={ui.formSection}>
          <div className={ui.formSectionHeading}><span className="text-[0.625rem] font-bold text-zinc-400">01</span><div><h2 className="m-0 mb-2 text-sm font-semibold">Estrutura</h2><p className="m-0 text-xs leading-relaxed text-zinc-500">Defina o formato, o volume e o prazo desejado para o website.</p></div></div>
          <div className={ui.formGridThree}>
            <label className={ui.field}><span>Categoria do website</span><select className={ui.input} {...register('inputData.websiteCategory')}>{websiteCategories.map((value) => <option value={value} key={value}>{optionLabel(value)}</option>)}</select><FieldError message={errors.inputData?.websiteCategory?.message} /></label>
            {websiteCategory === 'LANDING_PAGE' ? (
              <label className={ui.field}><span>Número de seções</span><input className={ui.input} type="number" min="1" {...register('inputData.sectionCount', { valueAsNumber: true })} /><FieldError message={errors.inputData?.sectionCount?.message} /></label>
            ) : (
              <>
                <label className={ui.field}><span>Número de páginas</span><input className={ui.input} type="number" min="1" {...register('inputData.pageCount', { valueAsNumber: true })} /><FieldError message={errors.inputData?.pageCount?.message} /></label>
                <label className={ui.field}><span>Layouts únicos</span><input className={ui.input} type="number" min="1" {...register('inputData.uniqueLayoutCount', { valueAsNumber: true })} /><FieldError message={errors.inputData?.uniqueLayoutCount?.message} /></label>
              </>
            )}
            <label className={ui.field}><span>Idiomas</span><input className={ui.input} type="number" min="1" {...register('inputData.languageCount', { valueAsNumber: true })} /><FieldError message={errors.inputData?.languageCount?.message} /></label>
            <label className={ui.field}><span>Data desejada de lançamento</span><input className={ui.input} type="date" {...register('inputData.targetLaunchDate', { setValueAs: (value: string) => value === '' ? undefined : value })} /><FieldError message={errors.inputData?.targetLaunchDate?.message} /></label>
          </div>
        </section>

        <section className={ui.formSection}>
          <div className={ui.formSectionHeading}><span className="text-[0.625rem] font-bold text-zinc-400">02</span><div><h2 className="m-0 mb-2 text-sm font-semibold">Conteúdo e design</h2><p className="m-0 text-xs leading-relaxed text-zinc-500">Informe quem prepara o conteúdo e a abordagem visual e administrativa.</p></div></div>
          <div className={ui.formGridThree}>
            <label className={ui.field}><span>Responsabilidade pelo conteúdo</span><select className={ui.input} {...register('inputData.contentResponsibility')}>{contentResponsibilities.map((value) => <option value={value} key={value}>{optionLabel(value)}</option>)}</select><FieldError message={errors.inputData?.contentResponsibility?.message} /></label>
            {contentResponsibility === 'MJM_MIGRATES_EXISTING' && <label className={ui.field}><span>Conteúdos a migrar</span><input className={ui.input} type="number" min="1" {...register('inputData.contentMigrationCount', { valueAsNumber: true })} /><FieldError message={errors.inputData?.contentMigrationCount?.message} /></label>}
            <label className={ui.field}><span>Abordagem de design</span><select className={ui.input} {...register('inputData.designApproach')}>{designApproaches.map((value) => <option value={value} key={value}>{optionLabel(value)}</option>)}</select><FieldError message={errors.inputData?.designApproach?.message} /></label>
            <label className={ui.field}><span>Gestão de conteúdo</span><select className={ui.input} {...register('inputData.contentManagement')}>{contentManagementLevels.filter((value) => websiteCategory !== 'PORTAL_CONTEUDO' || value !== 'NONE').map((value) => <option value={value} key={value}>{optionLabel(value)}</option>)}</select><FieldError message={errors.inputData?.contentManagement?.message} /></label>
          </div>
        </section>

        <section className={ui.formSection}>
          <div className={ui.formSectionHeading}><span className="text-[0.625rem] font-bold text-zinc-400">03</span><div><h2 className="m-0 mb-2 text-sm font-semibold">Funcionalidades</h2><p className="m-0 text-xs leading-relaxed text-zinc-500">Dimensione formulários, integrações externas e módulos adicionais.</p></div></div>
          <div className="grid gap-7">
            <div className={ui.formGrid}>
              <label className={ui.field}><span>Formulários simples</span><input className={ui.input} type="number" min="0" {...register('inputData.simpleFormCount', { valueAsNumber: true })} /><FieldError message={errors.inputData?.simpleFormCount?.message} /></label>
              <label className={ui.field}><span>Formulários avançados</span><input className={ui.input} type="number" min="0" {...register('inputData.advancedFormCount', { valueAsNumber: true })} /><FieldError message={errors.inputData?.advancedFormCount?.message} /></label>
            </div>

            <div className="grid gap-3 border-t border-zinc-200 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="m-0 text-xs font-semibold">Integrações</h3><p className="mt-1 mb-0 text-[0.6875rem] text-zinc-500">Identifique cada serviço e o nível de trabalho necessário.</p></div><button className={ui.secondaryAction} disabled={integrationFields.length >= 20} type="button" onClick={() => appendIntegration({ name: '', complexity: 'SIMPLE' })}>Adicionar integração</button></div>
              {integrationFields.length === 0 && <p className="m-0 border border-dashed border-zinc-300 px-4 py-5 text-center text-xs text-zinc-500">Nenhuma integração adicionada.</p>}
              {integrationFields.map((field, index) => (
                <div className="grid grid-cols-1 items-start gap-4 border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-[minmax(0,1fr)_180px_auto]" key={field.id}>
                  <label className={ui.field}><span>Nome da integração</span><input className={ui.input} placeholder="Ex.: HubSpot" {...register(`inputData.integrations.${index}.name`)} /><FieldError message={errors.inputData?.integrations?.[index]?.name?.message} /></label>
                  <label className={ui.field}><span>Complexidade</span><select className={ui.input} {...register(`inputData.integrations.${index}.complexity`)}>{integrationComplexities.map((value) => <option value={value} key={value}>{optionLabel(value)}</option>)}</select><FieldError message={errors.inputData?.integrations?.[index]?.complexity?.message} /></label>
                  <button className={`${ui.secondaryAction} mt-4 sm:mt-3.5`} type="button" onClick={() => removeIntegration(index)}>Remover</button>
                </div>
              ))}
              <FieldError message={errors.inputData?.integrations?.root?.message} />
            </div>

            <div className="grid gap-3 border-t border-zinc-200 pt-5">
              <span className="text-[0.625rem] font-bold tracking-[0.1em] text-zinc-600 uppercase">Módulos adicionais</span>
              <div className="grid grid-cols-1 border-t border-l border-zinc-200 sm:grid-cols-2">
                {additionalWebsiteModules.map((module) => {
                  const unavailable = websiteCategory === 'PORTAL_CONTEUDO' && module === 'BLOG';
                  return <label className={`${ui.checkOption} ${unavailable ? 'cursor-not-allowed bg-zinc-50 text-zinc-400' : ''}`} key={module}><input className="peer absolute h-px w-px opacity-0" type="checkbox" checked={selectedModules.includes(module)} disabled={unavailable} onChange={(event) => setValue('inputData.additionalModules', event.target.checked ? [...selectedModules, module] : selectedModules.filter((selected) => selected !== module), { shouldDirty: true, shouldValidate: true })} /><span className={ui.checkMark} /><span>{optionLabel(module)}{unavailable ? ' (já incluído no portal)' : ''}</span></label>;
                })}
              </div>
              <FieldError message={errors.inputData?.additionalModules?.message} />
            </div>
          </div>
        </section>

        <section className={ui.formSection}>
          <div className={ui.formSectionHeading}><span className="text-[0.625rem] font-bold text-zinc-400">04</span><div><h2 className="m-0 mb-2 text-sm font-semibold">Entrega e operação</h2><p className="m-0 text-xs leading-relaxed text-zinc-500">Defina SEO, domínio, hospedagem e suporte após a publicação.</p></div></div>
          <div className={ui.formGridThree}>
            <label className={ui.field}><span>SEO</span><select className={ui.input} {...register('inputData.seoLevel')}>{seoLevels.map((value) => <option value={value} key={value}>{optionLabel(value)}</option>)}</select><FieldError message={errors.inputData?.seoLevel?.message} /></label>
            <label className={ui.field}><span>Serviço de domínio</span><select className={ui.input} {...register('inputData.domainService')}>{domainServices.map((value) => <option value={value} key={value}>{optionLabel(value)}</option>)}</select><FieldError message={errors.inputData?.domainService?.message} /></label>
            <label className={ui.field}><span>Hospedagem</span><select className={ui.input} {...register('inputData.hostingPlan')}>{hostingPlans.map((value) => <option value={value} key={value}>{optionLabel(value)}</option>)}</select><FieldError message={errors.inputData?.hostingPlan?.message} /></label>
            <label className={ui.field}><span>Plano de manutenção</span><select className={ui.input} {...register('inputData.maintenancePlan')}>{maintenancePlans.map((value) => <option value={value} key={value}>{optionLabel(value)}</option>)}</select><FieldError message={errors.inputData?.maintenancePlan?.message} /></label>
          </div>
        </section>

        <section className={ui.formSection}>
          <div className={ui.formSectionHeading}><span className="text-[0.625rem] font-bold text-zinc-400">05</span><div><h2 className="m-0 mb-2 text-sm font-semibold">Ajustes comerciais</h2><p className="m-0 text-xs leading-relaxed text-zinc-500">Registre ajustes excepcionais e suas justificativas.</p></div></div>
          <div className={ui.formGridThree}>
            <label className={ui.field}><span>Ajuste de complexidade</span><select className={ui.input} {...register('inputData.complexityAdjustment')}>{complexityAdjustments.map((value) => <option value={value} key={value}>{optionLabel(value)}</option>)}</select><FieldError message={errors.inputData?.complexityAdjustment?.message} /></label>
            {complexityAdjustment !== 'NONE' && <label className="grid content-start gap-2 text-[0.625rem] font-bold tracking-[0.1em] text-zinc-600 uppercase sm:col-span-2"><span>Justificativa da complexidade</span><input className={ui.input} {...register('inputData.complexityReason')} /><FieldError message={errors.inputData?.complexityReason?.message} /></label>}
            <label className={ui.field}><span>Desconto (%)</span><input className={ui.input} type="number" min="0" max="100" step="0.01" {...register('inputData.discountPercentage', { valueAsNumber: true })} /><FieldError message={errors.inputData?.discountPercentage?.message} /></label>
            {Number(discountPercentage) > 0 && <label className="grid content-start gap-2 text-[0.625rem] font-bold tracking-[0.1em] text-zinc-600 uppercase sm:col-span-2"><span>Justificativa do desconto</span><input className={ui.input} {...register('inputData.discountReason')} /><FieldError message={errors.inputData?.discountReason?.message} /></label>}
            <label className={ui.fieldWide}><span>Observações</span><textarea className={ui.textarea} rows={4} {...register('notes')} /><FieldError message={errors.notes?.message} /></label>
          </div>
        </section>

        {serverError && <div className={ui.error} role="alert">{serverError}</div>}
        <div className={ui.formActions}><Link className={ui.secondaryAction} to={editing ? `/budgets/${id}` : `/projects/${projectId}`}>Cancelar</Link><button className={`${ui.primaryAction} min-w-48`} disabled={isSubmitting} type="submit">{isSubmitting ? 'Calculando...' : editing ? 'Salvar e recalcular' : 'Criar orçamento'} <span>→</span></button></div>
      </form>
    </div>
  );
}
