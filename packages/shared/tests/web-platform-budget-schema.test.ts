import { describe, expect, it } from 'vitest';
import {
  budgetInputDataSchema,
  createBudgetEnvelopeSchema,
  getBudgetInputSchema,
  webPlatformBudgetInputSchema,
  type WebPlatformBudgetInput
} from '../src/index.js';

const validInput: WebPlatformBudgetInput = {
  platformCategory: 'SAAS',
  accountStructure: 'MULTI_ORGANIZATION',
  screenCount: 12,
  userRoleCount: 3,
  languageCount: 1,
  designApproach: 'CUSTOM_DESIGN',
  functionalModules: [
    { name: 'Gestao de usuarios', complexity: 'STANDARD' }
  ],
  adminBackoffice: 'STANDARD',
  dashboardCount: 1,
  reportCount: 2,
  additionalAuthentication: ['MFA'],
  paymentFeatures: ['SUBSCRIPTION'],
  notificationChannels: ['IN_APP', 'EMAIL'],
  fileHandling: 'BASIC_UPLOADS',
  auditLevel: 'BASIC',
  integrations: [
    { name: 'ERP do cliente', description: 'Sincronizacao de contas', complexity: 'COMPLEX' }
  ],
  dataMigration: 'STRUCTURED_IMPORT',
  dataMigrationSourceCount: 1,
  hostingPlan: 'MJM_MANAGED',
  maintenancePlan: 'STANDARD',
  targetLaunchDate: '2027-03-15',
  complexityAdjustment: 'MODERATE',
  complexityReason: 'Regras de segregacao por organizacao',
  discountPercentage: 5,
  discountReason: 'Condicao comercial aprovada'
};

function parseWith(
  override: Partial<WebPlatformBudgetInput>
) {
  return webPlatformBudgetInputSchema.safeParse({ ...validInput, ...override });
}

describe('webPlatformBudgetInputSchema', () => {
  it('accepts a complete platform input', () => {
    expect(webPlatformBudgetInputSchema.safeParse(validInput).success).toBe(true);
  });

  it('requires a description for a custom category', () => {
    const result = parseWith({
      platformCategory: 'CUSTOM',
      customCategoryDescription: '   '
    });

    expect(result.success).toBe(false);
  });

  it('normalizes names before detecting duplicate modules and integrations', () => {
    const result = parseWith({
      functionalModules: [
        { name: 'Gestao de usuarios', complexity: 'SIMPLE' },
        { name: '  GESTAO   DE USUARIOS  ', complexity: 'COMPLEX' }
      ],
      integrations: [
        { name: 'Integração ERP', complexity: 'STANDARD' },
        { name: 'integracao   erp', complexity: 'SIMPLE' }
      ]
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(['functionalModules', 'integrations'])
      );
    }
  });

  it('rejects duplicate values in controlled arrays', () => {
    const result = parseWith({
      additionalAuthentication: ['MFA', 'MFA'],
      paymentFeatures: ['SUBSCRIPTION', 'SUBSCRIPTION'],
      notificationChannels: ['EMAIL', 'EMAIL']
    });

    expect(result.success).toBe(false);
  });

  it('requires two roles for marketplace and limits split payments to it', () => {
    expect(parseWith({ platformCategory: 'MARKETPLACE', userRoleCount: 1 }).success).toBe(false);
    expect(parseWith({ platformCategory: 'SAAS', paymentFeatures: ['MARKETPLACE_SPLIT'] }).success)
      .toBe(false);
    expect(parseWith({
      platformCategory: 'MARKETPLACE',
      userRoleCount: 2,
      paymentFeatures: ['MARKETPLACE_SPLIT']
    }).success).toBe(true);
  });

  it('keeps data migration and source count consistent', () => {
    expect(parseWith({ dataMigration: 'LEGACY_MIGRATION', dataMigrationSourceCount: 0 }).success)
      .toBe(false);
    expect(parseWith({ dataMigration: 'NONE', dataMigrationSourceCount: 1 }).success).toBe(false);
    expect(parseWith({ dataMigration: 'NONE', dataMigrationSourceCount: 0 }).success).toBe(true);
  });

  it('requires reasons for complexity adjustments and discounts', () => {
    expect(parseWith({ complexityAdjustment: 'HIGH', complexityReason: undefined }).success)
      .toBe(false);
    expect(parseWith({ discountPercentage: 10, discountReason: undefined }).success).toBe(false);
  });

  it('rejects impossible calendar dates', () => {
    expect(parseWith({ targetLaunchDate: '2027-02-29' }).success).toBe(false);
    expect(parseWith({ targetLaunchDate: '2028-02-29' }).success).toBe(true);
  });

  it('rejects past launch dates while accepting the current UTC date', () => {
    const today = new Date().toISOString().slice(0, 10);

    expect(parseWith({ targetLaunchDate: '2000-01-01' }).success).toBe(false);
    expect(parseWith({ targetLaunchDate: today }).success).toBe(true);
  });

  it('rejects unknown fields at the root and in scoped items', () => {
    expect(webPlatformBudgetInputSchema.safeParse({
      ...validInput,
      unknownRootField: true
    }).success).toBe(false);

    expect(webPlatformBudgetInputSchema.safeParse({
      ...validInput,
      functionalModules: [{
        name: 'Gestao de usuarios',
        complexity: 'STANDARD',
        unknownModuleField: true
      }]
    }).success).toBe(false);
  });

  it('enforces the approved collection limits', () => {
    const modules = Array.from({ length: 31 }, (_, index) => ({
      name: `Modulo ${index + 1}`,
      complexity: 'SIMPLE' as const
    }));
    const integrations = Array.from({ length: 21 }, (_, index) => ({
      name: `Integracao ${index + 1}`,
      complexity: 'STANDARD' as const
    }));

    expect(parseWith({ functionalModules: modules }).success).toBe(false);
    expect(parseWith({ integrations }).success).toBe(false);
  });

  it('enforces the approved numeric limits', () => {
    expect(parseWith({ screenCount: 201 }).success).toBe(false);
    expect(parseWith({ userRoleCount: 21 }).success).toBe(false);
    expect(parseWith({ languageCount: 11 }).success).toBe(false);
    expect(parseWith({ dashboardCount: 21 }).success).toBe(false);
    expect(parseWith({ reportCount: 51 }).success).toBe(false);
    expect(parseWith({ dataMigrationSourceCount: 21 }).success).toBe(false);
  });
});

describe('budget input dispatch', () => {
  it('accepts platform data in the generic input schema', () => {
    expect(budgetInputDataSchema.safeParse(validInput).success).toBe(true);
  });

  it('returns the schema associated with the project application type', () => {
    expect(getBudgetInputSchema('PLATAFORMA_WEB').safeParse(validInput).success).toBe(true);
    expect(getBudgetInputSchema('WEBSITE').safeParse(validInput).success).toBe(false);
  });

  it('keeps the request envelope independent from an application schema', () => {
    const unsupportedApplicationInput = {
      inputData: { futureField: true },
      notes: 'Validado pelo backend depois de consultar o tipo do projeto'
    };

    expect(createBudgetEnvelopeSchema.safeParse(unsupportedApplicationInput).success).toBe(true);
  });

  it('rejects unknown fields outside the request envelope', () => {
    expect(createBudgetEnvelopeSchema.safeParse({
      inputData: validInput,
      unknownEnvelopeField: true
    }).success).toBe(false);
  });
});
