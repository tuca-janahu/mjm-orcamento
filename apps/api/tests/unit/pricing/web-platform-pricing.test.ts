import type { WebPlatformBudgetInput } from '@mjm/shared';
import { Decimal } from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { calculateWebPlatformBudget } from '../../../src/modules/pricing/web-platform-pricing.js';
import type { PricingConfigValue } from '../../../src/modules/pricing/pricing.types.js';

const values: Record<string, number> = {
  WEB_PLATFORM_BASE_CLIENT_PORTAL: 6000,
  WEB_PLATFORM_BASE_SAAS: 8000,
  WEB_PLATFORM_BASE_MARKETPLACE: 10000,
  WEB_PLATFORM_BASE_MEMBERSHIP_PLATFORM: 6500,
  WEB_PLATFORM_BASE_CUSTOM: 8000,
  WEB_PLATFORM_ACCOUNT_SINGLE_ORGANIZATION: 0,
  WEB_PLATFORM_ACCOUNT_MULTI_ORGANIZATION: 3500,
  WEB_PLATFORM_DESIGN_CLIENT_PROVIDED: 0,
  WEB_PLATFORM_DESIGN_SYSTEM_ADAPTATION: 1500,
  WEB_PLATFORM_DESIGN_CUSTOM: 3000,
  WEB_PLATFORM_EXTRA_SCREEN_CLIENT_PROVIDED: 0,
  WEB_PLATFORM_EXTRA_SCREEN_DESIGN_SYSTEM_ADAPTATION: 250,
  WEB_PLATFORM_EXTRA_SCREEN_CUSTOM_DESIGN: 500,
  WEB_PLATFORM_EXTRA_USER_ROLE: 400,
  WEB_PLATFORM_EXTRA_LANGUAGE: 800,
  WEB_PLATFORM_MODULE_SIMPLE: 1200,
  WEB_PLATFORM_MODULE_STANDARD: 2500,
  WEB_PLATFORM_MODULE_COMPLEX: 4500,
  WEB_PLATFORM_BACKOFFICE_STANDARD: 2000,
  WEB_PLATFORM_BACKOFFICE_CUSTOM: 4500,
  WEB_PLATFORM_DASHBOARD: 1200,
  WEB_PLATFORM_REPORT: 600,
  WEB_PLATFORM_AUTH_SOCIAL_LOGIN: 800,
  WEB_PLATFORM_AUTH_MFA: 1500,
  WEB_PLATFORM_AUTH_SSO: 3500,
  WEB_PLATFORM_PAYMENT_ONE_TIME: 1800,
  WEB_PLATFORM_PAYMENT_SUBSCRIPTION: 3000,
  WEB_PLATFORM_PAYMENT_MARKETPLACE_SPLIT: 6000,
  WEB_PLATFORM_NOTIFICATION_IN_APP: 700,
  WEB_PLATFORM_NOTIFICATION_EMAIL: 800,
  WEB_PLATFORM_NOTIFICATION_WHATSAPP_SMS: 1500,
  WEB_PLATFORM_FILE_BASIC_UPLOADS: 800,
  WEB_PLATFORM_FILE_DOCUMENT_WORKFLOW: 2500,
  WEB_PLATFORM_AUDIT_BASIC: 800,
  WEB_PLATFORM_AUDIT_COMPLETE: 2500,
  WEB_PLATFORM_INTEGRATION_SIMPLE: 500,
  WEB_PLATFORM_INTEGRATION_STANDARD: 1200,
  WEB_PLATFORM_INTEGRATION_COMPLEX: 2500,
  WEB_PLATFORM_DATA_MIGRATION_STRUCTURED_IMPORT: 1000,
  WEB_PLATFORM_DATA_MIGRATION_LEGACY_MIGRATION: 3000,
  WEB_PLATFORM_HOSTING_MJM_STANDARD_SETUP: 800,
  WEB_PLATFORM_HOSTING_MJM_STANDARD_MONTHLY: 500,
  WEB_PLATFORM_HOSTING_MJM_MANAGED_SETUP: 1500,
  WEB_PLATFORM_HOSTING_MJM_MANAGED_MONTHLY: 1000,
  WEB_PLATFORM_MAINTENANCE_ESSENTIAL_MONTHLY: 500,
  WEB_PLATFORM_MAINTENANCE_STANDARD_MONTHLY: 1000,
  WEB_PLATFORM_MAINTENANCE_CUSTOM_MONTHLY: 2000,
  WEB_PLATFORM_COMPLEXITY_NONE: 1,
  WEB_PLATFORM_COMPLEXITY_MODERATE: 1.2,
  WEB_PLATFORM_COMPLEXITY_HIGH: 1.5,
  WEB_PLATFORM_URGENCY_NORMAL: 1,
  WEB_PLATFORM_URGENCY_PRIORITY: 1.3,
  WEB_PLATFORM_URGENCY_EXPRESS: 1.6
};

