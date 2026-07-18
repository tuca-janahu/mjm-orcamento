import { z } from 'zod';
import { applicationTypes, projectStatuses } from '../enums/domain.js';

export const createProjectInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  clientName: z.string().trim().max(160).optional(),
  description: z.string().trim().max(2_000).optional(),
  applicationType: z.enum(applicationTypes),
  status: z.enum(projectStatuses).default('PROSPECCAO'),
  notes: z.string().trim().max(4_000).optional()
});

export const updateProjectInputSchema = createProjectInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Informe ao menos um campo'
);

