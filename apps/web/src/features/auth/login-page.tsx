import { zodResolver } from '@hookform/resolvers/zod';
import { loginInputSchema, type LoginInput } from '@mjm/shared';
import axios from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { BrandMark } from '../../components/brand-mark';
import { api } from '../../lib/api';

interface ApiErrorBody {
  error?: { message?: string };
}

export function LoginPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginInput>({ resolver: zodResolver(loginInputSchema) });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await api.post('/auth/login', values);
      void navigate('/');
    } catch (error) {
      if (axios.isAxiosError<ApiErrorBody>(error)) {
        setServerError(error.response?.data?.error?.message ?? 'Nao foi possivel entrar');
      } else {
        setServerError('Nao foi possivel entrar');
      }
    }
  });

  return (
    <main className="login-page">
      <aside className="login-sidebar" aria-label="MJM Orçamentos">
        <BrandMark />

        <div className="sidebar-context">
          <span>Portal interno</span>
          <strong>Gestão de orçamentos</strong>
        </div>

        <span className="sidebar-footer">Acesso restrito</span>
      </aside>

      <section className="login-form-panel">
        <form className="login-card" onSubmit={submit} noValidate>
          <header className="login-card-header">
            <p className="section-index">Autenticação</p>
            <h1>Entrar</h1>
            <p>Informe suas credenciais para acessar a plataforma.</p>
          </header>

          <div className="form-fields">
            <label>
              <span>E-mail</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com.br"
                {...register('email')}
              />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </label>

            <label>
              <span>Senha</span>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Sua senha"
                {...register('password')}
              />
              {errors.password && <span className="field-error">{errors.password.message}</span>}
            </label>
          </div>

          {serverError && <div className="alert" role="alert">{serverError}</div>}

          <button className="primary-action" type="submit" disabled={isSubmitting}>
            <span>{isSubmitting ? 'Entrando...' : 'Entrar na plataforma'}</span>
            <span aria-hidden="true">↗</span>
          </button>

          <p className="security-note">
            Ambiente interno · Cookie seguro
          </p>
        </form>
      </section>
    </main>
  );
}
