import type { AuthUser } from '@mjm/shared';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { BrandMark } from '../../components/brand-mark';
import { api } from '../../lib/api';

export function AuthenticatedHomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    void api
      .get<{ user: AuthUser }>('/auth/me')
      .then(({ data }) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) void navigate('/login', { replace: true });
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  async function logout(): Promise<void> {
    await api.post('/auth/logout');
    void navigate('/login', { replace: true });
  }

  if (user === null) {
    return (
      <main className="loading-screen">
        <BrandMark />
        <span className="loading-line" />
        <p>Validando acesso</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <BrandMark compact />
        <nav className="main-navigation" aria-label="Navegação principal">
          <span className="active-navigation-item">Visão geral</span>
          <span>Orçamentos</span>
          <span>Projetos</span>
        </nav>
        <div className="header-actions">
          <div className="user-chip">
            <span className="user-status" />
            <span>{user.name}</span>
          </div>
          <button className="text-action" type="button" onClick={() => void logout()}>
            Sair
          </button>
        </div>
      </header>

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
          <strong>0</strong>
          <small>Total cadastrado</small>
        </article>
        <article className="summary-card">
          <span>Projetos</span>
          <strong>0</strong>
          <small>Total cadastrado</small>
        </article>
        <article className="summary-card">
          <span>Em elaboração</span>
          <strong>0</strong>
          <small>Orçamentos em rascunho</small>
        </article>
      </section>

      <section className="content-panel">
        <header className="content-panel-header">
          <div>
            <p className="section-index">Atividade recente</p>
            <h2>Orçamentos</h2>
          </div>
          <span className="module-status">Módulo ainda não implementado</span>
        </header>
        <div className="empty-content">
          <span className="empty-content-icon" aria-hidden="true">＋</span>
          <h3>Nenhum orçamento cadastrado</h3>
          <p>Os orçamentos criados serão listados nesta área.</p>
        </div>
      </section>

      <footer className="app-footer">
        <span>MJM Group</span>
        <span>Ferramenta de uso interno</span>
      </footer>
    </main>
  );
}
