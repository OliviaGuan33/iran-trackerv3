export function pctClass(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return 'flat';
  if (num > 0) return 'up';
  if (num < 0) return 'down';
  return 'flat';
}
