import { CatalogProduct, CatalogSku, InventoryItem, imageUrl } from '../../services/api/catalogApi';
import { Store, StoreMember } from '../../services/api/operationsApi';
import { prepareImage } from '../../services/media/prepareImage';

export const WEEKDAYS = [
  { day: 1, name: 'Lunes' },
  { day: 2, name: 'Martes' },
  { day: 3, name: 'Miércoles' },
  { day: 4, name: 'Jueves' },
  { day: 5, name: 'Viernes' },
  { day: 6, name: 'Sábado' },
  { day: 7, name: 'Domingo' },
];

export const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';

export const BANNER_PRESETS = [
  {
    label: 'Platos & Gastronomía',
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Parrillas & Brasas',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Café, Cacao & Selva',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Bodega & Abarrotes',
    url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Farmacia & Salud',
    url: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=1200&auto=format&fit=crop&q=80',
  },
];

export const LOGO_PRESETS = [
  {
    label: 'Gourmet',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Brasas',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Café',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Comercio',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80',
  },
];

export const DEFAULT_BANNER = BANNER_PRESETS[0].url;
export const DEFAULT_LOGO = LOGO_PRESETS[0].url;

/**
 * Normaliza teléfonos al formato E.164 requerido por la API (+51...)
 */
export function normalizePhone(phone: string): string {
  const clean = phone.replace(/[\s-]/g, '').trim();
  if (!clean) return '+51999999999';
  if (clean.startsWith('+')) return clean;
  if (clean.startsWith('51') && clean.length >= 11) return '+' + clean;
  return '+51' + clean;
}

/**
 * Formatea un teléfono E.164 para presentación amigable
 */
export function displayPhone(phone?: string | null): string {
  if (!phone) return '';
  const clean = phone.trim();
  if (clean.startsWith('+51') && clean.length === 12) {
    const num = clean.slice(3);
    return `${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
  }
  return clean;
}

/**
 * Resumen legible del horario semanal a partir de los intervalos del backend
 */
export function formatOpeningIntervals(
  intervals?: { weekday: number; opensAt: string; closesAt: string }[]
): string {
  if (!intervals || intervals.length === 0) {
    return 'Sin horario configurado (cerrado)';
  }

  // Agrupar por días
  const daysPresent = new Set(intervals.map((i) => i.weekday));
  const isEveryDay = daysPresent.size === 7;
  const isMonToFri = daysPresent.size === 5 && [1, 2, 3, 4, 5].every((d) => daysPresent.has(d));
  const isMonToSat = daysPresent.size === 6 && [1, 2, 3, 4, 5, 6].every((d) => daysPresent.has(d));

  const first = intervals[0];
  const timeStr = `${first.opensAt} - ${first.closesAt}`;

  if (isEveryDay) return `Lun - Dom: ${timeStr}`;
  if (isMonToSat) return `Lun - Sáb: ${timeStr}`;
  if (isMonToFri) return `Lun - Vie: ${timeStr}`;

  const dayNames = Array.from(daysPresent)
    .sort()
    .map((d) => WEEKDAYS.find((w) => w.day === d)?.name.slice(0, 3))
    .filter(Boolean)
    .join(', ');

  return `${dayNames}: ${timeStr}`;
}

/**
 * Convierte un URL externo (preseteado o personalizado) a base64 PNG para la API de branding
 */
export async function urlToPreparedImage(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('No se pudo descargar la imagen desde el enlace proporcionado.');
  const blob = await res.blob();
  const file = new File([blob], 'image.png', { type: blob.type || 'image/png' });
  return prepareImage(file);
}

/**
 * Determina si el rol del usuario en la tienda le concede permisos de administración/edición
 */
export function canManageStore(role?: string): boolean {
  return role === 'owner' || role === 'manager' || role === 'admin';
}

/**
 * Determina si el rol del usuario le permite administrar integrantes/equipo
 */
export function canManageMembers(role?: string): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Calcula el stock total disponible de un producto sumando las existencias de sus SKUs
 */
export function getProductStock(product: CatalogProduct, inventory?: InventoryItem[]): number {
  if (!inventory || inventory.length === 0) {
    return product.skus.reduce((sum, sku) => sum + (sku.availableStock || 0), 0);
  }
  const matching = inventory.filter((item) => item.productId === product.id);
  if (matching.length === 0) {
    return product.skus.reduce((sum, sku) => sum + (sku.availableStock || 0), 0);
  }
  return matching.reduce((sum, item) => sum + item.available, 0);
}

/**
 * Obtiene la imagen principal de un producto a partir de sus imágenes
 */
export function getProductMainImage(product: CatalogProduct): string {
  if (!product.images || product.images.length === 0) return DEFAULT_PRODUCT_IMAGE;
  const sorted = [...product.images].sort((a, b) => a.position - b.position);
  const found = sorted[0]?.url;
  return found ? imageUrl(found) || DEFAULT_PRODUCT_IMAGE : DEFAULT_PRODUCT_IMAGE;
}

/**
 * Obtiene las URLs de galería de un producto
 */
export function getProductGalleryImages(product: CatalogProduct): string[] {
  if (!product.images || product.images.length === 0) return [DEFAULT_PRODUCT_IMAGE];
  const sorted = [...product.images].sort((a, b) => a.position - b.position);
  const urls = sorted.map((img) => imageUrl(img.url)).filter(Boolean);
  return urls.length > 0 ? urls : [DEFAULT_PRODUCT_IMAGE];
}

