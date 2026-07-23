import { Decimal } from 'decimal.js';

const millisecondsPerDay = 86_400_000;

export type UrgencyLevel = 'NORMAL' | 'PRIORIDADE' | 'EXPRESSO';

export function money(value: Decimal.Value): Decimal {
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

export function calculateUrgencyLevel(
  targetLaunchDate: string | undefined,
  referenceDate: Date,
  options: { rejectPast?: boolean; validateReferenceDateWhenNoTarget?: boolean } = {}
): UrgencyLevel {
  const validatedReferenceDate = options.validateReferenceDateWhenNoTarget
    ? referenceDateTimestamp(referenceDate)
    : undefined;
  if (targetLaunchDate === undefined) return 'NORMAL';

  const daysUntilLaunch = (
    dateOnlyTimestamp(targetLaunchDate) - (validatedReferenceDate ?? referenceDateTimestamp(referenceDate))
  ) / millisecondsPerDay;

  if (options.rejectPast && daysUntilLaunch < 0) {
    throw new Error(`Data de lancamento nao pode estar no passado: ${targetLaunchDate}`);
  }
  if (daysUntilLaunch >= 45) return 'NORMAL';
  if (daysUntilLaunch >= 21) return 'PRIORIDADE';
  return 'EXPRESSO';
}
