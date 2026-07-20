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
      <main className="grid min-h-screen place-content-center justify-items-center gap-5 bg-zinc-50 text-zinc-950">
        <BrandMark />
        <span className="h-px w-24 animate-pulse bg-zinc-950" />
        <p className="m-0 text-[0.625rem] tracking-[0.18em] text-zinc-500 uppercase">Validando acesso</p>
      </main>
    );
  }

  const projectsActive = location.pathname.startsWith('/projects') || location.pathname.startsWith('/budgets');

  return (
    <main className="flex min-h-screen flex-col bg-zinc-100 px-6 text-zinc-950 md:px-10 lg:px-16">
      <header className="grid min-h-17 grid-cols-[1fr_auto] items-center border-b border-zinc-300 lg:grid-cols-[1fr_auto_1fr]">
        <NavLink className="text-inherit no-underline" to="/" aria-label="Ir para a visão geral">
          <BrandMark compact />
        </NavLink>
        <nav className="hidden self-stretch items-stretch gap-7 text-xs text-zinc-500 lg:flex" aria-label="Navegação principal">
          <NavLink className={({ isActive }) => `flex items-center border-b-2 no-underline transition-colors ${isActive ? 'border-zinc-950 text-zinc-950' : 'border-transparent text-inherit hover:border-zinc-950 hover:text-zinc-950'}`} to="/" end>Visão geral</NavLink>
          <NavLink className={`flex items-center border-b-2 no-underline transition-colors ${projectsActive ? 'border-zinc-950 text-zinc-950' : 'border-transparent text-inherit hover:border-zinc-950 hover:text-zinc-950'}`} to="/projects">Projetos e orçamentos</NavLink>
        </nav>
        <div className="flex items-center justify-self-end gap-5">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
            <span className="hidden sm:inline">{user.name}</span>
          </div>
          <button className="cursor-pointer border-0 border-b border-zinc-400 bg-transparent p-0 pb-0.5 text-[0.625rem] tracking-[0.12em] text-zinc-600 uppercase transition-colors hover:border-zinc-950 hover:text-zinc-950" type="button" onClick={() => void logout()}>Sair</button>
        </div>
      </header>
      <Outlet context={{ user }} />
      <footer className="mt-auto flex flex-col justify-between gap-3.5 py-6 text-[0.5625rem] tracking-[0.12em] text-zinc-500 uppercase sm:flex-row">
        <span>MJM Group</span>
        <span>Ferramenta de uso interno</span>
      </footer>
    </main>
  );
}
