import { Decimal } from 'decimal.js';
import type { WebsiteBudgetInput } from '@mjm/shared';
import { describe, expect, it } from 'vitest';
import { calculateWebsiteBudget } from '../../../src/modules/pricing/website-pricing.js';
import type { PricingConfigValue } from '../../../src/modules/pricing/pricing.types.js';

const values: Record<string, number> = {
  WEBSITE_BASE_LANDING_PAGE: 500,
  WEBSITE_BASE_INSTITUCIONAL: 800,
  WEBSITE_BASE_BLOG: 1000,
  WEBSITE_BASE_ECOMMERCE: 1600,
  WEBSITE_BASE_PLATAFORMA: 2400,
  WEBSITE_EXTRA_PAGE: 300,
  WEBSITE_DESIGN_TEMPLATE: 200,
  WEBSITE_DESIGN_CUSTOM: 1000,
  WEBSITE_DEVELOPMENT_FRONTEND: 2000,
  WEBSITE_DEVELOPMENT_FULLSTACK: 3000,
  WEBSITE_ADMIN_PANEL: 2000,
  WEBSITE_INTEGRATION: 800,
  WEBSITE_PAYMENT_SYSTEM: 1500,
  WEBSITE_BLOG: 1000,
  WEBSITE_BASIC_SEO: 200,
  WEBSITE_DOMAIN: 200,
  WEBSITE_HOSTING: 500,
  WEBSITE_COMPLEXITY_SIMPLE: 1,
  WEBSITE_COMPLEXITY_MEDIUM: 1.2,
  WEBSITE_COMPLEXITY_COMPLEX: 1.5,
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
  websiteType: 'LANDING_PAGE',
  numberOfPages: 1,
  designType: 'TEMPLATE',
  developmentType: 'FRONTEND',
  hasAdminPanel: false,
  integrationCount: 0,
  hasPaymentSystem: false,
  hasBlog: false,
  hasBasicSeo: false,
  hasDomain: false,
  hasHosting: false,
  complexity: 'SIMPLES',
  urgency: 'NORMAL',
  requiresMonthlyMaintenance: false,
  discountPercentage: 0
};

function totalFor(input: Partial<WebsiteBudgetInput>): string {
  return calculateWebsiteBudget({ ...baseInput, ...input }, configs).finalTotal.toFixed(2);
}

describe('precificacao de website', () => {
  it.each([
    ['LANDING_PAGE', '2700.00'],
    ['INSTITUCIONAL', '3000.00'],
    ['BLOG', '3200.00'],
    ['ECOMMERCE', '3800.00'],
    ['PLATAFORMA', '4600.00']
  ] as const)('aplica o valor base de %s', (websiteType, expected) => {
    expect(totalFor({ websiteType })).toBe(expected);
  });

  it('cobra somente paginas acima das cinco incluidas', () => {
    expect(totalFor({ numberOfPages: 8 })).toBe('3600.00');
  });

  it.each([
    [{ designType: 'PERSONALIZADO' }, '3500.00'],
    [{ developmentType: 'FULLSTACK' }, '3700.00'],
    [{ hasAdminPanel: true }, '4700.00'],
    [{ integrationCount: 2 }, '4300.00'],
    [{ hasPaymentSystem: true }, '4200.00'],
    [{ hasBlog: true }, '3700.00'],
    [{ hasBasicSeo: true }, '2900.00'],
    [{ hasDomain: true }, '2900.00'],
    [{ hasHosting: true }, '3200.00']
  ] as const)('adiciona componente configurado', (input, expected) => {
    expect(totalFor(input)).toBe(expected);
  });

  it('aplica complexidade, urgencia e desconto na ordem definida', () => {
    expect(totalFor({ complexity: 'MEDIO', urgency: 'PRIORIDADE', discountPercentage: 10 })).toBe('3790.80');
  });

  it('calcula hospedagem e manutencao recorrentes separadamente', () => {
    const result = calculateWebsiteBudget(
      { ...baseInput, hasHosting: true, requiresMonthlyMaintenance: true },
      configs
    );

    expect(result.finalTotal.toFixed(2)).toBe('3200.00');
    expect(result.monthlyRecurringTotal.toFixed(2)).toBe('303.33');
    expect(result.items.filter((item) => item.recurring).map((item) => item.code)).toEqual([
      'WEBSITE_HOSTING_MONTHLY',
      'WEBSITE_MONTHLY_MAINTENANCE'
    ]);
  });

  it('calcula uma combinacao completa e preserva o detalhamento', () => {
    const result = calculateWebsiteBudget({
      websiteType: 'PLATAFORMA',
      numberOfPages: 10,
      designType: 'PERSONALIZADO',
      developmentType: 'FULLSTACK',
      hasAdminPanel: true,
      integrationCount: 2,
      hasPaymentSystem: true,
      hasBlog: false,
      hasBasicSeo: true,
      hasDomain: true,
      hasHosting: true,
      complexity: 'MEDIO',
      urgency: 'NORMAL',
      requiresMonthlyMaintenance: true,
      discountPercentage: 10,
      estimatedDeadlineDays: 90
    }, configs);

    expect(result.subtotal.toFixed(2)).toBe('13900.00');
    expect(result.finalTotal.toFixed(2)).toBe('15012.00');
    expect(result.monthlyRecurringTotal.toFixed(2)).toBe('500.20');
    expect(result.items).toHaveLength(12);
  });

  it('falha quando uma configuracao obrigatoria nao esta disponivel', () => {
    expect(() => calculateWebsiteBudget(baseInput, configs.filter((item) => item.code !== 'WEBSITE_DESIGN_TEMPLATE')))
      .toThrow('Configuracao de preco ausente: WEBSITE_DESIGN_TEMPLATE');
  });
});
