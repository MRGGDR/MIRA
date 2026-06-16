export function todayIso(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

export function isBeforeToday(date: string): boolean {
  return Boolean(date) && date < todayIso();
}

export function formatDate(date: string): string {
  if (!date) return 'Sin fecha';
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}
