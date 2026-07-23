export function normalizeComparableName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR');
}

export function hasDuplicateNormalizedNames(values: readonly string[]): boolean {
  const normalizedValues = values.map(normalizeComparableName);
  return new Set(normalizedValues).size !== normalizedValues.length;
}
