import { z } from 'zod';
import {
  complexityAdjustments,
  futureTargetLaunchDateSchema,
  hostingPlans,
  integrationComplexities,
  maintenancePlans,
  optionalReasonSchema
} from './common.js';

export const internalSystemPermissionModels = [
  'STANDARD_ROLES',
  'CUSTOM_PERMISSIONS'
] as const;

export const internalSystemAuthenticationFeatures = [
  'MFA',
  'CORPORATE_SSO'
] as const;

export const internalSystemWorkflowLevels = ['NONE', 'SIMPLE', 'CUSTOM'] as const;

export const internalSystemDocumentManagementLevels = [
  'NONE',
  'BASIC_ATTACHMENTS',
  'DOCUMENT_WORKFLOW'
] as const;

export const internalSystemNotificationChannels = ['EMAIL', 'WHATSAPP_SMS'] as const;

export const internalSystemDataMigrationLevels = [
  'NONE',
  'STRUCTURED_IMPORT',
  'LEGACY_MIGRATION'
] as const;

const optionalDescriptionSchema = z.preprocess(
  (value) => typeof value === 'string' && value.trim().length === 0 ? undefined : value,
  z.string().trim().max(1_000).optional()
);

export const internalSystemScopedItemSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: optionalDescriptionSchema,
  complexity: z.enum(integrationComplexities)
}).strict();

function normalizeScopedItemName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFKD')
    .replace(/\p{Mark}/gu, '')
    .toLocaleLowerCase('pt-BR');
}

function hasUniqueValues(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function hasUniqueScopedItemNames(values: ReadonlyArray<{ name: string }>): boolean {
  return hasUniqueValues(values.map((value) => normalizeScopedItemName(value.name)));
}

export const internalSystemBudgetInputSchema = z.object({
  modules: z.array(internalSystemScopedItemSchema).min(1).max(20),
  accessProfileCount: z.number().int().min(1).max(20),
  targetLaunchDate: futureTargetLaunchDateSchema,
  permissionModel: z.enum(internalSystemPermissionModels),
  additionalAuthentication: z.array(z.enum(internalSystemAuthenticationFeatures)),
  workflowLevel: z.enum(internalSystemWorkflowLevels),
  documentManagement: z.enum(internalSystemDocumentManagementLevels),
  dashboardCount: z.number().int().min(1).max(20),
  reportCount: z.number().int().min(0).max(50),
  additionalNotificationChannels: z.array(z.enum(internalSystemNotificationChannels)),
  integrations: z.array(internalSystemScopedItemSchema).max(10),
  dataMigration: z.enum(internalSystemDataMigrationLevels),
  dataMigrationSourceCount: z.number().int().min(0).max(20),
  dataMigrationDescription: optionalDescriptionSchema,
  hostingPlan: z.enum(hostingPlans),
  maintenancePlan: z.enum(maintenancePlans),
  complexityAdjustment: z.enum(complexityAdjustments),
  complexityReason: optionalReasonSchema,
  discountPercentage: z.number().min(0).max(100).multipleOf(0.01),
  discountReason: optionalReasonSchema
}).strict().superRefine((value, context) => {
  if (!hasUniqueScopedItemNames(value.modules)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['modules'],
      message: 'Os nomes dos módulos não podem se repetir'
    });
  }

  if (!hasUniqueScopedItemNames(value.integrations)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['integrations'],
      message: 'Os nomes das integrações não podem se repetir'
    });
  }

  if (!hasUniqueValues(value.additionalAuthentication)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['additionalAuthentication'],
      message: 'Os recursos adicionais de autenticação não podem se repetir'
    });
  }

  if (!hasUniqueValues(value.additionalNotificationChannels)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['additionalNotificationChannels'],
      message: 'Os canais adicionais de notificação não podem se repetir'
    });
  }

  if (value.dataMigration === 'NONE') {
    if (value.dataMigrationSourceCount !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dataMigrationSourceCount'],
        message: 'A quantidade de fontes deve ser zero quando não houver migração'
      });
    }

    if (value.dataMigrationDescription !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dataMigrationDescription'],
        message: 'A descrição deve estar ausente quando não houver migração'
      });
    }
  } else {
    if (value.dataMigrationSourceCount === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dataMigrationSourceCount'],
        message: 'Informe ao menos uma fonte para migração de dados'
      });
    }

    if (value.dataMigrationDescription === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dataMigrationDescription'],
        message: 'Descreva as fontes da migração de dados'
      });
    }
  }

  if (value.complexityAdjustment === 'NONE') {
    if (value.complexityReason !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['complexityReason'],
        message: 'A justificativa deve estar ausente quando não houver ajuste de complexidade'
      });
    }
  } else if (value.complexityReason === undefined || value.complexityReason.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['complexityReason'],
      message: 'Justifique o ajuste de complexidade'
    });
  }

  if (value.discountPercentage === 0) {
    if (value.discountReason !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountReason'],
        message: 'A justificativa deve estar ausente quando não houver desconto'
      });
    }
  } else if (value.discountReason === undefined || value.discountReason.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['discountReason'],
      message: 'Justifique o desconto aplicado'
    });
  }
});
