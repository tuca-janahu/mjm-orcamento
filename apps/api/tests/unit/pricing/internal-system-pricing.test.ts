import type { InternalSystemBudgetInput } from '@mjm/shared';
import { Decimal } from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  calculateInternalSystemBudget,
  internalSystemRequiredPricingCodes
} from '../../../src/modules/pricing/internal-system-pricing.js';
import type {
  JsonObject,
  PricingConfigValue
} from '../../../src/modules/pricing/pricing.types.js';

const baseMetadata: JsonObject = {
  includedAccessProfiles: 2,
  includedDashboards: 1,
  includedFeatures: [
    'EMAIL_PASSWORD_AUTH',
    'STANDARD_ROLES',
    'BASIC_ADMINISTRATION',
    'IN_APP_NOTIFICATIONS'
  ],
  commercialPolicy: {
    version: 1,
    active: true
  }
};

const values = {
  INTERNAL_SYSTEM_BASE: 5000,
  INTERNAL_SYSTEM_MODULE_SIMPLE: 1200,
  INTERNAL_SYSTEM_MODULE_STANDARD: 2500,
  INTERNAL_SYSTEM_MODULE_COMPLEX: 4500,
  INTERNAL_SYSTEM_EXTRA_ACCESS_PROFILE: 400,
  INTERNAL_SYSTEM_CUSTOM_PERMISSIONS: 2000,
  INTERNAL_SYSTEM_AUTH_MFA: 1500,
  INTERNAL_SYSTEM_AUTH_CORPORATE_SSO: 3500,
  INTERNAL_SYSTEM_WORKFLOW_SIMPLE: 1200,
  INTERNAL_SYSTEM_WORKFLOW_CUSTOM: 3000,
  INTERNAL_SYSTEM_DOCUMENT_BASIC_ATTACHMENTS: 800,
  INTERNAL_SYSTEM_DOCUMENT_WORKFLOW: 2500,
  INTERNAL_SYSTEM_EXTRA_DASHBOARD: 1200,
  INTERNAL_SYSTEM_REPORT: 600,
  INTERNAL_SYSTEM_NOTIFICATION_EMAIL: 800,
  INTERNAL_SYSTEM_NOTIFICATION_WHATSAPP_SMS: 1500,
  INTERNAL_SYSTEM_INTEGRATION_SIMPLE: 500,
  INTERNAL_SYSTEM_INTEGRATION_STANDARD: 1200,
  INTERNAL_SYSTEM_INTEGRATION_COMPLEX: 2500,
  INTERNAL_SYSTEM_DATA_MIGRATION_STRUCTURED_IMPORT: 1000,
  INTERNAL_SYSTEM_DATA_MIGRATION_LEGACY: 3000,
  INTERNAL_SYSTEM_HOSTING_MJM_STANDARD_SETUP: 800,
  INTERNAL_SYSTEM_HOSTING_MJM_MANAGED_SETUP: 1500,
  INTERNAL_SYSTEM_HOSTING_MJM_STANDARD_MONTHLY: 500,
  INTERNAL_SYSTEM_HOSTING_MJM_MANAGED_MONTHLY: 1000,
  INTERNAL_SYSTEM_MAINTENANCE_ESSENTIAL_MONTHLY: 500,
  INTERNAL_SYSTEM_MAINTENANCE_STANDARD_MONTHLY: 1000,
  INTERNAL_SYSTEM_MAINTENANCE_CUSTOM_MONTHLY: 2000,
  INTERNAL_SYSTEM_COMPLEXITY_NONE: 1,
  INTERNAL_SYSTEM_COMPLEXITY_MODERATE: 1.2,
  INTERNAL_SYSTEM_COMPLEXITY_HIGH: 1.5,
  INTERNAL_SYSTEM_URGENCY_NORMAL: 1,
  INTERNAL_SYSTEM_URGENCY_PRIORITY: 1.3,
  INTERNAL_SYSTEM_URGENCY_EXPRESS: 1.6
} as const;

