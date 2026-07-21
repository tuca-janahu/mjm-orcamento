import type { WebPlatformBudgetInput } from '@mjm/shared';
import { Decimal } from 'decimal.js';
import type {
  CalculatedBudgetItem,
  PricingConfigValue,
  PricingResult,
  WebPlatformPricingOptions,
  WebPlatformUrgencyLevel
} from './pricing.types.js';

const MILLISECONDS_PER_DAY = 86_400_000;

const baseCodes: Record<WebPlatformBudgetInput['platformCategory'], string> = {
  CLIENT_PORTAL: 'WEB_PLATFORM_BASE_CLIENT_PORTAL',
  SAAS: 'WEB_PLATFORM_BASE_SAAS',
  MARKETPLACE: 'WEB_PLATFORM_BASE_MARKETPLACE',
  MEMBERSHIP_PLATFORM: 'WEB_PLATFORM_BASE_MEMBERSHIP_PLATFORM',
  CUSTOM: 'WEB_PLATFORM_BASE_CUSTOM'
};

const designCodes: Record<WebPlatformBudgetInput['designApproach'], string> = {
  CLIENT_PROVIDED: 'WEB_PLATFORM_DESIGN_CLIENT_PROVIDED',
  DESIGN_SYSTEM_ADAPTATION: 'WEB_PLATFORM_DESIGN_SYSTEM_ADAPTATION',
  CUSTOM_DESIGN: 'WEB_PLATFORM_DESIGN_CUSTOM'
};

const accountStructureCodes: Record<WebPlatformBudgetInput['accountStructure'], string> = {
  SINGLE_ORGANIZATION: 'WEB_PLATFORM_ACCOUNT_SINGLE_ORGANIZATION',
  MULTI_ORGANIZATION: 'WEB_PLATFORM_ACCOUNT_MULTI_ORGANIZATION'
};

const extraScreenCodes: Record<WebPlatformBudgetInput['designApproach'], string> = {
  CLIENT_PROVIDED: 'WEB_PLATFORM_EXTRA_SCREEN_CLIENT_PROVIDED',
  DESIGN_SYSTEM_ADAPTATION: 'WEB_PLATFORM_EXTRA_SCREEN_DESIGN_SYSTEM_ADAPTATION',
  CUSTOM_DESIGN: 'WEB_PLATFORM_EXTRA_SCREEN_CUSTOM_DESIGN'
};

const moduleCodes: Record<WebPlatformBudgetInput['functionalModules'][number]['complexity'], string> = {
  SIMPLE: 'WEB_PLATFORM_MODULE_SIMPLE',
  STANDARD: 'WEB_PLATFORM_MODULE_STANDARD',
  COMPLEX: 'WEB_PLATFORM_MODULE_COMPLEX'
};

const additionalAuthenticationCodes: Record<
  WebPlatformBudgetInput['additionalAuthentication'][number],
  string
> = {
  SOCIAL_LOGIN: 'WEB_PLATFORM_AUTH_SOCIAL_LOGIN',
  MFA: 'WEB_PLATFORM_AUTH_MFA',
  SSO: 'WEB_PLATFORM_AUTH_SSO'
};

const paymentCodes: Record<WebPlatformBudgetInput['paymentFeatures'][number], string> = {
  ONE_TIME: 'WEB_PLATFORM_PAYMENT_ONE_TIME',
  SUBSCRIPTION: 'WEB_PLATFORM_PAYMENT_SUBSCRIPTION',
  MARKETPLACE_SPLIT: 'WEB_PLATFORM_PAYMENT_MARKETPLACE_SPLIT'
};

const notificationCodes: Record<WebPlatformBudgetInput['notificationChannels'][number], string> = {
  IN_APP: 'WEB_PLATFORM_NOTIFICATION_IN_APP',
  EMAIL: 'WEB_PLATFORM_NOTIFICATION_EMAIL',
  WHATSAPP_SMS: 'WEB_PLATFORM_NOTIFICATION_WHATSAPP_SMS'
};

const integrationCodes: Record<WebPlatformBudgetInput['integrations'][number]['complexity'], string> = {
  SIMPLE: 'WEB_PLATFORM_INTEGRATION_SIMPLE',
  STANDARD: 'WEB_PLATFORM_INTEGRATION_STANDARD',
  COMPLEX: 'WEB_PLATFORM_INTEGRATION_COMPLEX'
};

const complexityCodes: Record<WebPlatformBudgetInput['complexityAdjustment'], string> = {
  NONE: 'WEB_PLATFORM_COMPLEXITY_NONE',
  MODERATE: 'WEB_PLATFORM_COMPLEXITY_MODERATE',
  HIGH: 'WEB_PLATFORM_COMPLEXITY_HIGH'
};

const urgencyCodes: Record<WebPlatformUrgencyLevel, string> = {
  NORMAL: 'WEB_PLATFORM_URGENCY_NORMAL',
  PRIORIDADE: 'WEB_PLATFORM_URGENCY_PRIORITY',
  EXPRESSO: 'WEB_PLATFORM_URGENCY_EXPRESS'
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
): WebPlatformUrgencyLevel {
  if (targetLaunchDate === undefined) return 'NORMAL';

  const daysUntilLaunch = Math.round(
    (dateOnlyTimestamp(targetLaunchDate) - referenceDateTimestamp(referenceDate))
      / MILLISECONDS_PER_DAY
  );

  if (daysUntilLaunch >= 45) return 'NORMAL';
  if (daysUntilLaunch >= 21) return 'PRIORIDADE';
  return 'EXPRESSO';
}

