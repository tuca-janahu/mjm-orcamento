const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

export function formatCurrency(value: string | number): string {
  return currencyFormatter.format(Number(value));
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function labelFromEnum(value: string): string {
  return value
    .toLocaleLowerCase('pt-BR')
    .replaceAll('_', ' ')
    .replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase('pt-BR'));
}

