import { imageUrl } from '../services/api/catalogApi';

// Neutral missing-media state; never a photograph of a different product or store.
export const catalogPlaceholder = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="#f8fafc"/><g fill="none" stroke="#94a3b8" stroke-width="5" stroke-linejoin="round"><rect x="247" y="157" width="106" height="86" rx="8"/><circle cx="275" cy="182" r="9"/><path d="m252 235 28-28 23 20 17-17 29 26"/></g><text x="300" y="280" text-anchor="middle" fill="#64748b" font-family="Arial,sans-serif" font-size="20">Sin imagen</text></svg>')}`;

export function catalogImage(url?: string | null) {
  if (!url || typeof url !== 'string' || !url.trim()) return catalogPlaceholder;
  const clean = url.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    return clean;
  }
  return imageUrl(clean) || catalogPlaceholder;
}
