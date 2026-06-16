export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function compactText(value: string, maxLength = 140): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}...`;
}

export function optionIdentity(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function uniqueOptionSorted(values: string[]): string[] {
  const byIdentity = new Map<string, string>();
  values.filter(Boolean).forEach((value) => {
    const normalizedValue = value.replace(/\s+/g, ' ').trim();
    const key = optionIdentity(normalizedValue);
    if (!key) return;
    const existing = byIdentity.get(key);
    if (!existing || optionQuality(normalizedValue) > optionQuality(existing)) {
      byIdentity.set(key, normalizedValue);
    }
  });
  return Array.from(byIdentity.values()).sort((a, b) =>
    a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' }),
  );
}

function optionQuality(value: string): number {
  let score = 0;
  if (!/[ÃÂ�]/.test(value)) score += 4;
  if (/[áéíóúÁÉÍÓÚñÑ]/.test(value)) score += 2;
  if (/^[\w\sÁÉÍÓÚáéíóúÑñ.,/-]+$/.test(value)) score += 1;
  return score;
}
