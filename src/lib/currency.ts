/**
 * Currency utilities for Quickly Delivery
 * Money is stored internally in integer cents (céntimos) to avoid float rounding errors.
 * Currency is Peruvian Sol (PEN), displayed as S/
 */

const penFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats integer cents to Peruvian Soles string (e.g. 1550 -> "S/ 15.50")
 */
export function formatCents(cents: number): string {
  if (isNaN(cents)) return 'S/ 0.00';
  const soles = cents / 100;
  return penFormatter.format(soles);
}

/**
 * Converts decimal soles into integer cents (e.g. 15.50 -> 1550)
 */
export function solesToCents(soles: number): number {
  return Math.round(soles * 100);
}

/**
 * Converts integer cents into decimal soles (e.g. 1550 -> 15.50)
 */
export function centsToSoles(cents: number): number {
  return cents / 100;
}

/**
 * Formats a decimal soles value directly (e.g. 15.5 -> "S/ 15.50")
 */
export function formatPEN(soles: number): string {
  if (isNaN(soles)) return 'S/ 0.00';
  return penFormatter.format(soles);
}
