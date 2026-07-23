import { z } from 'zod';
import {
  complexityAdjustments,
  hostingPlans,
  integrationComplexities,
  maintenancePlans,
  optionalReasonSchema,
  futureTargetLaunchDateSchema
} from './common.js';
import { hasDuplicateNormalizedNames } from '../../normalization.js';

export const webPlatformCategories = [
  'CLIENT_PORTAL',
  'SAAS',
  'MARKETPLACE',
  'MEMBERSHIP_PLATFORM',
  'CUSTOM'
] as const;

export const webPlatformAccountStructures = [
  'SINGLE_ORGANIZATION',
  'MULTI_ORGANIZATION'
] as const;

export const webPlatformDesignApproaches = [
  'CLIENT_PROVIDED',
  'DESIGN_SYSTEM_ADAPTATION',
  'CUSTOM_DESIGN'
] as const;

export const webPlatformBackofficeLevels = ['NONE', 'STANDARD', 'CUSTOM'] as const;
export const webPlatformAuthenticationFeatures = ['SOCIAL_LOGIN', 'MFA', 'SSO'] as const;
export const webPlatformPaymentFeatures = [
  'ONE_TIME',
  'SUBSCRIPTION',
  'MARKETPLACE_SPLIT'
] as const;
export const webPlatformNotificationChannels = ['IN_APP', 'EMAIL', 'WHATSAPP_SMS'] as const;
export const webPlatformFileHandlingLevels = [
  'NONE',
  'BASIC_UPLOADS',
  'DOCUMENT_WORKFLOW'
] as const;
export const webPlatformAuditLevels = ['NONE', 'BASIC', 'COMPLETE'] as const;
export const webPlatformDataMigrationLevels = [
  'NONE',
  'STRUCTURED_IMPORT',
  'LEGACY_MIGRATION'
] as const;

const describedScopedItemSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1_000).optional(),
  complexity: z.enum(integrationComplexities)
}).strict();

function hasUniqueValues(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function hasUniqueScopedItemNames(values: ReadonlyArray<{ name: string }>): boolean {
  return !hasDuplicateNormalizedNames(values.map((value) => value.name));
}

export const webPlatformBudgetInputSchema = z.object({
  platformCategory: z.enum(webPlatformCategories),
  customCategoryDescription: z.string().trim().max(500).optional(),
  accountStructure: z.enum(webPlatformAccountStructures),
  screenCount: z.number().int().min(1).max(200),
  userRoleCount: z.number().int().min(1).max(20),
  languageCount: z.number().int().min(1).max(10),
  designApproach: z.enum(webPlatformDesignApproaches),
  functionalModules: z.array(describedScopedItemSchema).min(1).max(30),
  adminBackoffice: z.enum(webPlatformBackofficeLevels),
  dashboardCount: z.number().int().min(0).max(20),
  reportCount: z.number().int().min(0).max(50),
  additionalAuthentication: z.array(z.enum(webPlatformAuthenticationFeatures)),
  paymentFeatures: z.array(z.enum(webPlatformPaymentFeatures)),
  notificationChannels: z.array(z.enum(webPlatformNotificationChannels)),
  fileHandling: z.enum(webPlatformFileHandlingLevels),
  auditLevel: z.enum(webPlatformAuditLevels),
  integrations: z.array(describedScopedItemSchema).max(20),
  dataMigration: z.enum(webPlatformDataMigrationLevels),
  dataMigrationSourceCount: z.number().int().min(0).max(20),
  hostingPlan: z.enum(hostingPlans),
  maintenancePlan: z.enum(maintenancePlans),
  targetLaunchDate: futureTargetLaunchDateSchema,
  complexityAdjustment: z.enum(complexityAdjustments),
  complexityReason: optionalReasonSchema,
  discountPercentage: z.number().min(0).max(100).multipleOf(0.01),
  discountReason: optionalReasonSchema
}).strict().superRefine((value, context) => {
  if (
    value.platformCategory === 'CUSTOM'
    && (value.customCategoryDescription === undefined || value.customCategoryDescription.length === 0)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['customCategoryDescription'],
      message: 'Descreva a categoria personalizada da plataforma'
    });
  }

  if (!hasUniqueScopedItemNames(value.functionalModules)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['functionalModules'],
      message: 'Os nomes dos modulos funcionais nao podem se repetir'
    });
  }

  if (!hasUniqueScopedItemNames(value.integrations)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['integrations'],
      message: 'Os nomes das integracoes nao podem se repetir'
    });
  }

  const uniqueValueArrays: ReadonlyArray<{
    path: 'additionalAuthentication' | 'paymentFeatures' | 'notificationChannels';
    values: readonly string[];
    message: string;
  }> = [
    {
      path: 'additionalAuthentication',
      values: value.additionalAuthentication,
      message: 'Os recursos adicionais de autenticacao nao podem se repetir'
    },
    {
      path: 'paymentFeatures',
      values: value.paymentFeatures,
      message: 'Os recursos de pagamento nao podem se repetir'
    },
    {
      path: 'notificationChannels',
      values: value.notificationChannels,
      message: 'Os canais de notificacao nao podem se repetir'
    }
  ];

  for (const field of uniqueValueArrays) {
    if (!hasUniqueValues(field.values)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field.path],
        message: field.message
      });
    }
  }

  if (value.platformCategory === 'MARKETPLACE' && value.userRoleCount < 2) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['userRoleCount'],
      message: 'Marketplace exige ao menos dois perfis de usuario'
    });
  }

  if (
    value.platformCategory !== 'MARKETPLACE'
    && value.paymentFeatures.includes('MARKETPLACE_SPLIT')
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['paymentFeatures'],
      message: 'Split de pagamento esta disponivel apenas para marketplace'
    });
  }

  if (value.dataMigration !== 'NONE' && value.dataMigrationSourceCount === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dataMigrationSourceCount'],
      message: 'Informe ao menos uma fonte para migracao de dados'
    });
  }

  if (value.dataMigration === 'NONE' && value.dataMigrationSourceCount !== 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dataMigrationSourceCount'],
      message: 'A quantidade de fontes deve ser zero quando nao houver migracao'
    });
  }

  if (
    value.complexityAdjustment !== 'NONE'
    && (value.complexityReason === undefined || value.complexityReason.length === 0)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['complexityReason'],
      message: 'Justifique o ajuste de complexidade'
    });
  }

  if (
    value.discountPercentage > 0
    && (value.discountReason === undefined || value.discountReason.length === 0)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['discountReason'],
      message: 'Justifique o desconto aplicado'
    });
  }
});