const configs: PricingConfigValue[] = Object.entries(values).map(([code, value]) => ({
  code,
  name: code,
  category: code.split('_')[2] ?? 'PLATFORM',
  value: new Decimal(value)
}));

const baseInput: WebPlatformBudgetInput = {
  platformCategory: 'CLIENT_PORTAL',
  accountStructure: 'SINGLE_ORGANIZATION',
  screenCount: 5,
  userRoleCount: 2,
  languageCount: 1,
  designApproach: 'CLIENT_PROVIDED',
  functionalModules: [{ name: 'Area do cliente', complexity: 'SIMPLE' }],
  adminBackoffice: 'NONE',
  dashboardCount: 0,
  reportCount: 0,
  additionalAuthentication: [],
  paymentFeatures: [],
  notificationChannels: [],
  fileHandling: 'NONE',
  auditLevel: 'NONE',
  integrations: [],
  dataMigration: 'NONE',
  dataMigrationSourceCount: 0,
  hostingPlan: 'CLIENT_MANAGED',
  maintenancePlan: 'NONE',
  complexityAdjustment: 'NONE',
  discountPercentage: 0
};

const referenceDate = new Date('2026-07-01T12:00:00.000Z');

function calculate(
  partialInput: Partial<WebPlatformBudgetInput> = {},
  pricingConfigs = configs
) {
  return calculateWebPlatformBudget(
    { ...baseInput, ...partialInput },
    pricingConfigs,
    { referenceDate }
  );
}

function itemTotal(result: ReturnType<typeof calculate>, code: string): string | undefined {
  return result.items.find((item) => item.code === code)?.totalPrice.toFixed(2);
}

