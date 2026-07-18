import { z } from 'zod';

export const websiteTypes = [
  'LANDING_PAGE',
  'INSTITUCIONAL',
  'BLOG',
  'ECOMMERCE',
  'PLATAFORMA'
] as const;
export const designTypes = ['TEMPLATE', 'PERSONALIZADO'] as const;
export const developmentTypes = ['FRONTEND', 'FULLSTACK'] as const;
export const complexityLevels = ['SIMPLES', 'MEDIO', 'COMPLEXO'] as const;
export const urgencyLevels = ['NORMAL', 'PRIORIDADE', 'EXPRESSO'] as const;

export const websiteBudgetInputSchema = z.object({
  websiteType: z.enum(websiteTypes),
  numberOfPages: z.number().int().min(1),
  designType: z.enum(designTypes),
  developmentType: z.enum(developmentTypes),
  hasAdminPanel: z.boolean(),
  integrationCount: z.number().int().min(0),
  hasPaymentSystem: z.boolean(),
  hasBlog: z.boolean(),
  hasBasicSeo: z.boolean(),
  hasDomain: z.boolean(),
  hasHosting: z.boolean(),
  complexity: z.enum(complexityLevels),
  urgency: z.enum(urgencyLevels),
  requiresMonthlyMaintenance: z.boolean(),
  discountPercentage: z.number().min(0).max(100),
  estimatedDeadlineDays: z.number().int().positive().optional()
});

export const createBudgetInputSchema = z.object({
  inputData: websiteBudgetInputSchema,
  notes: z.string().trim().max(4_000).optional()
});

export const updateBudgetInputSchema = createBudgetInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Informe ao menos um campo'
);

