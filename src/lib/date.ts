/**
 * Date and time formatting utilities for America/Lima timezone
 */

const TIMEZONE = 'America/Lima';

export function formatDateTime(date: string | Date | number): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDate(date: string | Date | number): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatTime(date: string | Date | number): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getEstimatedDeliveryWindow(prepMinutes = 25, deliveryMinutes = 15): string {
  const totalMinutes = prepMinutes + deliveryMinutes;
  return `${totalMinutes - 5}-${totalMinutes + 10} min`;
}
