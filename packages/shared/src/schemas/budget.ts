import { z } from 'zod';

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

export const integrationComplexities = ['SIMPLE', 'STANDARD', 'COMPLEX'] as const;
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

export const hostingPlans = ['CLIENT_MANAGED', 'MJM_STANDARD', 'MJM_MANAGED'] as const;
export const maintenancePlans = ['NONE', 'ESSENTIAL', 'STANDARD', 'CUSTOM'] as const;
export const complexityAdjustments = ['NONE', 'MODERATE', 'HIGH'] as const;

const integrationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  complexity: z.enum(integrationComplexities)
});

const optionalReasonSchema = z.string().trim().max(500).optional();

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

export const websiteBudgetInputSchema = z.object({
  websiteCategory: z.enum(websiteCategories),
  sectionCount: z.number().int().min(1),
  pageCount: z.number().int().min(1),
  uniqueLayoutCount: z.number().int().min(1),
  languageCount: z.number().int().min(1).max(10),
  contentResponsibility: z.enum(contentResponsibilities),
  contentMigrationCount: z.number().int().min(0),
  designApproach: z.enum(designApproaches),
  contentManagement: z.enum(contentManagementLevels),
  simpleFormCount: z.number().int().min(0),
  advancedFormCount: z.number().int().min(0),
  integrations: z.array(integrationSchema).max(20),
  additionalModules: z.array(z.enum(additionalWebsiteModules)),
  seoLevel: z.enum(seoLevels),
  domainService: z.enum(domainServices),
  hostingPlan: z.enum(hostingPlans),
  maintenancePlan: z.enum(maintenancePlans),
  targetLaunchDate: z.string()
    .refine(isValidDateOnly, 'Informe uma data valida no formato YYYY-MM-DD')
    .optional(),
  complexityAdjustment: z.enum(complexityAdjustments),
  complexityReason: optionalReasonSchema,
  discountPercentage: z.number().min(0).max(100).multipleOf(0.01),
  discountReason: optionalReasonSchema
}).superRefine((value, context) => {
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

export const createBudgetInputSchema = z.object({
  inputData: websiteBudgetInputSchema,
  notes: z.string().trim().max(4_000).optional()
});

export const updateBudgetInputSchema = createBudgetInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Informe ao menos um campo'
);
