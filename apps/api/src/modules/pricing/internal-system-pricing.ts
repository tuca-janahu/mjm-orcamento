import type { InternalSystemBudgetInput } from '@mjm/shared';
import { Decimal } from 'decimal.js';
import type {
  CalculatedBudgetItem,
  InternalSystemPricingOptions,
  InternalSystemUrgencyLevel,
  JsonObject,
  JsonValue,
  PricingConfigValue,
  PricingResult
} from './pricing.types.js';

const MILLISECONDS_PER_DAY = 86_400_000;

export const internalSystemRequiredPricingCodes = Object.freeze([
  'INTERNAL_SYSTEM_BASE',
  'INTERNAL_SYSTEM_MODULE_SIMPLE',
  'INTERNAL_SYSTEM_MODULE_STANDARD',
  'INTERNAL_SYSTEM_MODULE_COMPLEX',
  'INTERNAL_SYSTEM_EXTRA_ACCESS_PROFILE',
  'INTERNAL_SYSTEM_CUSTOM_PERMISSIONS',
  'INTERNAL_SYSTEM_AUTH_MFA',
  'INTERNAL_SYSTEM_AUTH_CORPORATE_SSO',
  'INTERNAL_SYSTEM_WORKFLOW_SIMPLE',
  'INTERNAL_SYSTEM_WORKFLOW_CUSTOM',
  'INTERNAL_SYSTEM_DOCUMENT_BASIC_ATTACHMENTS',
  'INTERNAL_SYSTEM_DOCUMENT_WORKFLOW',
  'INTERNAL_SYSTEM_EXTRA_DASHBOARD',
  'INTERNAL_SYSTEM_REPORT',
  'INTERNAL_SYSTEM_NOTIFICATION_EMAIL',
  'INTERNAL_SYSTEM_NOTIFICATION_WHATSAPP_SMS',
  'INTERNAL_SYSTEM_INTEGRATION_SIMPLE',
  'INTERNAL_SYSTEM_INTEGRATION_STANDARD',
  'INTERNAL_SYSTEM_INTEGRATION_COMPLEX',
  'INTERNAL_SYSTEM_DATA_MIGRATION_STRUCTURED_IMPORT',
  'INTERNAL_SYSTEM_DATA_MIGRATION_LEGACY',
  'INTERNAL_SYSTEM_HOSTING_MJM_STANDARD_SETUP',
  'INTERNAL_SYSTEM_HOSTING_MJM_MANAGED_SETUP',
  'INTERNAL_SYSTEM_HOSTING_MJM_STANDARD_MONTHLY',
  'INTERNAL_SYSTEM_HOSTING_MJM_MANAGED_MONTHLY',
  'INTERNAL_SYSTEM_MAINTENANCE_ESSENTIAL_MONTHLY',
  'INTERNAL_SYSTEM_MAINTENANCE_STANDARD_MONTHLY',
  'INTERNAL_SYSTEM_MAINTENANCE_CUSTOM_MONTHLY',
  'INTERNAL_SYSTEM_COMPLEXITY_NONE',
  'INTERNAL_SYSTEM_COMPLEXITY_MODERATE',
  'INTERNAL_SYSTEM_COMPLEXITY_HIGH',
  'INTERNAL_SYSTEM_URGENCY_NORMAL',
  'INTERNAL_SYSTEM_URGENCY_PRIORITY',
  'INTERNAL_SYSTEM_URGENCY_EXPRESS'
] as const);

type InternalSystemPricingCode = typeof internalSystemRequiredPricingCodes[number];

const multiplierCodes = new Set<InternalSystemPricingCode>([
  'INTERNAL_SYSTEM_COMPLEXITY_NONE',
  'INTERNAL_SYSTEM_COMPLEXITY_MODERATE',
  'INTERNAL_SYSTEM_COMPLEXITY_HIGH',
  'INTERNAL_SYSTEM_URGENCY_NORMAL',
  'INTERNAL_SYSTEM_URGENCY_PRIORITY',
  'INTERNAL_SYSTEM_URGENCY_EXPRESS'
]);

const moduleCodes: Record<
  InternalSystemBudgetInput['modules'][number]['complexity'],
  InternalSystemPricingCode
> = {
  SIMPLE: 'INTERNAL_SYSTEM_MODULE_SIMPLE',
  STANDARD: 'INTERNAL_SYSTEM_MODULE_STANDARD',
  COMPLEX: 'INTERNAL_SYSTEM_MODULE_COMPLEX'
};

