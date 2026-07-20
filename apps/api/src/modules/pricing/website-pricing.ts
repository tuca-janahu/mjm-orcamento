import type { WebsiteBudgetInput } from '@mjm/shared';
import { Decimal } from 'decimal.js';
import type {
  CalculatedBudgetItem,
  PricingConfigValue,
  PricingResult,
  WebsitePricingOptions,
  WebsiteUrgencyLevel
} from './pricing.types.js';

const MILLISECONDS_PER_DAY = 86_400_000;

const websiteBaseCodes: Record<WebsiteBudgetInput['websiteCategory'], string> = {
  LANDING_PAGE: 'WEBSITE_BASE_LANDING_PAGE',
  INSTITUCIONAL: 'WEBSITE_BASE_INSTITUCIONAL',
  PORTAL_CONTEUDO: 'WEBSITE_BASE_PORTAL_CONTEUDO'
};

const designCodes: Record<WebsiteBudgetInput['designApproach'], string> = {
  CLIENT_PROVIDED: 'WEBSITE_DESIGN_CLIENT_PROVIDED',
  TEMPLATE_CUSTOMIZATION: 'WEBSITE_DESIGN_TEMPLATE_CUSTOMIZATION',
  CUSTOM_DESIGN: 'WEBSITE_DESIGN_CUSTOM'
};

const integrationCodes: Record<WebsiteBudgetInput['integrations'][number]['complexity'], string> = {
  SIMPLE: 'WEBSITE_INTEGRATION_SIMPLE',
  STANDARD: 'WEBSITE_INTEGRATION_STANDARD',
  COMPLEX: 'WEBSITE_INTEGRATION_COMPLEX'
};

const moduleCodes: Record<WebsiteBudgetInput['additionalModules'][number], string> = {
  BLOG: 'WEBSITE_MODULE_BLOG',
  SITE_SEARCH: 'WEBSITE_MODULE_SITE_SEARCH'
};

const seoCodes: Record<WebsiteBudgetInput['seoLevel'], string> = {
  TECHNICAL_BASELINE: 'WEBSITE_SEO_TECHNICAL_BASELINE',
  ON_PAGE_SETUP: 'WEBSITE_SEO_ON_PAGE_SETUP',
  CONTENT_STRATEGY: 'WEBSITE_SEO_CONTENT_STRATEGY'
};

const complexityCodes: Record<WebsiteBudgetInput['complexityAdjustment'], string> = {
  NONE: 'WEBSITE_COMPLEXITY_NONE',
  MODERATE: 'WEBSITE_COMPLEXITY_MODERATE',
  HIGH: 'WEBSITE_COMPLEXITY_HIGH'
};

const urgencyCodes: Record<WebsiteUrgencyLevel, string> = {
  NORMAL: 'WEBSITE_URGENCY_NORMAL',
  PRIORIDADE: 'WEBSITE_URGENCY_PRIORITY',
  EXPRESSO: 'WEBSITE_URGENCY_EXPRESS'
};

function money(value: Decimal.Value): Decimal {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

function dateOnlyTimestamp(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) throw new Error(`Data de lancamento invalida: ${value}`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    throw new Error(`Data de lancamento invalida: ${value}`);
  }

  return date.getTime();
}

function referenceDateTimestamp(referenceDate: Date): number {
  if (Number.isNaN(referenceDate.getTime())) throw new Error('Data de referencia invalida');
  return Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  );
}

function urgencyFor(
  targetLaunchDate: string | undefined,
  referenceDate: Date
): WebsiteUrgencyLevel {
  if (targetLaunchDate === undefined) return 'NORMAL';

  const daysUntilLaunch = Math.round(
    (dateOnlyTimestamp(targetLaunchDate) - referenceDateTimestamp(referenceDate))
      / MILLISECONDS_PER_DAY
  );

  if (daysUntilLaunch >= 45) return 'NORMAL';
  if (daysUntilLaunch >= 21) return 'PRIORIDADE';
  return 'EXPRESSO';
}

