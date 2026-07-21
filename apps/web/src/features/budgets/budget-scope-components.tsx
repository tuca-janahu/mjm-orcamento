import type { ReactNode } from "react";

export function formatTargetDate(value?: string): string {
  if (!value) return "Não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function ScopeRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-zinc-200 pb-2.5">
      <dt className="text-[0.6875rem] text-zinc-500">{label}</dt>
      <dd className="m-0 max-w-[65%] text-right text-xs font-semibold break-words">
        {children}
      </dd>
    </div>
  );
}

export function ScopeGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3 border-t border-zinc-300 pt-4 first:border-t-0 first:pt-0">
      <h3 className="m-0 text-[0.5625rem] font-bold tracking-[0.12em] text-zinc-500 uppercase">
        {title}
      </h3>
      <dl className="m-0 grid gap-3">{children}</dl>
    </section>
  );
}

export function BudgetScopeAside({
  title,
  notes,
  children,
}: {
  title: string;
  notes: string | null;
  children: ReactNode;
}) {
  return (
    <aside className="grid content-start gap-5 border border-zinc-300 bg-white p-5.5">
      <div>
        <p className="m-0 text-[0.625rem] font-bold tracking-[0.12em] text-sky-700 uppercase">
          Escopo informado
        </p>
        <h2 className="mt-2 mb-0 text-xl">{title}</h2>
      </div>

      {children}

      {notes && (
        <div className="border-t border-zinc-300 pt-4.5">
          <span className="text-[0.5625rem] font-bold tracking-[0.1em] text-zinc-500 uppercase">
            Observações
          </span>
          <p className="mt-2 mb-0 whitespace-pre-wrap text-xs leading-relaxed text-zinc-600">
            {notes}
          </p>
        </div>
      )}
    </aside>
  );
}
