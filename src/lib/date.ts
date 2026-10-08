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

/**
 * Formats a date/timestamp to a friendly relative Spanish time string
 * (e.g., "Justo ahora", "Hace 5 min", "Hace 2 h", "Hace 3 días")
 */
export function formatRelativeTime(date: string | Date | number): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  if (diffMs < 0) {
    return 'En breve';
  }

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) {
    return 'Justo ahora';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `Hace ${diffMin} ${diffMin === 1 ? 'min' : 'min'}`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return 'Ayer';
  }
  if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  }

  return formatDateTime(d);
}
