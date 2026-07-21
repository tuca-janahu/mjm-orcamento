export const ui = {
  pageContent: 'w-full pb-10',
  narrowPage: 'mx-auto w-full max-w-[980px] pb-10',
  pageHeading: 'flex flex-col items-start justify-between gap-8 py-8 sm:py-11 lg:flex-row lg:items-end',
  eyebrow: 'm-0 text-[0.625rem] font-bold tracking-[0.2em] text-zinc-500 uppercase',
  pageTitle: 'mt-2.5 mb-2 text-3xl leading-none font-bold tracking-[-0.045em] sm:text-[2.65rem]',
  subtitle: 'm-0 max-w-2xl text-sm leading-relaxed text-zinc-600',
  primaryAction: 'inline-flex min-h-9.5 cursor-pointer items-center justify-center gap-4 border border-zinc-950 bg-zinc-950 px-3.5 text-[0.625rem] font-bold tracking-[0.1em] text-white uppercase no-underline transition-colors hover:bg-transparent hover:text-zinc-950 disabled:cursor-wait disabled:opacity-50',
  secondaryAction: 'inline-flex min-h-9.5 cursor-pointer items-center justify-center border border-zinc-950 bg-transparent px-3.5 text-[0.625rem] font-bold tracking-[0.1em] text-zinc-950 uppercase no-underline transition-colors hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-50',
  panel: 'border border-zinc-300 bg-white',
  panelHeader: 'flex min-h-19 flex-col items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:gap-6',
  moduleStatus: 'border border-zinc-300 bg-zinc-50 px-2.5 py-2 text-[0.5625rem] font-semibold tracking-[0.12em] text-zinc-600 uppercase',
  error: 'border-l-[3px] border-red-600 bg-red-50 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-red-800',
  loading: 'w-full py-12 text-center text-[0.8125rem] text-zinc-500',
  empty: 'grid min-h-60 place-content-center justify-items-center p-8 text-center',
  emptyIcon: 'mb-4 grid h-10 w-10 place-items-center border border-zinc-300 text-xl text-zinc-500',
  form: 'grid gap-5',
  formSection: 'grid grid-cols-1 gap-8 border border-zinc-300 bg-white p-5 md:p-7 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10',
  formSectionHeading: 'flex gap-4',
  formGrid: 'grid grid-cols-1 gap-5 sm:grid-cols-2',
  formGridThree: 'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3',
  field: 'grid content-start gap-2 text-[0.625rem] font-bold tracking-[0.1em] text-zinc-600 uppercase',
  fieldWide: 'grid content-start gap-2 text-[0.625rem] font-bold tracking-[0.1em] text-zinc-600 uppercase sm:col-span-2 xl:col-span-full',
  input: 'h-9.5 w-full border-0 border-b border-zinc-300 bg-transparent text-[0.8125rem] font-normal tracking-normal text-zinc-950 normal-case outline-none transition-colors focus:border-sky-500',
  textarea: 'w-full resize-y border-0 border-b border-zinc-300 bg-transparent text-[0.8125rem] font-normal tracking-normal text-zinc-950 normal-case outline-none transition-colors focus:border-sky-500',
  fieldError: 'text-[0.625rem] font-medium tracking-normal text-red-600 normal-case',
  formActions: 'flex justify-end gap-2.5 py-2 pb-6',
  checkOption: 'relative flex min-h-13 cursor-pointer items-center gap-3 border-r border-b border-zinc-200 px-3.5 py-3 text-xs text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-950',
  checkMark: 'relative h-4 w-4 border border-zinc-400 peer-checked:border-zinc-950 peer-checked:bg-zinc-950 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-500 after:absolute after:top-px after:left-1 after:hidden after:h-2 after:w-1.5 after:rotate-45 after:border-r after:border-b after:border-white after:content-[\'\'] peer-checked:after:block'
} as const;

export function statusBadgeClass(status: string): string {
  const base = 'inline-flex w-fit border px-2 py-1 text-[0.5625rem] font-bold tracking-[0.08em] uppercase';
  if (['FINALIZADO', 'APROVADO', 'CONCLUIDO'].includes(status)) return `${base} border-green-200 bg-green-50 text-green-800`;
  if (['RECUSADO', 'CANCELADO'].includes(status)) return `${base} border-red-200 bg-red-50 text-red-800`;
  if (['ENVIADO', 'EM_EXECUCAO'].includes(status)) return `${base} border-sky-200 bg-sky-50 text-sky-800`;
  if (['RASCUNHO', 'PREPARACAO'].includes(status)) return `${base} border-amber-200 bg-amber-50 text-amber-800`;
  return `${base} border-zinc-300 bg-zinc-50 text-zinc-600`;
}
