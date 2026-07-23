import type { z } from 'zod';
import type {
  budgetInputDataSchema,
  createBudgetEnvelopeSchema,
  internalSystemBudgetInputSchema,
  updateBudgetEnvelopeSchema,
  webPlatformBudgetInputSchema,
  websiteBudgetInputSchema
} from '../schemas/budget.js';
import type { createProjectInputSchema, updateProjectInputSchema } from '../schemas/project.js';

export type WebsiteBudgetInput = z.infer<typeof websiteBudgetInputSchema>;
export type WebPlatformBudgetInput = z.infer<typeof webPlatformBudgetInputSchema>;
export type InternalSystemBudgetInput = z.infer<typeof internalSystemBudgetInputSchema>;
export type BudgetInputData = z.infer<typeof budgetInputDataSchema>;
export type CreateBudgetEnvelope = z.infer<typeof createBudgetEnvelopeSchema>;
export type UpdateBudgetEnvelope = z.infer<typeof updateBudgetEnvelopeSchema>;
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;