function categoryFor(code: keyof typeof values): string {
  if (code === 'INTERNAL_SYSTEM_BASE') return 'BASE';
  if (code.includes('_MODULE_')) return 'MODULOS';
  if (code.includes('_ACCESS_PROFILE') || code.includes('_PERMISSIONS')) return 'ACESSO';
  if (code.includes('_AUTH_')) return 'AUTENTICACAO';
  if (code.includes('_WORKFLOW_')) return 'PROCESSOS';
  if (code.includes('_DOCUMENT_')) return 'DOCUMENTOS';
  if (code.includes('_DASHBOARD') || code.endsWith('_REPORT')) return 'ANALISE';
  if (code.includes('_NOTIFICATION_')) return 'NOTIFICACOES';
  if (code.includes('_INTEGRATION_')) return 'INTEGRACOES';
  if (code.includes('_DATA_MIGRATION_')) return 'MIGRACAO';
  if (code.includes('_HOSTING_')) return 'HOSPEDAGEM';
  if (code.includes('_MAINTENANCE_')) return 'MANUTENCAO';
  if (code.includes('_COMPLEXITY_')) return 'COMPLEXIDADE';
  return 'URGENCIA';
}

const configs: PricingConfigValue[] = Object.entries(values).map(([code, value]) => ({
  code,
  name: code,
  category: categoryFor(code as keyof typeof values),
  value: new Decimal(value),
  ...(code === 'INTERNAL_SYSTEM_BASE' ? { metadata: baseMetadata } : {})
}));

