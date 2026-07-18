import type { z } from 'zod';
import type { createBudgetInputSchema, websiteBudgetInputSchema } from '../schemas/budget.js';
import type { createProjectInputSchema, updateProjectInputSchema } from '../schemas/project.js';

export type WebsiteBudgetInput = z.infer<typeof websiteBudgetInputSchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetInputSchema>;
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

