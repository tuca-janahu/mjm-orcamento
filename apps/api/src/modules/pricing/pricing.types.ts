import type { Decimal } from 'decimal.js';

export interface PricingConfigValue {
  code: string;
  name: string;
  category: string;
  value: Decimal;
}

export type WebsiteUrgencyLevel = 'NORMAL' | 'PRIORIDADE' | 'EXPRESSO';

export interface WebsitePricingOptions {
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
  metadata?: Record<string, string | number | boolean>;
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
