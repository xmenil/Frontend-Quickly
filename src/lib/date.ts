/**
 * Date and time formatting utilities for America/Lima timezone
 */

const TIMEZONE = 'America/Lima';

/**
 * Formats a date to standard clean, readable string (e.g., "27 oct. 2026, 07:28 pm")
 */
export function formatDateTime(date: string | Date | number): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const formatted = new Intl.DateTimeFormat('es-PE', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);

  return formatted.replace(/\s+/g, ' ').replace('a. m.', 'am').replace('p. m.', 'pm');
}

/**
 * Formats date only (e.g. "27 oct. 2026")
 */
export function formatDate(date: string | Date | number): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('es-PE', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Formats time only in a clean 12h format (e.g. "07:28 pm")
 */
export function formatTime(date: string | Date | number): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const formatted = new Intl.DateTimeFormat('es-PE', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);

  return formatted.replace(/\s+/g, ' ').replace('a. m.', 'am').replace('p. m.', 'pm');
}

export function getEstimatedDeliveryWindow(prepMinutes = 25, deliveryMinutes = 15): string {
  const totalMinutes = prepMinutes + deliveryMinutes;
  return `${totalMinutes - 5}-${totalMinutes + 10} min`;
}

/**
 * Formats a date/timestamp to a friendly relative Spanish time string
 * (e.g., "Justo ahora", "Hace 5 min", "Hace 2 horas", "Hace 3 días")
 */
export function formatRelativeTime(date: string | Date | number): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

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
    return `Hace ${diffMin} min`;
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

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) {
    return 'Hace 1 sem';
  }
  if (diffWeeks < 4) {
    return `Hace ${diffWeeks} sem`;
  }

  return formatDate(d);
}
