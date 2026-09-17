/**
 * Utility formatters for Indian Manufacturing & Corporate Quality metrics
 *
 * The Intl formatters are module-level singletons: constructing an
 * Intl.NumberFormat / Intl.DateTimeFormat is roughly 50x more expensive than
 * reusing one, and these run per table cell on every render.
 */

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const NUMBER_FORMATTER = new Intl.NumberFormat('en-IN');

const DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return CURRENCY_FORMATTER.format(amount);
}

export function formatNumber(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return '0';
  return NUMBER_FORMATTER.format(value);
}

export function formatPercent(value: number | 'N/A' | undefined | null, decimals: number = 2): string {
  if (value === 'N/A' || value === undefined || value === null || isNaN(Number(value))) {
    return 'N/A';
  }
  return `${Number(value).toFixed(decimals)}%`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return DATE_FORMATTER.format(date);
}
