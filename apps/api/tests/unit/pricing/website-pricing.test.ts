import type { WebsiteBudgetInput } from '@mjm/shared';
import { websiteBudgetInputSchema } from '@mjm/shared';
import { Decimal } from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { calculateWebsiteBudget } from '../../../src/modules/pricing/website-pricing.js';
import type { PricingConfigValue } from '../../../src/modules/pricing/pricing.types.js';

const values: Record<string, number> = {
  WEBSITE_BASE_LANDING_PAGE: 2500,
  WEBSITE_BASE_INSTITUCIONAL: 2800,
  WEBSITE_BASE_PORTAL_CONTEUDO: 3000,
  WEBSITE_EXTRA_SECTION: 300,
  WEBSITE_EXTRA_PAGE: 300,
  WEBSITE_UNIQUE_LAYOUT: 400,
  WEBSITE_DESIGN_CLIENT_PROVIDED: 0,
  WEBSITE_DESIGN_TEMPLATE_CUSTOMIZATION: 200,
  WEBSITE_DESIGN_CUSTOM: 1000,
  WEBSITE_CONTENT_MIGRATION: 100,
  WEBSITE_CONTENT_PRODUCTION: 250,
  WEBSITE_EXTRA_LANGUAGE: 800,
  WEBSITE_CMS_STANDARD: 1000,
  WEBSITE_CMS_CUSTOM: 3000,
  WEBSITE_FORM_SIMPLE: 300,
  WEBSITE_FORM_ADVANCED: 800,
  WEBSITE_INTEGRATION_SIMPLE: 300,
  WEBSITE_INTEGRATION_STANDARD: 800,
  WEBSITE_INTEGRATION_COMPLEX: 1600,
  WEBSITE_MODULE_BLOG: 1000,
  WEBSITE_MODULE_SITE_SEARCH: 800,
  WEBSITE_SEO_TECHNICAL_BASELINE: 0,
  WEBSITE_SEO_ON_PAGE_SETUP: 600,
  WEBSITE_SEO_CONTENT_STRATEGY: 1500,
  WEBSITE_DOMAIN_NEW_REGISTRATION: 200,
  WEBSITE_DOMAIN_TRANSFER: 300,
  WEBSITE_DOMAIN_CONFIGURATION_ONLY: 150,
  WEBSITE_HOSTING_MJM_STANDARD_SETUP: 500,
  WEBSITE_HOSTING_MJM_STANDARD_MONTHLY: 250,
  WEBSITE_HOSTING_MJM_MANAGED_SETUP: 800,
  WEBSITE_HOSTING_MJM_MANAGED_MONTHLY: 500,
  WEBSITE_MAINTENANCE_ESSENTIAL_MONTHLY: 250,
  WEBSITE_MAINTENANCE_STANDARD_MONTHLY: 500,
  WEBSITE_MAINTENANCE_CUSTOM_MONTHLY: 1000,
  WEBSITE_COMPLEXITY_NONE: 1,
  WEBSITE_COMPLEXITY_MODERATE: 1.2,
  WEBSITE_COMPLEXITY_HIGH: 1.5,
  WEBSITE_URGENCY_NORMAL: 1,
  WEBSITE_URGENCY_PRIORITY: 1.3,
  WEBSITE_URGENCY_EXPRESS: 1.6
};

const configs: PricingConfigValue[] = Object.entries(values).map(([code, value]) => ({
  code,
  name: code,
  category: code.split('_')[1] ?? 'WEBSITE',
  value: new Decimal(value)
}));

const baseInput: WebsiteBudgetInput = {
  websiteCategory: 'LANDING_PAGE',
  sectionCount: 5,
  pageCount: 1,
  uniqueLayoutCount: 1,
  languageCount: 1,
  contentResponsibility: 'CLIENT_PROVIDES_READY',
  contentMigrationCount: 0,
  designApproach: 'CLIENT_PROVIDED',
  contentManagement: 'NONE',
  simpleFormCount: 0,
  advancedFormCount: 0,
  integrations: [],
  additionalModules: [],
  seoLevel: 'TECHNICAL_BASELINE',
  domainService: 'CLIENT_MANAGED',
  hostingPlan: 'CLIENT_MANAGED',
  maintenancePlan: 'NONE',
  complexityAdjustment: 'NONE',
  discountPercentage: 0
};

