import { zodResolver } from '@hookform/resolvers/zod';
import {
  applicationTypes,
  createProjectInputSchema
} from '@mjm/shared';
import axios from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { api } from '../../lib/api';
import type { ProjectSummary } from '../../lib/api-types';
import { labelFromEnum } from '../../lib/format';
import type { z } from 'zod';

type ProjectFormValues = z.input<typeof createProjectInputSchema>;
interface ApiErrorBody { error?: { message?: string } }

export function ProjectFormPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProjectFormValues>({
    resolver: zodResolver(createProjectInputSchema),
    defaultValues: { applicationType: 'WEBSITE', status: 'PROSPECCAO' }
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const { data } = await api.post<{ project: ProjectSummary }>('/projects', values);
      void navigate(`/projects/${data.project.id}`);
    } catch (error) {
      setServerError(axios.isAxiosError<ApiErrorBody>(error) ? error.response?.data.error?.message ?? 'Não foi possível criar o projeto.' : 'Não foi possível criar o projeto.');
    }
  });

  return (
    <div className="page-content narrow-page">
      <header className="page-heading">
        <div><p className="section-index">Projetos / Novo</p><h1>Novo projeto</h1><p>Cadastre o contexto comercial antes de criar o orçamento.</p></div>
      </header>
      <form className="entity-form" onSubmit={submit} noValidate>
        <section className="form-section">
          <div className="form-section-heading"><span>01</span><div><h2>Identificação</h2><p>Informações gerais do projeto e do cliente.</p></div></div>
          <div className="form-grid">
            <label className="field field-wide"><span>Nome do projeto</span><input {...register('name')} />{errors.name && <small>{errors.name.message}</small>}</label>
            <label className="field"><span>Cliente</span><input {...register('clientName')} /></label>
            <label className="field"><span>Tipo de aplicação</span><select {...register('applicationType')}>{applicationTypes.map((type) => <option value={type} key={type}>{labelFromEnum(type)}</option>)}</select></label>
            <label className="field field-wide"><span>Descrição</span><textarea rows={4} {...register('description')} /></label>
            <label className="field field-wide"><span>Observações</span><textarea rows={3} {...register('notes')} /></label>
          </div>
        </section>
        {serverError && <div className="alert">{serverError}</div>}
        <div className="form-actions"><Link className="secondary-action" to="/projects">Cancelar</Link><button className="primary-action compact-action" disabled={isSubmitting} type="submit">{isSubmitting ? 'Salvando...' : 'Criar projeto'} <span>→</span></button></div>
      </form>
    </div>
  );
}