const authenticationCodes: Record<
  InternalSystemBudgetInput['additionalAuthentication'][number],
  InternalSystemPricingCode
> = {
  MFA: 'INTERNAL_SYSTEM_AUTH_MFA',
  CORPORATE_SSO: 'INTERNAL_SYSTEM_AUTH_CORPORATE_SSO'
};

const workflowCodes: Record<
  Exclude<InternalSystemBudgetInput['workflowLevel'], 'NONE'>,
  InternalSystemPricingCode
> = {
  SIMPLE: 'INTERNAL_SYSTEM_WORKFLOW_SIMPLE',
  CUSTOM: 'INTERNAL_SYSTEM_WORKFLOW_CUSTOM'
};

const documentCodes: Record<
  Exclude<InternalSystemBudgetInput['documentManagement'], 'NONE'>,
  InternalSystemPricingCode
> = {
  BASIC_ATTACHMENTS: 'INTERNAL_SYSTEM_DOCUMENT_BASIC_ATTACHMENTS',
  DOCUMENT_WORKFLOW: 'INTERNAL_SYSTEM_DOCUMENT_WORKFLOW'
};

const notificationCodes: Record<
  InternalSystemBudgetInput['additionalNotificationChannels'][number],
  InternalSystemPricingCode
> = {
  EMAIL: 'INTERNAL_SYSTEM_NOTIFICATION_EMAIL',
  WHATSAPP_SMS: 'INTERNAL_SYSTEM_NOTIFICATION_WHATSAPP_SMS'
};

const integrationCodes: Record<
  InternalSystemBudgetInput['integrations'][number]['complexity'],
  InternalSystemPricingCode
> = {
  SIMPLE: 'INTERNAL_SYSTEM_INTEGRATION_SIMPLE',
  STANDARD: 'INTERNAL_SYSTEM_INTEGRATION_STANDARD',
  COMPLEX: 'INTERNAL_SYSTEM_INTEGRATION_COMPLEX'
};

const complexityCodes: Record<
  InternalSystemBudgetInput['complexityAdjustment'],
  InternalSystemPricingCode
> = {
  NONE: 'INTERNAL_SYSTEM_COMPLEXITY_NONE',
  MODERATE: 'INTERNAL_SYSTEM_COMPLEXITY_MODERATE',
  HIGH: 'INTERNAL_SYSTEM_COMPLEXITY_HIGH'
};

const urgencyCodes: Record<InternalSystemUrgencyLevel, InternalSystemPricingCode> = {
  NORMAL: 'INTERNAL_SYSTEM_URGENCY_NORMAL',
  PRIORIDADE: 'INTERNAL_SYSTEM_URGENCY_PRIORITY',
  EXPRESSO: 'INTERNAL_SYSTEM_URGENCY_EXPRESS'
};

interface BaseAllowances {
  includedAccessProfiles: number;
  includedDashboards: number;
  metadataSnapshot: JsonObject;
}

function money(value: Decimal.Value): Decimal {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

function cloneJsonValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map((entry) => cloneJsonValue(entry));
  if (value !== null && typeof value === 'object') return cloneJsonObject(value);
  return value;
}

function cloneJsonObject(value: JsonObject): JsonObject {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, cloneJsonValue(entry)])
  );
}

function isNonNegativeInteger(value: JsonValue | undefined): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function readBaseAllowances(configuration: PricingConfigValue): BaseAllowances {
  const metadata = configuration.metadata;
  if (metadata === undefined) {
    throw new Error(`Metadata ausente para configuracao: ${configuration.code}`);
  }

  const includedFeatures = metadata.includedFeatures;
  if (
    Array.isArray(metadata)
    || !isNonNegativeInteger(metadata.includedAccessProfiles)
    || !isNonNegativeInteger(metadata.includedDashboards)
    || !Array.isArray(includedFeatures)
    || includedFeatures.length === 0
    || !includedFeatures.every(
      (feature) => typeof feature === 'string' && feature.trim().length > 0
    )
  ) {
    throw new Error(`Metadata invalido para configuracao: ${configuration.code}`);
  }

  return {
    includedAccessProfiles: metadata.includedAccessProfiles,
    includedDashboards: metadata.includedDashboards,
    metadataSnapshot: cloneJsonObject(metadata)
  };
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
): InternalSystemUrgencyLevel {
  const normalizedReferenceDate = referenceDateTimestamp(referenceDate);
  if (targetLaunchDate === undefined) return 'NORMAL';

  const daysUntilLaunch = (
    dateOnlyTimestamp(targetLaunchDate) - normalizedReferenceDate
  ) / MILLISECONDS_PER_DAY;

  if (daysUntilLaunch < 0) {
    throw new Error(`Data de lancamento nao pode estar no passado: ${targetLaunchDate}`);
  }
  if (daysUntilLaunch >= 45) return 'NORMAL';
  if (daysUntilLaunch >= 21) return 'PRIORIDADE';
  return 'EXPRESSO';
}

