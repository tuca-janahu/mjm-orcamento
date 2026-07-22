import { Decimal } from 'decimal.js';
import type { ApplicationType } from '@prisma/client';
import { prisma } from '../../shared/prisma/client.js';
import type {
  JsonObject,
  JsonValue,
  PricingConfigValue
} from './pricing.types.js';

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
  ) {
    return true;
  }

  if (Array.isArray(value)) return value.every((entry) => isJsonValue(entry));
  return isJsonObject(value);
}

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.values(value as Record<string, unknown>)
      .every((entry) => isJsonValue(entry));
}

function pricingMetadata(value: unknown, code: string): JsonObject | undefined {
  if (value === null || value === undefined) return undefined;
  if (!isJsonObject(value)) {
    throw new Error(`Metadata de configuracao deve ser um objeto JSON: ${code}`);
  }
  return value;
}

export async function getActivePricing(
  applicationType: ApplicationType
): Promise<PricingConfigValue[]> {
  const configs = await prisma.pricingConfig.findMany({
    where: { applicationType, active: true },
    orderBy: { code: 'asc' }
  });
  return configs.map((config) => {
    const metadata = pricingMetadata(config.metadata, config.code);
    return {
      code: config.code,
      name: config.name,
      category: config.category,
      configType: config.configType,
      value: new Decimal(config.value.toString()),
      ...(metadata === undefined ? {} : { metadata })
    };
  });
}

export async function getActiveWebsitePricing(): Promise<PricingConfigValue[]> {
  return getActivePricing('WEBSITE');
}

export async function listActivePricingConfigs() {
  const configs = await prisma.pricingConfig.findMany({
    where: { active: true },
    orderBy: [{ applicationType: 'asc' }, { category: 'asc' }, { code: 'asc' }]
  });
  return configs.map((config) => ({ ...config, value: config.value.toFixed(4) }));
}