describe('precificacao de plataforma web', () => {
  it.each([
    ['CLIENT_PORTAL', 'WEB_PLATFORM_BASE_CLIENT_PORTAL', '6000.00'],
    ['SAAS', 'WEB_PLATFORM_BASE_SAAS', '8000.00'],
    ['MARKETPLACE', 'WEB_PLATFORM_BASE_MARKETPLACE', '10000.00'],
    ['MEMBERSHIP_PLATFORM', 'WEB_PLATFORM_BASE_MEMBERSHIP_PLATFORM', '6500.00'],
    ['CUSTOM', 'WEB_PLATFORM_BASE_CUSTOM', '8000.00']
  ] as const)('seleciona a base de %s', (platformCategory, code, expected) => {
    const result = calculate({
      platformCategory,
      ...(platformCategory === 'CUSTOM'
        ? { customCategoryDescription: 'Plataforma especifica' }
        : {})
    });

    expect(itemTotal(result, code)).toBe(expected);
  });

  it('registra explicitamente a estrutura de conta e cobra multi-organizacao', () => {
    const singleOrganization = calculate();
    const multiOrganization = calculate({ accountStructure: 'MULTI_ORGANIZATION' });

    expect(itemTotal(singleOrganization, 'WEB_PLATFORM_ACCOUNT_SINGLE_ORGANIZATION'))
      .toBe('0.00');
    expect(itemTotal(multiOrganization, 'WEB_PLATFORM_ACCOUNT_MULTI_ORGANIZATION'))
      .toBe('3500.00');
    expect(multiOrganization.finalTotal.minus(singleOrganization.finalTotal).toFixed(2))
      .toBe('3500.00');
  });

  it('cobra telas adicionais conforme a abordagem de design', () => {
    const clientProvided = calculate({ screenCount: 8 });
    const designSystem = calculate({
      screenCount: 8,
      designApproach: 'DESIGN_SYSTEM_ADAPTATION'
    });
    const customDesign = calculate({
      screenCount: 8,
      designApproach: 'CUSTOM_DESIGN'
    });

    expect(itemTotal(clientProvided, 'WEB_PLATFORM_EXTRA_SCREEN_CLIENT_PROVIDED'))
      .toBe('0.00');
    expect(itemTotal(designSystem, 'WEB_PLATFORM_DESIGN_SYSTEM_ADAPTATION'))
      .toBe('1500.00');
    expect(itemTotal(designSystem, 'WEB_PLATFORM_EXTRA_SCREEN_DESIGN_SYSTEM_ADAPTATION'))
      .toBe('750.00');
    expect(itemTotal(customDesign, 'WEB_PLATFORM_DESIGN_CUSTOM')).toBe('3000.00');
    expect(itemTotal(customDesign, 'WEB_PLATFORM_EXTRA_SCREEN_CUSTOM_DESIGN')).toBe('1500.00');
  });

  it('cobra somente perfis acima de dois e idiomas acima de um', () => {
    const result = calculate({ userRoleCount: 5, languageCount: 3 });

    expect(itemTotal(result, 'WEB_PLATFORM_EXTRA_USER_ROLE')).toBe('1200.00');
    expect(itemTotal(result, 'WEB_PLATFORM_EXTRA_LANGUAGE')).toBe('1600.00');
  });

  it('precifica cada modulo pela complexidade e preserva seu contexto', () => {
    const result = calculate({
      functionalModules: [
        { name: 'Perfil', complexity: 'SIMPLE' },
        { name: 'Assinaturas', description: 'Ciclo completo', complexity: 'STANDARD' },
        { name: 'Matching', complexity: 'COMPLEX' }
      ]
    });

    expect(result.items.filter((item) => item.code.startsWith('WEB_PLATFORM_MODULE_')))
      .toHaveLength(3);
    expect(itemTotal(result, 'WEB_PLATFORM_MODULE_SIMPLE')).toBe('1200.00');
    expect(itemTotal(result, 'WEB_PLATFORM_MODULE_STANDARD')).toBe('2500.00');
    expect(itemTotal(result, 'WEB_PLATFORM_MODULE_COMPLEX')).toBe('4500.00');
    expect(result.items.find((item) => item.metadata?.moduleName === 'Assinaturas'))
      .toMatchObject({ description: 'Ciclo completo' });
  });

  it('precifica backoffice, dashboards e relatorios por itens separados', () => {
    const result = calculate({
      adminBackoffice: 'CUSTOM',
      dashboardCount: 2,
      reportCount: 3
    });

    expect(itemTotal(result, 'WEB_PLATFORM_BACKOFFICE_CUSTOM')).toBe('4500.00');
    expect(itemTotal(result, 'WEB_PLATFORM_DASHBOARD')).toBe('2400.00');
    expect(itemTotal(result, 'WEB_PLATFORM_REPORT')).toBe('1800.00');
  });

  it('precifica autenticacao, pagamentos e notificacoes selecionados', () => {
    const result = calculate({
      platformCategory: 'MARKETPLACE',
      additionalAuthentication: ['SOCIAL_LOGIN', 'MFA', 'SSO'],
      paymentFeatures: ['ONE_TIME', 'SUBSCRIPTION', 'MARKETPLACE_SPLIT'],
      notificationChannels: ['IN_APP', 'EMAIL', 'WHATSAPP_SMS']
    });

    expect(itemTotal(result, 'WEB_PLATFORM_AUTH_SOCIAL_LOGIN')).toBe('800.00');
    expect(itemTotal(result, 'WEB_PLATFORM_AUTH_MFA')).toBe('1500.00');
    expect(itemTotal(result, 'WEB_PLATFORM_AUTH_SSO')).toBe('3500.00');
    expect(itemTotal(result, 'WEB_PLATFORM_PAYMENT_ONE_TIME')).toBe('1800.00');
    expect(itemTotal(result, 'WEB_PLATFORM_PAYMENT_SUBSCRIPTION')).toBe('3000.00');
    expect(itemTotal(result, 'WEB_PLATFORM_PAYMENT_MARKETPLACE_SPLIT')).toBe('6000.00');
    expect(itemTotal(result, 'WEB_PLATFORM_NOTIFICATION_IN_APP')).toBe('700.00');
    expect(itemTotal(result, 'WEB_PLATFORM_NOTIFICATION_EMAIL')).toBe('800.00');
    expect(itemTotal(result, 'WEB_PLATFORM_NOTIFICATION_WHATSAPP_SMS')).toBe('1500.00');
  });

  it('precifica arquivos, auditoria, integracoes e importacao estruturada', () => {
    const result = calculate({
      fileHandling: 'DOCUMENT_WORKFLOW',
      auditLevel: 'COMPLETE',
      integrations: [
        { name: 'Analytics', complexity: 'SIMPLE' },
        { name: 'CRM', description: 'Sincronizacao bidirecional', complexity: 'STANDARD' },
        { name: 'ERP', complexity: 'COMPLEX' }
      ],
      dataMigration: 'STRUCTURED_IMPORT',
      dataMigrationSourceCount: 2
    });

    expect(itemTotal(result, 'WEB_PLATFORM_FILE_DOCUMENT_WORKFLOW')).toBe('2500.00');
    expect(itemTotal(result, 'WEB_PLATFORM_AUDIT_COMPLETE')).toBe('2500.00');
    expect(itemTotal(result, 'WEB_PLATFORM_INTEGRATION_SIMPLE')).toBe('500.00');
    expect(itemTotal(result, 'WEB_PLATFORM_INTEGRATION_STANDARD')).toBe('1200.00');
    expect(itemTotal(result, 'WEB_PLATFORM_INTEGRATION_COMPLEX')).toBe('2500.00');
    expect(itemTotal(result, 'WEB_PLATFORM_DATA_MIGRATION_STRUCTURED_IMPORT')).toBe('2000.00');
    expect(result.items.find((item) => item.metadata?.integrationName === 'CRM'))
      .toMatchObject({ description: 'Sincronizacao bidirecional' });
  });

  it('precifica migracao legada por fonte', () => {
    const result = calculate({
      dataMigration: 'LEGACY_MIGRATION',
      dataMigrationSourceCount: 3
    });

    expect(itemTotal(result, 'WEB_PLATFORM_DATA_MIGRATION_LEGACY_MIGRATION'))
      .toBe('9000.00');
  });

  it.each([
    [undefined, '1.00'],
    ['2026-08-15', '1.00'],
    ['2026-08-14', '1.30'],
    ['2026-07-22', '1.30'],
    ['2026-07-21', '1.60']
  ] as const)('deriva a urgencia para a data %s', (targetLaunchDate, expected) => {
    expect(calculate({ targetLaunchDate }).urgencyMultiplier.toFixed(2)).toBe(expected);
  });

  it('aplica complexidade, urgencia e desconto somente aos servicos', () => {
    const result = calculate({
      accountStructure: 'MULTI_ORGANIZATION',
      hostingPlan: 'MJM_STANDARD',
      maintenancePlan: 'STANDARD',
      complexityAdjustment: 'MODERATE',
      complexityReason: 'Fluxos multi-organizacao',
      targetLaunchDate: '2026-07-21',
      discountPercentage: 10,
      discountReason: 'Condicao comercial'
    });

    expect(result.subtotal.toFixed(2)).toBe('11500.00');
    expect(result.finalTotal.toFixed(2)).toBe('19289.60');
    expect(result.monthlyRecurringTotal.toFixed(2)).toBe('1500.00');
  });

  it('mantem hospedagem e manutencao somente nas recorrencias mensais', () => {
    const result = calculate({
      hostingPlan: 'MJM_MANAGED',
      maintenancePlan: 'CUSTOM'
    });

    expect(result.subtotal.toFixed(2)).toBe('8700.00');
    expect(result.finalTotal.toFixed(2)).toBe('8700.00');
    expect(result.monthlyRecurringTotal.toFixed(2)).toBe('3000.00');
    expect(result.items.filter((item) => item.recurring).map((item) => item.code)).toEqual([
      'WEB_PLATFORM_HOSTING_MJM_MANAGED_MONTHLY',
      'WEB_PLATFORM_MAINTENANCE_CUSTOM_MONTHLY'
    ]);
  });

  it('falha quando uma configuracao selecionada nao esta disponivel', () => {
    expect(() => calculate({}, configs.filter(
      (configuration) => configuration.code !== 'WEB_PLATFORM_DESIGN_CLIENT_PROVIDED'
    ))).toThrow('Configuracao de preco ausente: WEB_PLATFORM_DESIGN_CLIENT_PROVIDED');
  });

  it('rejeita precos negativos e multiplicadores nao positivos', () => {
    const negativeBase = configs.map((configuration) => (
      configuration.code === 'WEB_PLATFORM_BASE_CLIENT_PORTAL'
        ? { ...configuration, value: new Decimal(-1) }
        : configuration
    ));
    const zeroMultiplier = configs.map((configuration) => (
      configuration.code === 'WEB_PLATFORM_COMPLEXITY_NONE'
        ? { ...configuration, value: new Decimal(0) }
        : configuration
    ));

    expect(() => calculate({}, negativeBase))
      .toThrow('Configuracao de preco negativa: WEB_PLATFORM_BASE_CLIENT_PORTAL');
    expect(() => calculate({}, zeroMultiplier))
      .toThrow('Multiplicadores devem ser maiores que zero');
  });

  it('rejeita datas alvo e datas de referencia invalidas', () => {
    expect(() => calculate({ targetLaunchDate: '2026-02-31' }))
      .toThrow('Data de lancamento invalida: 2026-02-31');
    expect(() => calculateWebPlatformBudget({
      ...baseInput,
      targetLaunchDate: '2026-08-15'
    }, configs, {
      referenceDate: new Date('invalid')
    })).toThrow('Data de referencia invalida');
  });
});
