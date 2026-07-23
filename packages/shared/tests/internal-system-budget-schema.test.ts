import { describe, expect, it } from 'vitest';
import {
  budgetInputDataSchema,
  getBudgetInputSchema,
  internalSystemBudgetInputSchema,
  supportedBudgetApplicationTypes,
  type InternalSystemBudgetInput
} from '../src/index.js';

const validInput: InternalSystemBudgetInput = {
  modules: [
    { name: 'Controle de estoque', complexity: 'STANDARD' }
  ],
  accessProfileCount: 2,
  permissionModel: 'STANDARD_ROLES',
  additionalAuthentication: [],
  workflowLevel: 'NONE',
  documentManagement: 'NONE',
  dashboardCount: 1,
  reportCount: 0,
  additionalNotificationChannels: [],
  integrations: [],
  dataMigration: 'NONE',
  dataMigrationSourceCount: 0,
  hostingPlan: 'CLIENT_MANAGED',
  maintenancePlan: 'NONE',
  complexityAdjustment: 'NONE',
  discountPercentage: 0
};

function parseWith(override: Partial<InternalSystemBudgetInput>) {
  return internalSystemBudgetInputSchema.safeParse({ ...validInput, ...override });
}

function scopedItems(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    name: `Item ${index + 1}`,
    complexity: 'STANDARD' as const
  }));
}