const referenceDate = new Date('2026-07-01T12:00:00.000Z');

function calculate(
  partialInput: Partial<WebsiteBudgetInput> = {},
  pricingConfigs = configs
) {
  return calculateWebsiteBudget(
    { ...baseInput, ...partialInput },
    pricingConfigs,
    { referenceDate }
  );
}

function itemTotal(result: ReturnType<typeof calculate>, code: string): string | undefined {
  return result.items.find((item) => item.code === code)?.totalPrice.toFixed(2);
}

describe('contrato de entrada da precificacao de website', () => {
  it('aceita o escopo minimo completo', () => {
    expect(websiteBudgetInputSchema.parse(baseInput)).toEqual(baseInput);
  });

  it('valida a relacao entre paginas e layouts fora de landing pages', () => {
    const result = websiteBudgetInputSchema.safeParse({
      ...baseInput,
      websiteCategory: 'INSTITUCIONAL',
      pageCount: 2,
      uniqueLayoutCount: 3
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['uniqueLayoutCount']);
  });

  it('valida as regras de responsabilidade pelo conteudo', () => {
    expect(websiteBudgetInputSchema.safeParse({
      ...baseInput,
      contentResponsibility: 'MJM_MIGRATES_EXISTING',
      contentMigrationCount: 0
    }).success).toBe(false);
    expect(websiteBudgetInputSchema.safeParse({
      ...baseInput,
      contentResponsibility: 'MJM_PRODUCES_CONTENT',
      contentMigrationCount: 1
    }).success).toBe(false);
    expect(websiteBudgetInputSchema.safeParse({
      ...baseInput,
      contentResponsibility: 'MJM_MIGRATES_EXISTING',
      contentMigrationCount: 1
    }).success).toBe(true);
  });

  it('impede blog duplicado no portal e exige CMS quando ha conteudo gerenciavel', () => {
    expect(websiteBudgetInputSchema.safeParse({
      ...baseInput,
      websiteCategory: 'PORTAL_CONTEUDO',
      contentManagement: 'STANDARD_CMS',
      additionalModules: ['BLOG']
    }).success).toBe(false);
    expect(websiteBudgetInputSchema.safeParse({
      ...baseInput,
      websiteCategory: 'PORTAL_CONTEUDO'
    }).success).toBe(false);
    expect(websiteBudgetInputSchema.safeParse({
      ...baseInput,
      additionalModules: ['BLOG']
    }).success).toBe(false);
  });

  it('rejeita modulos repetidos e mais de vinte integracoes', () => {
    expect(websiteBudgetInputSchema.safeParse({
      ...baseInput,
      additionalModules: ['SITE_SEARCH', 'SITE_SEARCH']
    }).success).toBe(false);
    expect(websiteBudgetInputSchema.safeParse({
      ...baseInput,
      integrations: Array.from({ length: 21 }, (_, index) => ({
        name: `Integracao ${index}`,
        complexity: 'SIMPLE'
      }))
    }).success).toBe(false);
  });

  it('exige justificativas condicionais e limita o desconto a duas casas', () => {
    expect(websiteBudgetInputSchema.safeParse({
      ...baseInput,
      complexityAdjustment: 'MODERATE'
    }).success).toBe(false);
    expect(websiteBudgetInputSchema.safeParse({
      ...baseInput,
      discountPercentage: 10
    }).success).toBe(false);
    expect(websiteBudgetInputSchema.safeParse({
      ...baseInput,
      discountPercentage: 10.123,
      discountReason: 'Condicao comercial'
    }).success).toBe(false);
    expect(websiteBudgetInputSchema.safeParse({
      ...baseInput,
      complexityAdjustment: 'MODERATE',
      complexityReason: 'Fluxos adicionais',
      discountPercentage: 10.12,
      discountReason: 'Condicao comercial'
    }).success).toBe(true);
  });

  it('aceita somente a representacao YYYY-MM-DD para a data alvo', () => {
    expect(websiteBudgetInputSchema.safeParse({
      ...baseInput,
      targetLaunchDate: '2026-07-31'
    }).success).toBe(true);
    expect(websiteBudgetInputSchema.safeParse({
      ...baseInput,
      targetLaunchDate: '31/07/2026'
    }).success).toBe(false);
    expect(websiteBudgetInputSchema.safeParse({
      ...baseInput,
      targetLaunchDate: '2026-02-31'
    }).success).toBe(false);
  });

  it('impõe limites técnicos para contagens persistidas', () => {
    expect(websiteBudgetInputSchema.safeParse({
      ...baseInput,
      websiteCategory: 'INSTITUCIONAL',
      sectionCount: 200,
      pageCount: 200,
      uniqueLayoutCount: 200,
      contentResponsibility: 'MJM_MIGRATES_EXISTING',
      contentMigrationCount: 200,
      simpleFormCount: 100,
      advancedFormCount: 50
    }).success).toBe(true);

    for (const [field, value] of Object.entries({
      sectionCount: 201,
      pageCount: 201,
      uniqueLayoutCount: 201,
      contentMigrationCount: 201,
      simpleFormCount: 101,
      advancedFormCount: 51
    })) {
      expect(websiteBudgetInputSchema.safeParse({ ...baseInput, [field]: value }).success)
        .toBe(false);
    }
  });
});

describe('precificacao de website', () => {
  it.each([
    ['LANDING_PAGE', 'WEBSITE_BASE_LANDING_PAGE', '2500.00'],
    ['INSTITUCIONAL', 'WEBSITE_BASE_INSTITUCIONAL', '2800.00'],
    ['PORTAL_CONTEUDO', 'WEBSITE_BASE_PORTAL_CONTEUDO', '3000.00']
  ] as const)('seleciona a base de %s', (websiteCategory, code, expected) => {
    const result = calculate({ websiteCategory });
    expect(itemTotal(result, code)).toBe(expected);
  });

  it('cobra somente as secoes acima das cinco incluidas na landing page', () => {
    expect(calculate({ sectionCount: 5 }).finalTotal.toFixed(2)).toBe('2500.00');
    const result = calculate({ sectionCount: 7 });
    expect(itemTotal(result, 'WEBSITE_EXTRA_SECTION')).toBe('600.00');
    expect(result.finalTotal.toFixed(2)).toBe('3100.00');
  });

  it('cobra paginas acima de cinco e layouts acima de dois nos demais sites', () => {
    const result = calculate({
      websiteCategory: 'INSTITUCIONAL',
      pageCount: 7,
      uniqueLayoutCount: 4
    });

    expect(itemTotal(result, 'WEBSITE_EXTRA_PAGE')).toBe('600.00');
    expect(itemTotal(result, 'WEBSITE_UNIQUE_LAYOUT')).toBe('800.00');
    expect(result.finalTotal.toFixed(2)).toBe('4200.00');
  });

  it('precifica design, conteudo e idiomas com quantidades explicitas', () => {
    const result = calculate({
      sectionCount: 6,
      designApproach: 'CUSTOM_DESIGN',
      contentResponsibility: 'MJM_PRODUCES_CONTENT',
      languageCount: 3
    });

    expect(itemTotal(result, 'WEBSITE_DESIGN_CUSTOM')).toBe('1000.00');
    expect(itemTotal(result, 'WEBSITE_CONTENT_PRODUCTION')).toBe('1500.00');
    expect(itemTotal(result, 'WEBSITE_EXTRA_LANGUAGE')).toBe('1600.00');
    expect(result.finalTotal.toFixed(2)).toBe('6900.00');
  });

  it('usa a quantidade informada para migracao de conteudo', () => {
    const result = calculate({
      contentResponsibility: 'MJM_MIGRATES_EXISTING',
      contentMigrationCount: 12
    });

    expect(itemTotal(result, 'WEBSITE_CONTENT_MIGRATION')).toBe('1200.00');
  });

  it('precifica CMS, formularios, integracoes, modulos e SEO separadamente', () => {
    const result = calculate({
      contentManagement: 'STANDARD_CMS',
      simpleFormCount: 2,
      advancedFormCount: 1,
      integrations: [
        { name: 'Analytics', complexity: 'SIMPLE' },
        { name: 'CRM', complexity: 'STANDARD' },
        { name: 'ERP', complexity: 'COMPLEX' }
      ],
      additionalModules: ['BLOG', 'SITE_SEARCH'],
      seoLevel: 'CONTENT_STRATEGY'
    });

    expect(itemTotal(result, 'WEBSITE_CMS_STANDARD')).toBe('1000.00');
    expect(itemTotal(result, 'WEBSITE_FORM_SIMPLE')).toBe('600.00');
    expect(itemTotal(result, 'WEBSITE_FORM_ADVANCED')).toBe('800.00');
    expect(itemTotal(result, 'WEBSITE_MODULE_BLOG')).toBe('1000.00');
    expect(itemTotal(result, 'WEBSITE_MODULE_SITE_SEARCH')).toBe('800.00');
    expect(itemTotal(result, 'WEBSITE_SEO_CONTENT_STRATEGY')).toBe('1500.00');
    expect(result.items.filter((item) => item.code.startsWith('WEBSITE_INTEGRATION_')))
      .toHaveLength(3);
    expect(result.items.find((item) => item.metadata?.integrationName === 'ERP')?.totalPrice.toFixed(2))
      .toBe('1600.00');
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
      designApproach: 'CUSTOM_DESIGN',
      domainService: 'NEW_REGISTRATION',
      hostingPlan: 'MJM_STANDARD',
      complexityAdjustment: 'MODERATE',
      complexityReason: 'Escopo moderado',
      targetLaunchDate: '2026-07-21',
      discountPercentage: 10,
      discountReason: 'Condicao comercial'
    });

    expect(result.subtotal.toFixed(2)).toBe('4200.00');
    expect(result.finalTotal.toFixed(2)).toBe('6748.00');
    expect(result.monthlyRecurringTotal.toFixed(2)).toBe('250.00');
  });

  it('mantem hospedagem e manutencao somente nas recorrencias mensais', () => {
    const result = calculate({
      hostingPlan: 'MJM_MANAGED',
      maintenancePlan: 'CUSTOM'
    });

    expect(result.subtotal.toFixed(2)).toBe('3300.00');
    expect(result.finalTotal.toFixed(2)).toBe('3300.00');
    expect(result.monthlyRecurringTotal.toFixed(2)).toBe('1500.00');
    expect(result.items.filter((item) => item.recurring).map((item) => item.code)).toEqual([
      'WEBSITE_HOSTING_MJM_MANAGED_MONTHLY',
      'WEBSITE_MAINTENANCE_CUSTOM_MONTHLY'
    ]);
  });

  it('falha quando uma configuracao selecionada nao esta disponivel', () => {
    expect(() => calculate({}, configs.filter(
      (configuration) => configuration.code !== 'WEBSITE_DESIGN_CLIENT_PROVIDED'
    ))).toThrow('Configuracao de preco ausente: WEBSITE_DESIGN_CLIENT_PROVIDED');
  });

  it('rejeita precos negativos e multiplicadores nao positivos', () => {
    const negativeBase = configs.map((configuration) => configuration.code === 'WEBSITE_BASE_LANDING_PAGE'
      ? { ...configuration, value: new Decimal(-1) }
      : configuration);
    const zeroMultiplier = configs.map((configuration) => configuration.code === 'WEBSITE_COMPLEXITY_NONE'
      ? { ...configuration, value: new Decimal(0) }
      : configuration);

    expect(() => calculate({}, negativeBase))
      .toThrow('Configuracao de preco negativa: WEBSITE_BASE_LANDING_PAGE');
    expect(() => calculate({}, zeroMultiplier))
      .toThrow('Multiplicadores devem ser maiores que zero');
  });

  it('arredonda meio centavo por linha com ROUND_HALF_UP', () => {
    const roundedConfigs = configs.map((configuration) => (
      [
        'WEBSITE_BASE_LANDING_PAGE',
        'WEBSITE_DESIGN_CLIENT_PROVIDED',
        'WEBSITE_SEO_TECHNICAL_BASELINE'
      ].includes(configuration.code)
        ? { ...configuration, value: new Decimal('0.005') }
        : configuration
    ));
    const result = calculate({}, roundedConfigs);

    expect(result.items.map((item) => item.unitPrice.toFixed(2))).toEqual([
      '0.01', '0.01', '0.01'
    ]);
    expect(result.subtotal.toFixed(2)).toBe('0.03');
    expect(result.finalTotal.toFixed(2)).toBe('0.03');
  });

  it('preserva os extremos de desconto sem alterar recorrencias', () => {
    const withoutDiscount = calculate({ discountPercentage: 0 });
    const fullDiscount = calculate({
      discountPercentage: 100,
      discountReason: 'Cortesia comercial aprovada',
      hostingPlan: 'MJM_STANDARD',
      maintenancePlan: 'ESSENTIAL'
    });

    expect(withoutDiscount.finalTotal.toFixed(2)).toBe('2500.00');
    expect(fullDiscount.finalTotal.toFixed(2)).toBe('500.00');
    expect(fullDiscount.monthlyRecurringTotal.toFixed(2)).toBe('500.00');
  });

  it('mantem o golden completo de Website com itens e totais estaveis', () => {
    const result = calculate({
      websiteCategory: 'INSTITUCIONAL',
      sectionCount: 1,
      pageCount: 7,
      uniqueLayoutCount: 3,
      languageCount: 2,
      contentResponsibility: 'MJM_MIGRATES_EXISTING',
      contentMigrationCount: 4,
      designApproach: 'CUSTOM_DESIGN',
      contentManagement: 'CUSTOM_ADMIN',
      simpleFormCount: 2,
      advancedFormCount: 1,
      integrations: [
        { name: 'HubSpot', complexity: 'STANDARD' },
        { name: 'ERP do cliente', complexity: 'COMPLEX' }
      ],
      additionalModules: ['BLOG', 'SITE_SEARCH'],
      seoLevel: 'CONTENT_STRATEGY',
      domainService: 'NEW_REGISTRATION',
      hostingPlan: 'MJM_MANAGED',
      maintenancePlan: 'STANDARD',
      complexityAdjustment: 'MODERATE',
      complexityReason: 'Integracoes e painel administrativo personalizado',
      discountPercentage: 10,
      discountReason: 'Condicao comercial aprovada'
    });

    expect(result.items.map((item) => [item.code, item.quantity, item.recurring, item.displayOrder]))
      .toEqual([
        ['WEBSITE_BASE_INSTITUCIONAL', 1, false, 0],
        ['WEBSITE_EXTRA_PAGE', 2, false, 1],
        ['WEBSITE_UNIQUE_LAYOUT', 1, false, 2],
        ['WEBSITE_DESIGN_CUSTOM', 1, false, 3],
        ['WEBSITE_CONTENT_MIGRATION', 4, false, 4],
        ['WEBSITE_EXTRA_LANGUAGE', 1, false, 5],
        ['WEBSITE_CMS_CUSTOM', 1, false, 6],
        ['WEBSITE_FORM_SIMPLE', 2, false, 7],
        ['WEBSITE_FORM_ADVANCED', 1, false, 8],
        ['WEBSITE_INTEGRATION_STANDARD', 1, false, 9],
        ['WEBSITE_INTEGRATION_COMPLEX', 1, false, 10],
        ['WEBSITE_MODULE_BLOG', 1, false, 11],
        ['WEBSITE_MODULE_SITE_SEARCH', 1, false, 12],
        ['WEBSITE_SEO_CONTENT_STRATEGY', 1, false, 13],
        ['WEBSITE_DOMAIN_NEW_REGISTRATION', 1, false, 14],
        ['WEBSITE_HOSTING_MJM_MANAGED_SETUP', 1, false, 15],
        ['WEBSITE_HOSTING_MJM_MANAGED_MONTHLY', 1, true, 16],
        ['WEBSITE_MAINTENANCE_STANDARD_MONTHLY', 1, true, 17]
      ]);
    expect(result.subtotal.toFixed(2)).toBe('17100.00');
    expect(result.complexityMultiplier.toFixed(2)).toBe('1.20');
    expect(result.urgencyMultiplier.toFixed(2)).toBe('1.00');
    expect(result.discountPercentage.toFixed(2)).toBe('10.00');
    expect(result.finalTotal.toFixed(2)).toBe('18388.00');
    expect(result.monthlyRecurringTotal.toFixed(2)).toBe('1000.00');
  });
});
