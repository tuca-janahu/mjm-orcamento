import { z } from 'zod';

export const integrationComplexities = ['SIMPLE', 'STANDARD', 'COMPLEX'] as const;
export const hostingPlans = ['CLIENT_MANAGED', 'MJM_STANDARD', 'MJM_MANAGED'] as const;
export const maintenancePlans = ['NONE', 'ESSENTIAL', 'STANDARD', 'CUSTOM'] as const;
export const complexityAdjustments = ['NONE', 'MODERATE', 'HIGH'] as const;

export const optionalReasonSchema = z.string().trim().max(500).optional();

function isValidDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function currentUtcDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

export const targetLaunchDateSchema = z.string()
  .refine(isValidDateOnly, 'Informe uma data valida no formato YYYY-MM-DD')
  .optional();

export const futureTargetLaunchDateSchema = targetLaunchDateSchema.refine(
  (value) => value === undefined || value >= currentUtcDateOnly(),
  'A data prevista de lancamento nao pode estar no passado'
);
