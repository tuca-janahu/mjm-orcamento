import type { WebsiteBudgetInput } from '@mjm/shared';
import { Decimal } from 'decimal.js';
import type {
  CalculatedBudgetItem,
  PricingConfigValue,
  PricingResult
} from './pricing.types.js';

const websiteBaseCodes: Record<WebsiteBudgetInput['websiteType'], string> = {
  LANDING_PAGE: 'WEBSITE_BASE_LANDING_PAGE',
  INSTITUCIONAL: 'WEBSITE_BASE_INSTITUCIONAL',
  BLOG: 'WEBSITE_BASE_BLOG',
  ECOMMERCE: 'WEBSITE_BASE_ECOMMERCE',
  PLATAFORMA: 'WEBSITE_BASE_PLATAFORMA'
};

const designCodes: Record<WebsiteBudgetInput['designType'], string> = {
  TEMPLATE: 'WEBSITE_DESIGN_TEMPLATE',
  PERSONALIZADO: 'WEBSITE_DESIGN_CUSTOM'
};

const developmentCodes: Record<WebsiteBudgetInput['developmentType'], string> = {
  FRONTEND: 'WEBSITE_DEVELOPMENT_FRONTEND',
  FULLSTACK: 'WEBSITE_DEVELOPMENT_FULLSTACK'
};

const complexityCodes: Record<WebsiteBudgetInput['complexity'], string> = {
  SIMPLES: 'WEBSITE_COMPLEXITY_SIMPLE',
  MEDIO: 'WEBSITE_COMPLEXITY_MEDIUM',
  COMPLEXO: 'WEBSITE_COMPLEXITY_COMPLEX'
};

const urgencyCodes: Record<WebsiteBudgetInput['urgency'], string> = {
  NORMAL: 'WEBSITE_URGENCY_NORMAL',
  PRIORIDADE: 'WEBSITE_URGENCY_PRIORITY',
  EXPRESSO: 'WEBSITE_URGENCY_EXPRESS'
};

function money(value: Decimal.Value): Decimal {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

function provisionalMonthlyMaintenance(finalTotal: Decimal): Decimal {
  return money(finalTotal.dividedBy(60));
}

export function calculateWebsiteBudget(
  input: WebsiteBudgetInput,
  configurations: PricingConfigValue[]
): PricingResult {
  const configurationMap = new Map(configurations.map((configuration) => [configuration.code, configuration]));
  const items: CalculatedBudgetItem[] = [];
  let displayOrder = 0;

  function config(code: string): PricingConfigValue {
    const configuration = configurationMap.get(code);
    if (configuration === undefined) {
      throw new Error(`Configuracao de preco ausente: ${code}`);
    }
    if (configuration.value.isNegative()) {
      throw new Error(`Configuracao de preco negativa: ${code}`);
    }
    return configuration;
  }

  function addItem(
    code: string,
    options: {
      quantity?: number;
      recurring?: boolean;
      unitPrice?: Decimal;
      outputCode?: string;
      name?: string;
      category?: string;
      metadata?: Record<string, string | number | boolean>;
    } = {}
  ): void {
    const configuration = config(code);
    const quantity = options.quantity ?? 1;
    const unitPrice = money(options.unitPrice ?? configuration.value);
    items.push({
      code: options.outputCode ?? code,
      name: options.name ?? configuration.name,
      category: options.category ?? configuration.category,
      quantity,
      unitPrice,
      totalPrice: money(unitPrice.times(quantity)),
      recurring: options.recurring ?? false,
      displayOrder: displayOrder++,
      ...(options.metadata === undefined ? {} : { metadata: options.metadata })
    });
  }

  addItem(websiteBaseCodes[input.websiteType]);

  const additionalPages = Math.max(0, input.numberOfPages - 5);
  if (additionalPages > 0) {
    addItem('WEBSITE_EXTRA_PAGE', {
      quantity: additionalPages,
      metadata: { includedPages: 5, informedPages: input.numberOfPages }
    });
  }

  addItem(designCodes[input.designType]);
  addItem(developmentCodes[input.developmentType]);

  if (input.hasAdminPanel) addItem('WEBSITE_ADMIN_PANEL');
  if (input.integrationCount > 0) addItem('WEBSITE_INTEGRATION', { quantity: input.integrationCount });
  if (input.hasPaymentSystem) addItem('WEBSITE_PAYMENT_SYSTEM');
  if (input.hasBlog) addItem('WEBSITE_BLOG');
  if (input.hasBasicSeo) addItem('WEBSITE_BASIC_SEO');
  if (input.hasDomain) addItem('WEBSITE_DOMAIN');
  if (input.hasHosting) addItem('WEBSITE_HOSTING');

  const subtotal = money(
    items
      .filter((item) => !item.recurring)
      .reduce((total, item) => total.plus(item.totalPrice), new Decimal(0))
  );
  const complexityMultiplier = config(complexityCodes[input.complexity]).value;
  const urgencyMultiplier = config(urgencyCodes[input.urgency]).value;

  if (!complexityMultiplier.isPositive() || !urgencyMultiplier.isPositive()) {
    throw new Error('Multiplicadores devem ser maiores que zero');
  }

  const discountPercentage = new Decimal(input.discountPercentage);
  const discountFactor = new Decimal(1).minus(discountPercentage.dividedBy(100));
  const finalTotal = money(
    subtotal.times(complexityMultiplier).times(urgencyMultiplier).times(discountFactor)
  );

  if (input.hasHosting) {
    const hosting = config('WEBSITE_HOSTING');
    addItem('WEBSITE_HOSTING', {
      outputCode: 'WEBSITE_HOSTING_MONTHLY',
      name: 'Hospedagem mensal',
      category: 'RECORRENCIA',
      recurring: true,
      unitPrice: money(hosting.value.dividedBy(2))
    });
  }

  if (input.requiresMonthlyMaintenance) {
    const monthlyMaintenance = provisionalMonthlyMaintenance(finalTotal);
    items.push({
      code: 'WEBSITE_MONTHLY_MAINTENANCE',
      name: 'Manutencao mensal',
      description: 'Regra provisoria: valor final dividido por 60',
      category: 'RECORRENCIA',
      quantity: 1,
      unitPrice: monthlyMaintenance,
      totalPrice: monthlyMaintenance,
      recurring: true,
      displayOrder: displayOrder++,
      metadata: { rule: 'FINAL_TOTAL_DIVIDED_BY_60' }
    });
  }

  const monthlyRecurringTotal = money(
    items
      .filter((item) => item.recurring)
      .reduce((total, item) => total.plus(item.totalPrice), new Decimal(0))
  );

  return {
    items,
    subtotal,
    complexityMultiplier,
    urgencyMultiplier,
    discountPercentage,
    finalTotal,
    monthlyRecurringTotal
  };
}