const baseInput: InternalSystemBudgetInput = {
  modules: [{ name: 'Cadastro operacional', complexity: 'SIMPLE' }],
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

const referenceDate = new Date('2026-07-21T12:00:00.000Z');

function calculate(
  partialInput: Partial<InternalSystemBudgetInput> = {},
  pricingConfigs: PricingConfigValue[] = configs,
  selectedReferenceDate: Date = referenceDate
) {
  return calculateInternalSystemBudget(
    { ...baseInput, ...partialInput },
    pricingConfigs,
    { referenceDate: selectedReferenceDate }
  );
}

function itemsWithCode(result: ReturnType<typeof calculate>, code: string) {
  return result.items.filter((item) => item.code === code);
}

function itemWithCode(result: ReturnType<typeof calculate>, code: string) {
  return result.items.find((item) => item.code === code);
}

function replaceValue(code: string, value: Decimal.Value): PricingConfigValue[] {
  return configs.map((configuration) => (
    configuration.code === code
      ? { ...configuration, value: new Decimal(value) }
      : configuration
  ));
}

function replaceBaseMetadata(metadata: JsonObject): PricingConfigValue[] {
  return configs.map((configuration) => (
    configuration.code === 'INTERNAL_SYSTEM_BASE'
      ? { ...configuration, metadata }
      : configuration
  ));
}

describe('precificacao de sistema interno', () => {
  it('expõe uma lista única e completa dos códigos obrigatórios', () => {
    expect(internalSystemRequiredPricingCodes).toEqual(Object.keys(values));
    expect(new Set(internalSystemRequiredPricingCodes).size)
      .toBe(internalSystemRequiredPricingCodes.length);
  });

  it('precifica a base e o módulo mínimo sem cobrar franquias incluídas', () => {
    const result = calculate();

    expect(result.items.map((item) => item.code)).toEqual([
      'INTERNAL_SYSTEM_BASE',
      'INTERNAL_SYSTEM_MODULE_SIMPLE'
    ]);
    expect(result.subtotal.toFixed(2)).toBe('6200.00');
    expect(result.finalTotal.toFixed(2)).toBe('6200.00');
    expect(result.monthlyRecurringTotal.toFixed(2)).toBe('0.00');
    expect(itemWithCode(result, 'INTERNAL_SYSTEM_EXTRA_ACCESS_PROFILE')).toBeUndefined();
    expect(itemWithCode(result, 'INTERNAL_SYSTEM_EXTRA_DASHBOARD')).toBeUndefined();
  });

  it('valida, copia integralmente e complementa o metadata da base', () => {
    const result = calculate({ accessProfileCount: 4, dashboardCount: 3 });
    const metadata = itemWithCode(result, 'INTERNAL_SYSTEM_BASE')?.metadata;

    expect(metadata).toEqual({
      ...baseMetadata,
      informedAccessProfiles: 4,
      informedDashboards: 3
    });
    expect(metadata).not.toBe(baseMetadata);
    expect(metadata?.includedFeatures).not.toBe(baseMetadata.includedFeatures);
    expect(metadata?.commercialPolicy).not.toBe(baseMetadata.commercialPolicy);
  });

  it('cobra perfis e dashboards somente acima das franquias vindas do metadata', () => {
    const pricingConfigs = replaceBaseMetadata({
      ...baseMetadata,
      includedAccessProfiles: 3,
      includedDashboards: 2
    });
    const result = calculate({ accessProfileCount: 5, dashboardCount: 4 }, pricingConfigs);

    expect(itemWithCode(result, 'INTERNAL_SYSTEM_EXTRA_ACCESS_PROFILE')).toMatchObject({
      quantity: 2,
      metadata: { includedAccessProfiles: 3, informedAccessProfiles: 5 }
    });
    expect(itemWithCode(result, 'INTERNAL_SYSTEM_EXTRA_DASHBOARD')).toMatchObject({
      quantity: 2,
      metadata: { includedDashboards: 2, informedDashboards: 4 }
    });
  });

  it('precifica cada módulo individualmente e congela seu contexto', () => {
    const result = calculate({
      modules: [
        { name: 'Estoque', complexity: 'SIMPLE' },
        { name: 'Ordens', description: 'Ciclo completo', complexity: 'STANDARD' },
        { name: 'Aprovações', complexity: 'COMPLEX' }
      ]
    });

    expect(result.items.filter((item) => item.code.startsWith('INTERNAL_SYSTEM_MODULE_')))
      .toHaveLength(3);
    expect(itemsWithCode(result, 'INTERNAL_SYSTEM_MODULE_SIMPLE')[0]).toMatchObject({
      quantity: 1,
      totalPrice: new Decimal(1200),
      metadata: { moduleName: 'Estoque', complexity: 'SIMPLE' }
    });
    expect(itemsWithCode(result, 'INTERNAL_SYSTEM_MODULE_STANDARD')[0]).toMatchObject({
      description: 'Ciclo completo',
      quantity: 1,
      totalPrice: new Decimal(2500),
      metadata: { moduleName: 'Ordens', complexity: 'STANDARD' }
    });
    expect(itemsWithCode(result, 'INTERNAL_SYSTEM_MODULE_COMPLEX')[0]).toMatchObject({
      quantity: 1,
      totalPrice: new Decimal(4500),
      metadata: { moduleName: 'Aprovações', complexity: 'COMPLEX' }
    });
  });

  it('precifica permissões e autenticações adicionais na ordem informada', () => {
    const result = calculate({
      permissionModel: 'CUSTOM_PERMISSIONS',
      additionalAuthentication: ['CORPORATE_SSO', 'MFA']
    });

    expect(result.items.slice(2).map((item) => [item.code, item.totalPrice.toFixed(2)]))
      .toEqual([
        ['INTERNAL_SYSTEM_CUSTOM_PERMISSIONS', '2000.00'],
        ['INTERNAL_SYSTEM_AUTH_CORPORATE_SSO', '3500.00'],
        ['INTERNAL_SYSTEM_AUTH_MFA', '1500.00']
      ]);
  });

  it.each([
    ['SIMPLE', 'INTERNAL_SYSTEM_WORKFLOW_SIMPLE', '1200.00'],
    ['CUSTOM', 'INTERNAL_SYSTEM_WORKFLOW_CUSTOM', '3000.00']
  ] as const)('precifica o workflow %s', (workflowLevel, code, expected) => {
    const result = calculate({ workflowLevel });
    expect(itemWithCode(result, code)?.totalPrice.toFixed(2)).toBe(expected);
  });

  it.each([
    ['BASIC_ATTACHMENTS', 'INTERNAL_SYSTEM_DOCUMENT_BASIC_ATTACHMENTS', '800.00'],
    ['DOCUMENT_WORKFLOW', 'INTERNAL_SYSTEM_DOCUMENT_WORKFLOW', '2500.00']
  ] as const)('precifica o tratamento documental %s', (documentManagement, code, expected) => {
    const result = calculate({ documentManagement });
    expect(itemWithCode(result, code)?.totalPrice.toFixed(2)).toBe(expected);
  });

  it('precifica relatórios e notificações adicionais', () => {
    const result = calculate({
      reportCount: 3,
      additionalNotificationChannels: ['WHATSAPP_SMS', 'EMAIL']
    });

    expect(itemWithCode(result, 'INTERNAL_SYSTEM_REPORT')).toMatchObject({ quantity: 3 });
    expect(itemWithCode(result, 'INTERNAL_SYSTEM_REPORT')?.totalPrice.toFixed(2))
      .toBe('1800.00');
    expect(result.items.slice(2).map((item) => item.code)).toEqual([
      'INTERNAL_SYSTEM_REPORT',
      'INTERNAL_SYSTEM_NOTIFICATION_WHATSAPP_SMS',
      'INTERNAL_SYSTEM_NOTIFICATION_EMAIL'
    ]);
  });

  it('precifica e congela integrações simples, padrão e complexas individualmente', () => {
    const result = calculate({
      integrations: [
        { name: 'Agenda', complexity: 'SIMPLE' },
        { name: 'CRM', description: 'Sincronização bidirecional', complexity: 'STANDARD' },
        { name: 'ERP', complexity: 'COMPLEX' }
      ]
    });

    expect(result.items.slice(2).map((item) => ({
      code: item.code,
      quantity: item.quantity,
      totalPrice: item.totalPrice.toFixed(2),
      description: item.description,
      metadata: item.metadata
    }))).toEqual([
      {
        code: 'INTERNAL_SYSTEM_INTEGRATION_SIMPLE',
        quantity: 1,
        totalPrice: '500.00',
        description: undefined,
        metadata: { integrationName: 'Agenda', complexity: 'SIMPLE' }
      },
      {
        code: 'INTERNAL_SYSTEM_INTEGRATION_STANDARD',
        quantity: 1,
        totalPrice: '1200.00',
        description: 'Sincronização bidirecional',
        metadata: { integrationName: 'CRM', complexity: 'STANDARD' }
      },
      {
        code: 'INTERNAL_SYSTEM_INTEGRATION_COMPLEX',
        quantity: 1,
        totalPrice: '2500.00',
        description: undefined,
        metadata: { integrationName: 'ERP', complexity: 'COMPLEX' }
      }
    ]);
  });

  it.each([
    ['STRUCTURED_IMPORT', 'INTERNAL_SYSTEM_DATA_MIGRATION_STRUCTURED_IMPORT', '2000.00'],
    ['LEGACY_MIGRATION', 'INTERNAL_SYSTEM_DATA_MIGRATION_LEGACY', '6000.00']
  ] as const)('precifica %s por fonte e congela a descrição', (dataMigration, code, expected) => {
    const result = calculate({
      dataMigration,
      dataMigrationSourceCount: 2,
      dataMigrationDescription: 'Planilha e banco legado'
    });

    expect(itemWithCode(result, code)).toMatchObject({
      description: 'Planilha e banco legado',
      quantity: 2,
      metadata: { migrationType: dataMigration }
    });
    expect(itemWithCode(result, code)?.totalPrice.toFixed(2)).toBe(expected);
  });

  it.each([
    ['MJM_STANDARD', '800.00', '500.00'],
    ['MJM_MANAGED', '1500.00', '1000.00']
  ] as const)('separa implantação e mensalidade da hospedagem %s', (
    hostingPlan,
    expectedSetup,
    expectedMonthly
  ) => {
    const result = calculate({ hostingPlan });
    const planCode = hostingPlan === 'MJM_STANDARD' ? 'MJM_STANDARD' : 'MJM_MANAGED';
    const setup = itemWithCode(result, `INTERNAL_SYSTEM_HOSTING_${planCode}_SETUP`);
    const monthly = itemWithCode(result, `INTERNAL_SYSTEM_HOSTING_${planCode}_MONTHLY`);

    expect(setup?.totalPrice.toFixed(2)).toBe(expectedSetup);
    expect(setup?.recurring).toBe(false);
    expect(monthly?.totalPrice.toFixed(2)).toBe(expectedMonthly);
    expect(monthly?.recurring).toBe(true);
    expect(result.finalTotal.toFixed(2)).toBe(result.subtotal.toFixed(2));
    expect(result.monthlyRecurringTotal.toFixed(2)).toBe(expectedMonthly);
  });

  it.each([
    ['ESSENTIAL', '500.00'],
    ['STANDARD', '1000.00'],
    ['CUSTOM', '2000.00']
  ] as const)('mantém a manutenção %s somente nas recorrências', (
    maintenancePlan,
    expected
  ) => {
    const result = calculate({ maintenancePlan });
    const maintenance = itemWithCode(
      result,
      `INTERNAL_SYSTEM_MAINTENANCE_${maintenancePlan}_MONTHLY`
    );

    expect(maintenance?.recurring).toBe(true);
    expect(maintenance?.totalPrice.toFixed(2)).toBe(expected);
    expect(result.subtotal.toFixed(2)).toBe('6200.00');
    expect(result.finalTotal.toFixed(2)).toBe('6200.00');
    expect(result.monthlyRecurringTotal.toFixed(2)).toBe(expected);
  });

  it.each([
    ['NONE', '1.00', '6200.00'],
    ['MODERATE', '1.20', '7440.00'],
    ['HIGH', '1.50', '9300.00']
  ] as const)('aplica o ajuste de complexidade %s', (
    complexityAdjustment,
    expectedMultiplier,
    expectedTotal
  ) => {
    const result = calculate({
      complexityAdjustment,
      ...(complexityAdjustment === 'NONE'
        ? {}
        : { complexityReason: 'Fator transversal válido' })
    });

    expect(result.complexityMultiplier.toFixed(2)).toBe(expectedMultiplier);
    expect(result.finalTotal.toFixed(2)).toBe(expectedTotal);
  });

  it.each([
    ['2026-08-10', '1.60'],
    ['2026-08-11', '1.30'],
    ['2026-09-03', '1.30'],
    ['2026-09-04', '1.00']
  ] as const)('classifica corretamente o limite de urgência em %s', (
    targetLaunchDate,
    expected
  ) => {
    expect(calculate({ targetLaunchDate }).urgencyMultiplier.toFixed(2)).toBe(expected);
  });

  it('usa urgência normal quando não há data alvo', () => {
    expect(calculate().urgencyMultiplier.toFixed(2)).toBe('1.00');
  });

  it('aplica desconto e multiplicadores somente aos serviços ajustáveis', () => {
    const result = calculate({
      hostingPlan: 'MJM_STANDARD',
      maintenancePlan: 'ESSENTIAL',
      complexityAdjustment: 'MODERATE',
      complexityReason: 'Dependências transversais',
      targetLaunchDate: '2026-08-10',
      discountPercentage: 10,
      discountReason: 'Condição comercial'
    });

    expect(result.subtotal.toFixed(2)).toBe('7000.00');
    expect(result.finalTotal.toFixed(2)).toBe('11513.60');
    expect(result.monthlyRecurringTotal.toFixed(2)).toBe('1000.00');
  });

  it('arredonda preços e totais monetários em duas casas com ROUND_HALF_UP', () => {
    const roundedConfigs = replaceValue('INTERNAL_SYSTEM_BASE', '0.005').map((configuration) => (
      configuration.code === 'INTERNAL_SYSTEM_MODULE_SIMPLE'
        ? { ...configuration, value: new Decimal('0.005') }
        : configuration
    ));
    const result = calculate({}, roundedConfigs);

    expect(itemWithCode(result, 'INTERNAL_SYSTEM_BASE')?.unitPrice.toFixed(2)).toBe('0.01');
    expect(itemWithCode(result, 'INTERNAL_SYSTEM_MODULE_SIMPLE')?.unitPrice.toFixed(2))
      .toBe('0.01');
    expect(result.subtotal.toFixed(2)).toBe('0.02');
    expect(result.finalTotal.toFixed(2)).toBe('0.02');
  });

  it('valida todas as configurações obrigatórias antes de calcular', () => {
    const missingReport = configs.filter(
      (configuration) => configuration.code !== 'INTERNAL_SYSTEM_REPORT'
    );

    expect(() => calculate({}, missingReport))
      .toThrow('Configuracao de preco ausente: INTERNAL_SYSTEM_REPORT');
  });

  it('rejeita metadata ausente na configuração-base', () => {
    const withoutMetadata = configs.map((configuration) => {
      if (configuration.code !== 'INTERNAL_SYSTEM_BASE') return configuration;
      const withoutBaseMetadata = { ...configuration };
      delete withoutBaseMetadata.metadata;
      return withoutBaseMetadata;
    });

    expect(() => calculate({}, withoutMetadata))
      .toThrow('Metadata ausente para configuracao: INTERNAL_SYSTEM_BASE');
  });

  it.each([
    {},
    { includedAccessProfiles: '2', includedDashboards: 1, includedFeatures: [] },
    { includedAccessProfiles: -1, includedDashboards: 1, includedFeatures: [] },
    { includedAccessProfiles: 2, includedDashboards: 1.5, includedFeatures: [] },
    { includedAccessProfiles: 2, includedDashboards: 1, includedFeatures: ['OK', 2] }
  ] satisfies JsonObject[])('rejeita metadata inválido da base: %#', (metadata) => {
    expect(() => calculate({}, replaceBaseMetadata(metadata)))
      .toThrow('Metadata invalido para configuracao: INTERNAL_SYSTEM_BASE');
  });

  it('rejeita preço monetário negativo mesmo que o item não tenha sido selecionado', () => {
    expect(() => calculate({}, replaceValue('INTERNAL_SYSTEM_REPORT', -1)))
      .toThrow('Configuracao de preco negativa: INTERNAL_SYSTEM_REPORT');
  });

  it.each([
    ['INTERNAL_SYSTEM_COMPLEXITY_NONE', 0],
    ['INTERNAL_SYSTEM_URGENCY_EXPRESS', -1]
  ] as const)('rejeita multiplicador inválido em %s', (code, value) => {
    expect(() => calculate({}, replaceValue(code, value)))
      .toThrow(`Multiplicador deve ser maior que zero: ${code}`);
  });

  it('rejeita data alvo passada e datas inválidas', () => {
    expect(() => calculate({ targetLaunchDate: '2026-07-20' }))
      .toThrow('Data de lancamento nao pode estar no passado: 2026-07-20');
    expect(() => calculate({ targetLaunchDate: '2026-02-31' }))
      .toThrow('Data de lancamento invalida: 2026-02-31');
    expect(() => calculate({}, configs, new Date('invalid')))
      .toThrow('Data de referencia invalida');
  });

  it('reproduz o exemplo financeiro completo aprovado com ordem e classificação estáveis', () => {
    const result = calculate({
      modules: [
        { name: 'Controle de estoque', complexity: 'SIMPLE' },
        { name: 'Ordens de serviço', complexity: 'STANDARD' },
        { name: 'Aprovações internas', complexity: 'COMPLEX' }
      ],
      accessProfileCount: 4,
      permissionModel: 'CUSTOM_PERMISSIONS',
      additionalAuthentication: ['MFA'],
      workflowLevel: 'CUSTOM',
      documentManagement: 'DOCUMENT_WORKFLOW',
      dashboardCount: 2,
      reportCount: 2,
      additionalNotificationChannels: ['EMAIL'],
      integrations: [{ name: 'ERP corporativo', complexity: 'STANDARD' }],
      dataMigration: 'LEGACY_MIGRATION',
      dataMigrationSourceCount: 2,
      dataMigrationDescription: 'Banco do sistema anterior e planilha histórica de estoque',
      hostingPlan: 'MJM_MANAGED',
      maintenancePlan: 'STANDARD',
      targetLaunchDate: '2026-08-20',
      complexityAdjustment: 'MODERATE',
      complexityReason: 'Regras transversais entre estoque, ordens e aprovações',
      discountPercentage: 10,
      discountReason: 'Condição comercial de contratação conjunta'
    });

    expect(result.items.map((item) => ({
      code: item.code,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      totalPrice: item.totalPrice.toFixed(2),
      category: item.category,
      recurring: item.recurring,
      displayOrder: item.displayOrder
    }))).toEqual([
      { code: 'INTERNAL_SYSTEM_BASE', quantity: 1, unitPrice: '5000.00', totalPrice: '5000.00', category: 'BASE', recurring: false, displayOrder: 0 },
      { code: 'INTERNAL_SYSTEM_MODULE_SIMPLE', quantity: 1, unitPrice: '1200.00', totalPrice: '1200.00', category: 'MODULOS', recurring: false, displayOrder: 1 },
      { code: 'INTERNAL_SYSTEM_MODULE_STANDARD', quantity: 1, unitPrice: '2500.00', totalPrice: '2500.00', category: 'MODULOS', recurring: false, displayOrder: 2 },
      { code: 'INTERNAL_SYSTEM_MODULE_COMPLEX', quantity: 1, unitPrice: '4500.00', totalPrice: '4500.00', category: 'MODULOS', recurring: false, displayOrder: 3 },
      { code: 'INTERNAL_SYSTEM_EXTRA_ACCESS_PROFILE', quantity: 2, unitPrice: '400.00', totalPrice: '800.00', category: 'ACESSO', recurring: false, displayOrder: 4 },
      { code: 'INTERNAL_SYSTEM_CUSTOM_PERMISSIONS', quantity: 1, unitPrice: '2000.00', totalPrice: '2000.00', category: 'ACESSO', recurring: false, displayOrder: 5 },
      { code: 'INTERNAL_SYSTEM_AUTH_MFA', quantity: 1, unitPrice: '1500.00', totalPrice: '1500.00', category: 'AUTENTICACAO', recurring: false, displayOrder: 6 },
      { code: 'INTERNAL_SYSTEM_WORKFLOW_CUSTOM', quantity: 1, unitPrice: '3000.00', totalPrice: '3000.00', category: 'PROCESSOS', recurring: false, displayOrder: 7 },
      { code: 'INTERNAL_SYSTEM_DOCUMENT_WORKFLOW', quantity: 1, unitPrice: '2500.00', totalPrice: '2500.00', category: 'DOCUMENTOS', recurring: false, displayOrder: 8 },
      { code: 'INTERNAL_SYSTEM_EXTRA_DASHBOARD', quantity: 1, unitPrice: '1200.00', totalPrice: '1200.00', category: 'ANALISE', recurring: false, displayOrder: 9 },
      { code: 'INTERNAL_SYSTEM_REPORT', quantity: 2, unitPrice: '600.00', totalPrice: '1200.00', category: 'ANALISE', recurring: false, displayOrder: 10 },
      { code: 'INTERNAL_SYSTEM_NOTIFICATION_EMAIL', quantity: 1, unitPrice: '800.00', totalPrice: '800.00', category: 'NOTIFICACOES', recurring: false, displayOrder: 11 },
      { code: 'INTERNAL_SYSTEM_INTEGRATION_STANDARD', quantity: 1, unitPrice: '1200.00', totalPrice: '1200.00', category: 'INTEGRACOES', recurring: false, displayOrder: 12 },
      { code: 'INTERNAL_SYSTEM_DATA_MIGRATION_LEGACY', quantity: 2, unitPrice: '3000.00', totalPrice: '6000.00', category: 'MIGRACAO', recurring: false, displayOrder: 13 },
      { code: 'INTERNAL_SYSTEM_HOSTING_MJM_MANAGED_SETUP', quantity: 1, unitPrice: '1500.00', totalPrice: '1500.00', category: 'HOSPEDAGEM', recurring: false, displayOrder: 14 },
      { code: 'INTERNAL_SYSTEM_HOSTING_MJM_MANAGED_MONTHLY', quantity: 1, unitPrice: '1000.00', totalPrice: '1000.00', category: 'HOSPEDAGEM', recurring: true, displayOrder: 15 },
      { code: 'INTERNAL_SYSTEM_MAINTENANCE_STANDARD_MONTHLY', quantity: 1, unitPrice: '1000.00', totalPrice: '1000.00', category: 'MANUTENCAO', recurring: true, displayOrder: 16 }
    ]);
    expect(itemWithCode(result, 'INTERNAL_SYSTEM_BASE')?.metadata).toEqual({
      ...baseMetadata,
      informedAccessProfiles: 4,
      informedDashboards: 2
    });
    expect(result.subtotal.toFixed(2)).toBe('34900.00');
    expect(result.complexityMultiplier.toFixed(2)).toBe('1.20');
    expect(result.urgencyMultiplier.toFixed(2)).toBe('1.30');
    expect(result.discountPercentage.toFixed(2)).toBe('10.00');
    expect(result.finalTotal.toFixed(2)).toBe('48393.60');
    expect(result.monthlyRecurringTotal.toFixed(2)).toBe('2000.00');
  });
});