function configurationMapFor(
  configurations: PricingConfigValue[]
): Map<string, PricingConfigValue> {
  const configurationMap = new Map<string, PricingConfigValue>();

  for (const configuration of configurations) {
    if (configurationMap.has(configuration.code)) {
      throw new Error(`Configuracao de preco duplicada: ${configuration.code}`);
    }
    configurationMap.set(configuration.code, configuration);
  }

  for (const code of internalSystemRequiredPricingCodes) {
    const configuration = configurationMap.get(code);
    if (configuration === undefined) {
      throw new Error(`Configuracao de preco ausente: ${code}`);
    }

    if (!configuration.value.isFinite()) {
      throw new Error(`Configuracao de preco invalida: ${code}`);
    }

    if (multiplierCodes.has(code)) {
      if (configuration.value.lte(0)) {
        throw new Error(`Multiplicador deve ser maior que zero: ${code}`);
      }
    } else if (configuration.value.isNegative()) {
      throw new Error(`Configuracao de preco negativa: ${code}`);
    }
  }

  return configurationMap;
}

export function calculateInternalSystemBudget(
  input: InternalSystemBudgetInput,
  configurations: PricingConfigValue[],
  options: InternalSystemPricingOptions = {}
): PricingResult {
  const configurationMap = configurationMapFor(configurations);
  const baseConfiguration = configurationMap.get('INTERNAL_SYSTEM_BASE');
  if (baseConfiguration === undefined) {
    throw new Error('Configuracao de preco ausente: INTERNAL_SYSTEM_BASE');
  }
  const baseAllowances = readBaseAllowances(baseConfiguration);

  const referenceDate = options.referenceDate ?? new Date();
  const urgency = urgencyFor(input.targetLaunchDate, referenceDate);
  const items: CalculatedBudgetItem[] = [];
  let displayOrder = 0;
  let adjustableServiceSubtotal = new Decimal(0);

  function config(code: InternalSystemPricingCode): PricingConfigValue {
    const configuration = configurationMap.get(code);
    if (configuration === undefined) {
      throw new Error(`Configuracao de preco ausente: ${code}`);
    }
    return configuration;
  }

  function addItem(
    code: InternalSystemPricingCode,
    itemOptions: {
      quantity?: number;
      recurring?: boolean;
      adjustableService?: boolean;
      name?: string;
      description?: string;
      metadata?: JsonObject;
    } = {}
  ): void {
    const configuration = config(code);
    const quantity = itemOptions.quantity ?? 1;
    const unitPrice = money(configuration.value);
    const totalPrice = money(unitPrice.times(quantity));
    const recurring = itemOptions.recurring ?? false;

    items.push({
      code,
      name: itemOptions.name ?? configuration.name,
      category: configuration.category,
      quantity,
      unitPrice,
      totalPrice,
      recurring,
      displayOrder: displayOrder++,
      ...(itemOptions.description === undefined
        ? {}
        : { description: itemOptions.description }),
      ...(itemOptions.metadata === undefined ? {} : { metadata: itemOptions.metadata })
    });

    if (!recurring && (itemOptions.adjustableService ?? true)) {
      adjustableServiceSubtotal = adjustableServiceSubtotal.plus(totalPrice);
    }
  }

  addItem('INTERNAL_SYSTEM_BASE', {
    metadata: {
      ...baseAllowances.metadataSnapshot,
      informedAccessProfiles: input.accessProfileCount,
      informedDashboards: input.dashboardCount
    }
  });

  for (const module of input.modules) {
    const code = moduleCodes[module.complexity];
    const configuration = config(code);
    addItem(code, {
      name: `${configuration.name}: ${module.name}`,
      ...(module.description === undefined ? {} : { description: module.description }),
      metadata: {
        moduleName: module.name,
        complexity: module.complexity
      }
    });
  }

  const additionalAccessProfiles = Math.max(
    0,
    input.accessProfileCount - baseAllowances.includedAccessProfiles
  );
  if (additionalAccessProfiles > 0) {
    addItem('INTERNAL_SYSTEM_EXTRA_ACCESS_PROFILE', {
      quantity: additionalAccessProfiles,
      metadata: {
        includedAccessProfiles: baseAllowances.includedAccessProfiles,
        informedAccessProfiles: input.accessProfileCount
      }
    });
  }

  if (input.permissionModel === 'CUSTOM_PERMISSIONS') {
    addItem('INTERNAL_SYSTEM_CUSTOM_PERMISSIONS');
  }

  for (const authentication of input.additionalAuthentication) {
    addItem(authenticationCodes[authentication]);
  }

  if (input.workflowLevel !== 'NONE') addItem(workflowCodes[input.workflowLevel]);
  if (input.documentManagement !== 'NONE') addItem(documentCodes[input.documentManagement]);

  const additionalDashboards = Math.max(
    0,
    input.dashboardCount - baseAllowances.includedDashboards
  );
  if (additionalDashboards > 0) {
    addItem('INTERNAL_SYSTEM_EXTRA_DASHBOARD', {
      quantity: additionalDashboards,
      metadata: {
        includedDashboards: baseAllowances.includedDashboards,
        informedDashboards: input.dashboardCount
      }
    });
  }

  if (input.reportCount > 0) {
    addItem('INTERNAL_SYSTEM_REPORT', { quantity: input.reportCount });
  }

  for (const notificationChannel of input.additionalNotificationChannels) {
    addItem(notificationCodes[notificationChannel]);
  }

  for (const integration of input.integrations) {
    const code = integrationCodes[integration.complexity];
    const configuration = config(code);
    addItem(code, {
      name: `${configuration.name}: ${integration.name}`,
      ...(integration.description === undefined
        ? {}
        : { description: integration.description }),
      metadata: {
        integrationName: integration.name,
        complexity: integration.complexity
      }
    });
  }

  if (input.dataMigration !== 'NONE') {
    const code = input.dataMigration === 'STRUCTURED_IMPORT'
      ? 'INTERNAL_SYSTEM_DATA_MIGRATION_STRUCTURED_IMPORT'
      : 'INTERNAL_SYSTEM_DATA_MIGRATION_LEGACY';
    addItem(code, {
      quantity: input.dataMigrationSourceCount,
      ...(input.dataMigrationDescription === undefined
        ? {}
        : { description: input.dataMigrationDescription }),
      metadata: { migrationType: input.dataMigration }
    });
  }

  if (input.hostingPlan !== 'CLIENT_MANAGED') {
    const plan = input.hostingPlan === 'MJM_STANDARD' ? 'MJM_STANDARD' : 'MJM_MANAGED';
    addItem(`INTERNAL_SYSTEM_HOSTING_${plan}_SETUP`, { adjustableService: false });
    addItem(`INTERNAL_SYSTEM_HOSTING_${plan}_MONTHLY`, { recurring: true });
  }

  if (input.maintenancePlan !== 'NONE') {
    addItem(`INTERNAL_SYSTEM_MAINTENANCE_${input.maintenancePlan}_MONTHLY`, {
      recurring: true
    });
  }

  const subtotal = money(
    items
      .filter((item) => !item.recurring)
      .reduce((total, item) => total.plus(item.totalPrice), new Decimal(0))
  );
  const complexityMultiplier = config(complexityCodes[input.complexityAdjustment]).value;
  const urgencyMultiplier = config(urgencyCodes[urgency]).value;
  const discountPercentage = new Decimal(input.discountPercentage);
  if (!discountPercentage.isFinite() || discountPercentage.lt(0) || discountPercentage.gt(100)) {
    throw new Error('Percentual de desconto deve estar entre zero e cem');
  }

  const discountFactor = new Decimal(1).minus(discountPercentage.dividedBy(100));
  const unadjustedSubtotal = subtotal.minus(adjustableServiceSubtotal);
  const adjustedServiceTotal = adjustableServiceSubtotal
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
