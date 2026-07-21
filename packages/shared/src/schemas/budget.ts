import { z } from 'zod';
import { webPlatformBudgetInputSchema } from './budgets/web-platform.js';
import { websiteBudgetInputSchema } from './budgets/website.js';

export * from './budgets/common.js';
export * from './budgets/web-platform.js';
export * from './budgets/website.js';

export const supportedBudgetApplicationTypes = ['WEBSITE', 'PLATAFORMA_WEB'] as const;

export const budgetInputDataSchema = z.union([
  websiteBudgetInputSchema,
  webPlatformBudgetInputSchema
]);

export const budgetInputSchemas = {
  WEBSITE: websiteBudgetInputSchema,
  PLATAFORMA_WEB: webPlatformBudgetInputSchema
} as const;

export type SupportedBudgetApplicationType = (typeof supportedBudgetApplicationTypes)[number];

export function getBudgetInputSchema(applicationType: SupportedBudgetApplicationType) {
  return budgetInputSchemas[applicationType];
}

export const createBudgetInputSchema = z.object({
  inputData: budgetInputDataSchema,
  notes: z.string().trim().max(4_000).optional()
}).strict();

export const updateBudgetInputSchema = createBudgetInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Informe ao menos um campo'
);

export const createBudgetEnvelopeSchema = z.object({
  inputData: z.unknown(),
  notes: z.string().trim().max(4_000).optional()
}).strict();

export const updateBudgetEnvelopeSchema = createBudgetEnvelopeSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Informe ao menos um campo'
);
