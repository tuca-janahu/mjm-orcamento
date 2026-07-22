import type { Decimal } from 'decimal.js';

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type PricingConfigType = 'FIXED_VALUE' | 'UNIT_VALUE' | 'MULTIPLIER' | 'PERCENTAGE';

export interface PricingConfigValue {
  code: string;
  name: string;
  category: string;
  value: Decimal;
  configType?: PricingConfigType;
  metadata?: JsonObject;
}

export type WebsiteUrgencyLevel = 'NORMAL' | 'PRIORIDADE' | 'EXPRESSO';

export interface WebsitePricingOptions {
  referenceDate?: Date;
}

export type WebPlatformUrgencyLevel = WebsiteUrgencyLevel;

export interface WebPlatformPricingOptions {
  referenceDate?: Date;
}

export type InternalSystemUrgencyLevel = WebsiteUrgencyLevel;

export interface InternalSystemPricingOptions {
  referenceDate?: Date;
}

export interface CalculatedBudgetItem {
  code: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  unitPrice: Decimal;
  totalPrice: Decimal;
  recurring: boolean;
  displayOrder: number;
  metadata?: JsonObject;
}

export interface PricingResult {
  items: CalculatedBudgetItem[];
  subtotal: Decimal;
  complexityMultiplier: Decimal;
  urgencyMultiplier: Decimal;
  discountPercentage: Decimal;
  finalTotal: Decimal;
  monthlyRecurringTotal: Decimal;
}