export function calculateWebsiteBudget(
  input: WebsiteBudgetInput,
  configurations: PricingConfigValue[],
  options: WebsitePricingOptions = {}
): PricingResult {
  const configurationMap = new Map(
    configurations.map((configuration) => [configuration.code, configuration])
  );
  const items: CalculatedBudgetItem[] = [];
  let displayOrder = 0;
  let serviceSubtotal = new Decimal(0);

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
      adjustableService?: boolean;
      outputCode?: string;
      name?: string;
      metadata?: Record<string, string | number | boolean>;
    } = {}
  ): void {
    const configuration = config(code);
    const quantity = options.quantity ?? 1;
    const unitPrice = money(configuration.value);
    const totalPrice = money(unitPrice.times(quantity));
    const recurring = options.recurring ?? false;

    items.push({
      code: options.outputCode ?? code,
      name: options.name ?? configuration.name,
      category: configuration.category,
      quantity,
      unitPrice,
      totalPrice,
      recurring,
      displayOrder: displayOrder++,
      ...(options.metadata === undefined ? {} : { metadata: options.metadata })
    });

    if (!recurring && (options.adjustableService ?? true)) {
      serviceSubtotal = serviceSubtotal.plus(totalPrice);
    }
  }

  addItem(websiteBaseCodes[input.websiteCategory]);

  if (input.websiteCategory === 'LANDING_PAGE') {
    const additionalSections = Math.max(0, input.sectionCount - 5);
    if (additionalSections > 0) {
      addItem('WEBSITE_EXTRA_SECTION', {
        quantity: additionalSections,
        metadata: { includedSections: 5, informedSections: input.sectionCount }
      });
    }
  } else {
    const additionalPages = Math.max(0, input.pageCount - 5);
    if (additionalPages > 0) {
      addItem('WEBSITE_EXTRA_PAGE', {
        quantity: additionalPages,
        metadata: { includedPages: 5, informedPages: input.pageCount }
      });
    }

    const additionalLayouts = Math.max(0, input.uniqueLayoutCount - 2);
    if (additionalLayouts > 0) {
      addItem('WEBSITE_UNIQUE_LAYOUT', {
        quantity: additionalLayouts,
        metadata: { includedLayouts: 2, informedLayouts: input.uniqueLayoutCount }
      });
    }
  }

  addItem(designCodes[input.designApproach]);

  if (input.contentResponsibility === 'MJM_MIGRATES_EXISTING') {
    addItem('WEBSITE_CONTENT_MIGRATION', { quantity: input.contentMigrationCount });
  } else if (input.contentResponsibility === 'MJM_PRODUCES_CONTENT') {
    const contentUnitCount = input.websiteCategory === 'LANDING_PAGE'
      ? input.sectionCount
      : input.pageCount;
    addItem('WEBSITE_CONTENT_PRODUCTION', {
      quantity: contentUnitCount,
      metadata: {
        unit: input.websiteCategory === 'LANDING_PAGE' ? 'SECTION' : 'PAGE'
      }
    });
  }

  const additionalLanguages = input.languageCount - 1;
  if (additionalLanguages > 0) {
    addItem('WEBSITE_EXTRA_LANGUAGE', { quantity: additionalLanguages });
  }

  if (input.contentManagement === 'STANDARD_CMS') addItem('WEBSITE_CMS_STANDARD');
  if (input.contentManagement === 'CUSTOM_ADMIN') addItem('WEBSITE_CMS_CUSTOM');

  if (input.simpleFormCount > 0) {
    addItem('WEBSITE_FORM_SIMPLE', { quantity: input.simpleFormCount });
  }
  if (input.advancedFormCount > 0) {
    addItem('WEBSITE_FORM_ADVANCED', { quantity: input.advancedFormCount });
  }

  for (const integration of input.integrations) {
    const code = integrationCodes[integration.complexity];
    const configuration = config(code);
    addItem(code, {
      name: `${configuration.name}: ${integration.name}`,
      metadata: {
        integrationName: integration.name,
        complexity: integration.complexity
      }
    });
  }

  for (const additionalModule of input.additionalModules) {
    addItem(moduleCodes[additionalModule]);
  }

  addItem(seoCodes[input.seoLevel]);

  if (input.domainService !== 'CLIENT_MANAGED') {
    const domainCode = input.domainService === 'CONFIGURATION_ONLY'
      ? 'WEBSITE_DOMAIN_CONFIGURATION_ONLY'
      : `WEBSITE_DOMAIN_${input.domainService}`;
    addItem(domainCode, { adjustableService: false });
  }

  if (input.hostingPlan !== 'CLIENT_MANAGED') {
    const plan = input.hostingPlan === 'MJM_STANDARD' ? 'MJM_STANDARD' : 'MJM_MANAGED';
    addItem(`WEBSITE_HOSTING_${plan}_SETUP`, { adjustableService: false });
    addItem(`WEBSITE_HOSTING_${plan}_MONTHLY`, { recurring: true });
  }

  if (input.maintenancePlan !== 'NONE') {
    addItem(`WEBSITE_MAINTENANCE_${input.maintenancePlan}_MONTHLY`, { recurring: true });
  }

  const subtotal = money(
    items
      .filter((item) => !item.recurring)
      .reduce((total, item) => total.plus(item.totalPrice), new Decimal(0))
  );
  const complexityMultiplier = config(complexityCodes[input.complexityAdjustment]).value;
  const urgency = urgencyFor(input.targetLaunchDate, options.referenceDate ?? new Date());
  const urgencyMultiplier = config(urgencyCodes[urgency]).value;

  if (complexityMultiplier.lte(0) || urgencyMultiplier.lte(0)) {
    throw new Error('Multiplicadores devem ser maiores que zero');
  }

  const discountPercentage = new Decimal(input.discountPercentage);
  const discountFactor = new Decimal(1).minus(discountPercentage.dividedBy(100));
  const unadjustedSubtotal = subtotal.minus(serviceSubtotal);
  const adjustedServiceTotal = serviceSubtotal
    .times(complexityMultiplier)
    .times(urgencyMultiplier)
    .times(discountFactor);
  const finalTotal = money(adjustedServiceTotal.plus(unadjustedSubtotal));

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
