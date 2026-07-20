export const applicationTypes = [
  'WEBSITE',
  'ECOMMERCE',
  'PLATAFORMA_WEB',
  'APLICATIVO_MOBILE',
  'SISTEMA_INTERNO',
  'AUTOMACAO',
  'OUTRO'
] as const;

export const projectStatuses = [
  'PROSPECCAO',
  'PREPARACAO',
  'EM_EXECUCAO',
  'CONCLUIDO',
  'CANCELADO'
] as const;

export const budgetStatuses = [
  'RASCUNHO',
  'FINALIZADO',
  'ENVIADO',
  'APROVADO',
  'RECUSADO',
  'CANCELADO'
] as const;

export type ApplicationType = (typeof applicationTypes)[number];
export type ProjectStatus = (typeof projectStatuses)[number];
export type BudgetStatus = (typeof budgetStatuses)[number];
