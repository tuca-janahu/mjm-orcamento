import type { AuthUser } from '@mjm/shared';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { BrandMark } from '../components/brand-mark';
import { api } from '../lib/api';

export function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;
    void api
      .get<{ user: AuthUser }>('/auth/me')
      .then(({ data }) => { if (active) setUser(data.user); })
      .catch(() => { if (active) void navigate('/login', { replace: true }); });
    return () => { active = false; };
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

  const projectsActive = location.pathname.startsWith('/projects') || location.pathname.startsWith('/budgets');

  return (
    <main className="app-shell">
      <header className="app-header">
        <NavLink className="brand-link" to="/" aria-label="Ir para a visão geral">
          <BrandMark compact />
        </NavLink>
        <nav className="main-navigation" aria-label="Navegação principal">
          <NavLink to="/" end>Visão geral</NavLink>
          <NavLink className={projectsActive ? 'active' : ''} to="/projects">Projetos e orçamentos</NavLink>
        </nav>
        <div className="header-actions">
          <div className="user-chip">
            <span className="user-status" />
            <span>{user.name}</span>
          </div>
          <button className="text-action" type="button" onClick={() => void logout()}>Sair</button>
        </div>
      </header>
      <Outlet context={{ user }} />
      <footer className="app-footer">
        <span>MJM Group</span>
        <span>Ferramenta de uso interno</span>
      </footer>
    </main>
  );
}

