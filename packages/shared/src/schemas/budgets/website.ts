import { z } from 'zod';
import {
  complexityAdjustments,
  hostingPlans,
  integrationComplexities,
  maintenancePlans,
  optionalReasonSchema,
  targetLaunchDateSchema
} from './common.js';

export const websiteCategories = [
  'LANDING_PAGE',
  'INSTITUCIONAL',
  'PORTAL_CONTEUDO'
] as const;

export const contentResponsibilities = [
  'CLIENT_PROVIDES_READY',
  'MJM_MIGRATES_EXISTING',
  'MJM_PRODUCES_CONTENT'
] as const;

export const designApproaches = [
  'CLIENT_PROVIDED',
  'TEMPLATE_CUSTOMIZATION',
  'CUSTOM_DESIGN'
] as const;

export const contentManagementLevels = [
  'NONE',
  'STANDARD_CMS',
  'CUSTOM_ADMIN'
] as const;

export const additionalWebsiteModules = ['BLOG', 'SITE_SEARCH'] as const;

export const seoLevels = [
  'TECHNICAL_BASELINE',
  'ON_PAGE_SETUP',
  'CONTENT_STRATEGY'
] as const;

export const domainServices = [
  'CLIENT_MANAGED',
  'NEW_REGISTRATION',
  'TRANSFER',
  'CONFIGURATION_ONLY'
] as const;

export const websiteTechnicalLimits = {
  sectionCount: 200,
  pageCount: 200,
  uniqueLayoutCount: 200,
  contentMigrationCount: 200,
  simpleFormCount: 100,
  advancedFormCount: 50
} as const;

const integrationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  complexity: z.enum(integrationComplexities)
}).strict();

export const websiteBudgetInputSchema = z.object({
  websiteCategory: z.enum(websiteCategories),
  sectionCount: z.number().int().min(1).max(websiteTechnicalLimits.sectionCount),
  pageCount: z.number().int().min(1).max(websiteTechnicalLimits.pageCount),
  uniqueLayoutCount: z.number().int().min(1).max(websiteTechnicalLimits.uniqueLayoutCount),
  languageCount: z.number().int().min(1).max(10),
  contentResponsibility: z.enum(contentResponsibilities),
  contentMigrationCount: z.number().int().min(0).max(websiteTechnicalLimits.contentMigrationCount),
  designApproach: z.enum(designApproaches),
  contentManagement: z.enum(contentManagementLevels),
  simpleFormCount: z.number().int().min(0).max(websiteTechnicalLimits.simpleFormCount),
  advancedFormCount: z.number().int().min(0).max(websiteTechnicalLimits.advancedFormCount),
  integrations: z.array(integrationSchema).max(20),
  additionalModules: z.array(z.enum(additionalWebsiteModules)),
  seoLevel: z.enum(seoLevels),
  domainService: z.enum(domainServices),
  hostingPlan: z.enum(hostingPlans),
  maintenancePlan: z.enum(maintenancePlans),
  targetLaunchDate: targetLaunchDateSchema,
  complexityAdjustment: z.enum(complexityAdjustments),
  complexityReason: optionalReasonSchema,
  discountPercentage: z.number().min(0).max(100).multipleOf(0.01),
  discountReason: optionalReasonSchema
}).strict().superRefine((value, context) => {
  if (
    value.websiteCategory !== 'LANDING_PAGE'
    && value.uniqueLayoutCount > value.pageCount
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['uniqueLayoutCount'],
      message: 'A quantidade de layouts nao pode exceder a quantidade de paginas'
    });
  }

  if (new Set(value.additionalModules).size !== value.additionalModules.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['additionalModules'],
      message: 'Os modulos adicionais nao podem se repetir'
    });
  }

  if (
    value.websiteCategory === 'PORTAL_CONTEUDO'
    && value.additionalModules.includes('BLOG')
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['additionalModules'],
      message: 'Portal de conteudo ja inclui o modulo de blog'
    });
  }

  if (
    value.contentResponsibility === 'MJM_MIGRATES_EXISTING'
    && value.contentMigrationCount === 0
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['contentMigrationCount'],
      message: 'Informe ao menos um item para migracao de conteudo'
    });
  }

  if (
    value.contentResponsibility !== 'MJM_MIGRATES_EXISTING'
    && value.contentMigrationCount !== 0
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['contentMigrationCount'],
      message: 'A quantidade de migracao deve ser zero para a responsabilidade selecionada'
    });
  }

  if (
    value.websiteCategory === 'PORTAL_CONTEUDO'
    && value.contentManagement === 'NONE'
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['contentManagement'],
      message: 'Portal de conteudo exige gerenciamento de conteudo'
    });
  }

  if (
    value.additionalModules.includes('BLOG')
    && value.contentManagement === 'NONE'
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['contentManagement'],
      message: 'O modulo de blog exige gerenciamento de conteudo'
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