describe('internalSystemBudgetInputSchema', () => {
  it('accepts the minimum approved payload', () => {
    expect(internalSystemBudgetInputSchema.parse(validInput)).toEqual(validInput);
  });

  it('is strict at the root and inside modules and integrations', () => {
    expect(internalSystemBudgetInputSchema.safeParse({
      ...validInput,
      marketplace: true
    }).success).toBe(false);

    expect(parseWith({
      modules: [{
        name: 'Estoque',
        complexity: 'SIMPLE',
        screenCount: 4
      } as never]
    }).success).toBe(false);

    expect(parseWith({
      integrations: [{
        name: 'ERP',
        complexity: 'STANDARD',
        endpointCount: 2
      } as never]
    }).success).toBe(false);

    expect(internalSystemBudgetInputSchema.safeParse({
      ...validInput,
      notes: 'Observacao pertence ao envelope'
    }).success).toBe(false);
  });

  it('requires between one and twenty modules', () => {
    expect(parseWith({ modules: [] }).success).toBe(false);
    expect(parseWith({ modules: scopedItems(20) }).success).toBe(true);
    expect(parseWith({ modules: scopedItems(21) }).success).toBe(false);
  });

  it('validates module names and descriptions', () => {
    expect(parseWith({
      modules: [{ name: 'A', complexity: 'SIMPLE' }]
    }).success).toBe(false);
    expect(parseWith({
      modules: [{ name: 'A'.repeat(121), complexity: 'SIMPLE' }]
    }).success).toBe(false);
    expect(parseWith({
      modules: [{ name: 'Estoque', description: 'A'.repeat(1_001), complexity: 'SIMPLE' }]
    }).success).toBe(false);
  });

  it('trims visible text and normalizes empty scoped descriptions to undefined', () => {
    const result = parseWith({
      modules: [{
        name: '  Gestão   de estoque  ',
        description: '   ',
        complexity: 'SIMPLE'
      }],
      integrations: [{
        name: '  ERP corporativo  ',
        description: '  Sincroniza pedidos  ',
        complexity: 'STANDARD'
      }]
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.modules[0]).toEqual({
        name: 'Gestão   de estoque',
        description: undefined,
        complexity: 'SIMPLE'
      });
      expect(result.data.integrations[0]).toEqual({
        name: 'ERP corporativo',
        description: 'Sincroniza pedidos',
        complexity: 'STANDARD'
      });
    }
  });

  it('rejects duplicate module names after whitespace, accent, and case normalization', () => {
    const result = parseWith({
      modules: [
        { name: ' Gestão   de Estoque ', complexity: 'SIMPLE' },
        { name: 'gestao de estoque', complexity: 'COMPLEX' }
      ]
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'modules')).toBe(true);
    }
  });

  it('requires an integer access profile count between one and twenty', () => {
    expect(parseWith({ accessProfileCount: 1 }).success).toBe(true);
    expect(parseWith({ accessProfileCount: 0 }).success).toBe(false);
    expect(parseWith({ accessProfileCount: 20 }).success).toBe(true);
    expect(parseWith({ accessProfileCount: 21 }).success).toBe(false);
    expect(parseWith({ accessProfileCount: 1.5 }).success).toBe(false);
  });

  it('accepts only the approved permission models', () => {
    expect(parseWith({ permissionModel: 'STANDARD_ROLES' }).success).toBe(true);
    expect(parseWith({ permissionModel: 'CUSTOM_PERMISSIONS' }).success).toBe(true);
    expect(parseWith({ permissionModel: 'FIELD_PERMISSIONS' as never }).success).toBe(false);
  });

  it('accepts MFA and CORPORATE_SSO without duplicates and rejects social login', () => {
    expect(parseWith({
      additionalAuthentication: ['MFA', 'CORPORATE_SSO']
    }).success).toBe(true);
    expect(parseWith({ additionalAuthentication: ['MFA', 'MFA'] }).success).toBe(false);
    expect(parseWith({ additionalAuthentication: ['SOCIAL_LOGIN' as never] }).success).toBe(false);
    expect(parseWith({ additionalAuthentication: ['SSO' as never] }).success).toBe(false);
  });

  it.each(['NONE', 'SIMPLE', 'CUSTOM'] as const)(
    'accepts the %s workflow level',
    (workflowLevel) => {
      expect(parseWith({ workflowLevel }).success).toBe(true);
    }
  );

  it('rejects workflow values outside the approved contract', () => {
    expect(parseWith({ workflowLevel: 'VISUAL_BUILDER' as never }).success).toBe(false);
  });

  it.each(['NONE', 'BASIC_ATTACHMENTS', 'DOCUMENT_WORKFLOW'] as const)(
    'accepts the %s document management level',
    (documentManagement) => {
      expect(parseWith({ documentManagement }).success).toBe(true);
    }
  );

  it('uses BASIC_ATTACHMENTS rather than the platform file-handling name', () => {
    expect(parseWith({ documentManagement: 'BASIC_UPLOADS' as never }).success).toBe(false);
  });

  it('requires an integer dashboard count between one and twenty', () => {
    expect(parseWith({ dashboardCount: 1 }).success).toBe(true);
    expect(parseWith({ dashboardCount: 0 }).success).toBe(false);
    expect(parseWith({ dashboardCount: 20 }).success).toBe(true);
    expect(parseWith({ dashboardCount: 21 }).success).toBe(false);
    expect(parseWith({ dashboardCount: 1.5 }).success).toBe(false);
  });

  it('requires an integer report count between zero and fifty', () => {
    expect(parseWith({ reportCount: 0 }).success).toBe(true);
    expect(parseWith({ reportCount: -1 }).success).toBe(false);
    expect(parseWith({ reportCount: 50 }).success).toBe(true);
    expect(parseWith({ reportCount: 51 }).success).toBe(false);
    expect(parseWith({ reportCount: 1.5 }).success).toBe(false);
  });

  it('accepts only additional notification channels without duplicates', () => {
    expect(parseWith({
      additionalNotificationChannels: ['EMAIL', 'WHATSAPP_SMS']
    }).success).toBe(true);
    expect(parseWith({
      additionalNotificationChannels: ['EMAIL', 'EMAIL']
    }).success).toBe(false);
    expect(parseWith({
      additionalNotificationChannels: ['IN_APP' as never]
    }).success).toBe(false);
  });

  it('allows at most ten integrations', () => {
    expect(parseWith({ integrations: scopedItems(10) }).success).toBe(true);
    expect(parseWith({ integrations: scopedItems(11) }).success).toBe(false);
  });

  it('validates integration names and descriptions', () => {
    expect(parseWith({
      integrations: [{ name: 'E', complexity: 'SIMPLE' }]
    }).success).toBe(false);
    expect(parseWith({
      integrations: [{ name: 'E'.repeat(121), complexity: 'SIMPLE' }]
    }).success).toBe(false);
    expect(parseWith({
      integrations: [{
        name: 'ERP',
        description: 'A'.repeat(1_001),
        complexity: 'SIMPLE'
      }]
    }).success).toBe(false);
  });

  it('rejects duplicate integration names after normalization', () => {
    const result = parseWith({
      integrations: [
        { name: 'Integração   ERP', complexity: 'STANDARD' },
        { name: ' integracao erp ', complexity: 'COMPLEX' }
      ]
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'integrations')).toBe(true);
    }
  });

  it('keeps migration source count and description consistent in both directions', () => {
    expect(parseWith({
      dataMigration: 'STRUCTURED_IMPORT',
      dataMigrationSourceCount: 0,
      dataMigrationDescription: 'Planilha de estoque'
    }).success).toBe(false);
    expect(parseWith({
      dataMigration: 'STRUCTURED_IMPORT',
      dataMigrationSourceCount: 1
    }).success).toBe(false);
    expect(parseWith({
      dataMigration: 'LEGACY_MIGRATION',
      dataMigrationSourceCount: 2,
      dataMigrationDescription: '   '
    }).success).toBe(false);
    expect(parseWith({
      dataMigration: 'NONE',
      dataMigrationSourceCount: 1
    }).success).toBe(false);
    expect(parseWith({
      dataMigration: 'NONE',
      dataMigrationSourceCount: 0,
      dataMigrationDescription: 'Banco legado'
    }).success).toBe(false);
    const activeMigration = parseWith({
      dataMigration: 'LEGACY_MIGRATION',
      dataMigrationSourceCount: 2,
      dataMigrationDescription: '  Banco legado e planilha  '
    });
    expect(activeMigration.success).toBe(true);
    if (activeMigration.success) {
      expect(activeMigration.data.dataMigrationDescription).toBe('Banco legado e planilha');
    }

    const noMigration = parseWith({
      dataMigration: 'NONE',
      dataMigrationSourceCount: 0,
      dataMigrationDescription: '   '
    });
    expect(noMigration.success).toBe(true);
    if (noMigration.success) {
      expect(noMigration.data.dataMigrationDescription).toBeUndefined();
    }
  });

  it('validates migration source and description limits', () => {
    expect(parseWith({ dataMigrationSourceCount: -1 }).success).toBe(false);
    expect(parseWith({ dataMigrationSourceCount: 21 }).success).toBe(false);
    expect(parseWith({ dataMigrationSourceCount: 1.5 }).success).toBe(false);
    expect(parseWith({
      dataMigration: 'STRUCTURED_IMPORT',
      dataMigrationSourceCount: 1,
      dataMigrationDescription: 'A'.repeat(1_001)
    }).success).toBe(false);
  });

  it('rejects impossible and past launch dates while accepting today', () => {
    const today = new Date().toISOString().slice(0, 10);

    expect(parseWith({ targetLaunchDate: '2027-02-29' }).success).toBe(false);
    expect(parseWith({ targetLaunchDate: '2000-01-01' }).success).toBe(false);
    expect(parseWith({ targetLaunchDate: today }).success).toBe(true);
  });

  it('requires and forbids the complexity reason bidirectionally', () => {
    expect(parseWith({
      complexityAdjustment: 'MODERATE',
      complexityReason: undefined
    }).success).toBe(false);
    expect(parseWith({
      complexityAdjustment: 'HIGH',
      complexityReason: '   '
    }).success).toBe(false);
    expect(parseWith({
      complexityAdjustment: 'HIGH',
      complexityReason: 'Dependencias criticas entre modulos'
    }).success).toBe(true);
    expect(parseWith({
      complexityAdjustment: 'NONE',
      complexityReason: 'Motivo obsoleto'
    }).success).toBe(false);
    expect(parseWith({
      complexityAdjustment: 'HIGH',
      complexityReason: 'A'.repeat(501)
    }).success).toBe(false);
  });

  it('validates the discount precision and reason bidirectionally', () => {
    expect(parseWith({ discountPercentage: -0.01 }).success).toBe(false);
    expect(parseWith({ discountPercentage: 100.01 }).success).toBe(false);
    expect(parseWith({ discountPercentage: 1.001 }).success).toBe(false);
    expect(parseWith({ discountPercentage: 10 }).success).toBe(false);
    expect(parseWith({ discountPercentage: 10, discountReason: '   ' }).success).toBe(false);
    expect(parseWith({
      discountPercentage: 10,
      discountReason: 'Condicao comercial aprovada'
    }).success).toBe(true);
    expect(parseWith({
      discountPercentage: 0,
      discountReason: 'Motivo obsoleto'
    }).success).toBe(false);
    expect(parseWith({
      discountPercentage: 10,
      discountReason: 'A'.repeat(501)
    }).success).toBe(false);
  });
});