export function calculateWebPlatformBudget(
  input: WebPlatformBudgetInput,
  configurations: PricingConfigValue[],
  options: WebPlatformPricingOptions = {}
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
      description?: string;
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
      ...(options.description === undefined ? {} : { description: options.description }),
      ...(options.metadata === undefined ? {} : { metadata: options.metadata })
    });

    if (!recurring && (options.adjustableService ?? true)) {
      serviceSubtotal = serviceSubtotal.plus(totalPrice);
    }
  }

  const baseMetadata: Record<string, string | number | boolean> = {
    platformCategory: input.platformCategory,
    accountStructure: input.accountStructure,
    includedScreens: 5,
    includedUserRoles: 2,
    includedLanguages: 1
  };
  if (input.platformCategory === 'CUSTOM' && input.customCategoryDescription !== undefined) {
    baseMetadata.customCategoryDescription = input.customCategoryDescription;
  }
  addItem(baseCodes[input.platformCategory], { metadata: baseMetadata });

  addItem(accountStructureCodes[input.accountStructure]);

  addItem(designCodes[input.designApproach]);

  const additionalScreens = Math.max(0, input.screenCount - 5);
  if (additionalScreens > 0) {
    addItem(extraScreenCodes[input.designApproach], {
      quantity: additionalScreens,
      metadata: { includedScreens: 5, informedScreens: input.screenCount }
    });
  }

  const additionalRoles = Math.max(0, input.userRoleCount - 2);
  if (additionalRoles > 0) {
    addItem('WEB_PLATFORM_EXTRA_USER_ROLE', {
      quantity: additionalRoles,
      metadata: { includedUserRoles: 2, informedUserRoles: input.userRoleCount }
    });
  }

  const additionalLanguages = Math.max(0, input.languageCount - 1);
  if (additionalLanguages > 0) {
    addItem('WEB_PLATFORM_EXTRA_LANGUAGE', { quantity: additionalLanguages });
  }

  for (const functionalModule of input.functionalModules) {
    const code = moduleCodes[functionalModule.complexity];
    const configuration = config(code);
    addItem(code, {
      name: `${configuration.name}: ${functionalModule.name}`,
      ...(functionalModule.description === undefined
        ? {}
        : { description: functionalModule.description }),
      metadata: {
        moduleName: functionalModule.name,
        complexity: functionalModule.complexity
      }
    });
  }

  if (input.adminBackoffice === 'STANDARD') addItem('WEB_PLATFORM_BACKOFFICE_STANDARD');
  if (input.adminBackoffice === 'CUSTOM') addItem('WEB_PLATFORM_BACKOFFICE_CUSTOM');

  if (input.dashboardCount > 0) {
    addItem('WEB_PLATFORM_DASHBOARD', { quantity: input.dashboardCount });
  }
  if (input.reportCount > 0) {
    addItem('WEB_PLATFORM_REPORT', { quantity: input.reportCount });
  }

  for (const authentication of input.additionalAuthentication) {
    addItem(additionalAuthenticationCodes[authentication]);
  }
  for (const paymentFeature of input.paymentFeatures) {
    addItem(paymentCodes[paymentFeature]);
  }
  for (const notificationChannel of input.notificationChannels) {
    addItem(notificationCodes[notificationChannel]);
  }

  if (input.fileHandling === 'BASIC_UPLOADS') addItem('WEB_PLATFORM_FILE_BASIC_UPLOADS');
  if (input.fileHandling === 'DOCUMENT_WORKFLOW') {
    addItem('WEB_PLATFORM_FILE_DOCUMENT_WORKFLOW');
  }

  if (input.auditLevel === 'BASIC') addItem('WEB_PLATFORM_AUDIT_BASIC');
  if (input.auditLevel === 'COMPLETE') addItem('WEB_PLATFORM_AUDIT_COMPLETE');

  for (const integration of input.integrations) {
    const code = integrationCodes[integration.complexity];
    const configuration = config(code);
    addItem(code, {
      name: `${configuration.name}: ${integration.name}`,
      ...(integration.description === undefined ? {} : { description: integration.description }),
      metadata: {
        integrationName: integration.name,
        complexity: integration.complexity
      }
    });
  }

  if (input.dataMigration !== 'NONE') {
    const code = input.dataMigration === 'STRUCTURED_IMPORT'
      ? 'WEB_PLATFORM_DATA_MIGRATION_STRUCTURED_IMPORT'
      : 'WEB_PLATFORM_DATA_MIGRATION_LEGACY_MIGRATION';
    addItem(code, { quantity: input.dataMigrationSourceCount });
  }

  if (input.hostingPlan !== 'CLIENT_MANAGED') {
    const plan = input.hostingPlan === 'MJM_STANDARD' ? 'MJM_STANDARD' : 'MJM_MANAGED';
    addItem(`WEB_PLATFORM_HOSTING_${plan}_SETUP`, { adjustableService: false });
    addItem(`WEB_PLATFORM_HOSTING_${plan}_MONTHLY`, { recurring: true });
  }

  if (input.maintenancePlan !== 'NONE') {
    addItem(`WEB_PLATFORM_MAINTENANCE_${input.maintenancePlan}_MONTHLY`, {
      recurring: true
    });
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
