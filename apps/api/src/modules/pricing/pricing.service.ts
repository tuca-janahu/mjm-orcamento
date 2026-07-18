import { Decimal } from 'decimal.js';
import { prisma } from '../../shared/prisma/client.js';
import type { PricingConfigValue } from './pricing.types.js';

export async function getActiveWebsitePricing(): Promise<PricingConfigValue[]> {
  const configs = await prisma.pricingConfig.findMany({
    where: { applicationType: 'WEBSITE', active: true },
    orderBy: { code: 'asc' }
  });
  return configs.map((config) => ({
    code: config.code,
    name: config.name,
    category: config.category,
    value: new Decimal(config.value.toString())
  }));
}

export async function listActivePricingConfigs() {
  const configs = await prisma.pricingConfig.findMany({
    where: { active: true },
    orderBy: [{ applicationType: 'asc' }, { category: 'asc' }, { code: 'asc' }]
  });
  return configs.map((config) => ({ ...config, value: config.value.toFixed(4) }));
}