describe('internal system budget input dispatch', () => {
  it('registers SISTEMA_INTERNO as a supported budget application type', () => {
    expect(supportedBudgetApplicationTypes).toEqual([
      'WEBSITE',
      'PLATAFORMA_WEB',
      'SISTEMA_INTERNO'
    ]);
    expect(getBudgetInputSchema('SISTEMA_INTERNO')).toBe(internalSystemBudgetInputSchema);
  });

  it('accepts internal-system data in the generic schema', () => {
    expect(budgetInputDataSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects internal-system data for Website and Plataforma Web', () => {
    expect(getBudgetInputSchema('WEBSITE').safeParse(validInput).success).toBe(false);
    expect(getBudgetInputSchema('PLATAFORMA_WEB').safeParse(validInput).success).toBe(false);
  });

  it('rejects Website and Plataforma Web payloads for Sistema Interno', () => {
    const websiteInput = {
      websiteCategory: 'LANDING_PAGE',
      sectionCount: 5
    };
    const platformInput = {
      platformCategory: 'MARKETPLACE',
      functionalModules: []
    };

    expect(getBudgetInputSchema('SISTEMA_INTERNO').safeParse(websiteInput).success).toBe(false);
    expect(getBudgetInputSchema('SISTEMA_INTERNO').safeParse(platformInput).success).toBe(false);
  });
});
